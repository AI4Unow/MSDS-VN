---
phase: 05
name: LLM Wiki v0 — Regulatory Knowledge Base
week: 6
priority: P0
status: not-started
---

# Phase 05 — LLM Wiki v0

## Context
- Brainstorm §6 (LLM Wiki — the moat)
- Existing: `wiki/schema.md` (v0.1) — READ FIRST
- Karpathy pattern: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Depends on: Phase 04 (chemicals master)

## Overview
Bootstrap the compounding regulatory knowledge base. Postgres `wiki_pages` table (+ nightly git snapshot for history). Seed with **Circular 01/2026/TT-BCT** (Appendix I = SDS template, Appendix XV = classification, Appendix XIX = priority hazardous chemicals), Law on Chemicals 2025, Decree 26/2026/ND-CP, GHS Rev 10, and 50 common chemicals. Build ingest + query + maintenance workflows.

## Regulatory Seeds (2026 Framework — read `Thông-tư-01-2026-TT-BCT.docx` at repo root)
- **`regulations/vn-law-on-chemicals-2025.md`** — Law on Chemicals 2025 (69/2025/QH15, effective Jan 1 2026)
- **`regulations/vn-decree-26-2026-nd-cp.md`** — management of chemical activities + hazardous chemicals in products
- **`regulations/vn-decree-24-2026-nd-cp.md`** — regulated chemical lists (Groups 1 & 2 special control)
- **`regulations/vn-decree-25-2026-nd-cp.md`** — green chemical industry + safety/security
- **`regulations/vn-circular-01-2026-tt-bct.md`** — MOIT implementing rules (SDS content = Appendix I, classification = Appendix XV, priority disclosure = Appendix XIX)
- **`regulations/vn-circular-02-2026-tt-bct.md`** — consultancy certificates + incident prevention
- **`regulations/vn-decree-42-2020-nd-cp.md`** — hazardous goods transport (still in force)
- **`regulations/ghs-rev-10.md`** — UN ECE Purple Book
- **`regulations/echa-svhc-list.md`** — current SVHC list
- **`templates/moit-safety-card-template.md`** — Appendix I of Circular 01/2026/TT-BCT

## Requirements
- `wiki_pages` + `wiki_embeddings` tables
- Embeddings pipeline (OpenAI text-embedding-3-small OR Voyage — benchmark both)
- Seed scripts for VN regulations + 50 common chemicals
- Ingest workflow: new SDS → LLM updates/creates `chemicals/<cas>.md`
- Query workflow (Phase 07 consumer): hybrid search (tsvector + pgvector)
- Nightly maintenance Inngest cron: lint for contradictions, stale claims, orphans
- Admin-only wiki editor UI

## Related Files
**Create:**
- `supabase/migrations/0005_wiki.sql`
- `src/lib/wiki/schema.ts` — TS types mirroring schema.md
- `src/lib/wiki/ingest.ts` — upsert page + re-embed
- `src/lib/wiki/embeddings.ts` — provider abstraction
- `src/lib/wiki/linter.ts` — contradiction + staleness checks
- `src/inngest/functions/wiki-ingest-from-sds.ts`
- `src/inngest/functions/wiki-nightly-lint.ts`
- `src/app/(app)/wiki/page.tsx` — index browser
- `src/app/(app)/wiki/[...slug]/page.tsx` — page viewer
- `src/app/(admin)/wiki/edit/[...slug]/page.tsx` — admin editor
- `scripts/seed-wiki-regulations.ts`
- `scripts/seed-wiki-chemicals-top50.ts`
- `wiki/raw-sources/Thông-tư-01-2026-TT-BCT.docx` — copy from repo root
- All `wiki/regulations/*.md` listed above

**Modify:**
- `wiki/schema.md` — update to reflect 2026 regulatory framework (Circular 01/2026 replaces 32/2017)
- `src/inngest/functions/enrich-chemical.ts` (Phase 04) — on new CAS, also enqueue `wiki.ingest-chemical`

## Data Model (migration 0005)
```sql
create table wiki_pages (
  slug text primary key,                -- "chemicals/108-88-3-toluene"
  category text not null,               -- "chemicals" | "regulations" | "hazards" | "countries" | "topics" | "templates"
  title text not null,
  frontmatter jsonb not null,
  content_md text not null,
  cited_by jsonb default '[]',          -- [{page: slug, count: int}]
  source_urls text[],
  version int default 1,
  updated_by text default 'llm',        -- 'llm' | 'human:{user_id}'
  updated_at timestamptz default now()
);

create index on wiki_pages(category);
create index on wiki_pages using gin(to_tsvector('simple', title || ' ' || content_md));

create table wiki_embeddings (
  page_slug text not null references wiki_pages(slug) on delete cascade,
  chunk_idx int not null,
  chunk_text text not null,
  embedding vector(1536),
  primary key (page_slug, chunk_idx)
);
create index on wiki_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- public read (read-only knowledge)
alter table wiki_pages enable row level security;
alter table wiki_embeddings enable row level security;
create policy "public read wiki" on wiki_pages for select using (true);
create policy "public read embeddings" on wiki_embeddings for select using (true);
```

## Implementation Steps
1. Apply migration 0005
2. Resolve brainstorm UQ #6 (embedding model):
   - Benchmark: OpenAI `text-embedding-3-small` vs Voyage `voyage-3` on 100 chemistry Q&A pairs
   - Pick by: cost × MRR (mean reciprocal rank) × latency
   - Document choice in `docs/system-architecture.md`
3. Implement `embeddings.ts` provider abstraction (pluggable)
4. Write `seed-wiki-regulations.ts`:
   - Extract text from `Thông-tư-01-2026-TT-BCT.docx` using python-docx or Claude
   - Summarize into sectioned markdown per `wiki/schema.md` format
   - Write regulation pages listed above (law, 3 decrees, 2 circulars, GHS, ECHA, transport)
   - CRITICAL: `vn-circular-01-2026-tt-bct.md` must include `supersedes` frontmatter listing repealed 32/2017 + 17/2022
5. Write `seed-wiki-chemicals-top50.ts`:
   - Pull top 50 common industrial chemicals (toluene, methanol, HCl, NaOH, H2SO4, acetone, ethanol, xylene, IPA, NH3, etc.)
   - For each: read from `chemicals` table (Phase 04) → Claude synthesizes body per chemical page template → upsert wiki_page
6. Implement `wiki-ingest-from-sds` Inngest function:
   - Triggered by `chemical.enriched` event
   - Read chemical row → generate/update `chemicals/<cas>-<slug>.md`
   - Chunk + embed → upsert wiki_embeddings
   - Append to `log.md` (or `wiki_log` table)
7. Implement `wiki-nightly-lint` cron (Inngest scheduled):
   - Fetch all pages updated in last 7d
   - Claude checks for: contradictions with other pages, stale claims (dates >2yr old), orphans (no inbound citations)
   - Flag issues in `wiki_lint_findings` table for admin review
8. Build wiki browser UI:
   - `/wiki` — category index
   - `/wiki/{slug}` — rendered markdown with citation backlinks
   - `/admin/wiki/edit/{slug}` — admin markdown editor (admin role only)
9. Update the existing `wiki/schema.md` to include `amended_by` frontmatter field for regulation pages and fix legacy references
10. Test: upload a new SDS → chemical enriched → wiki page for that chemical appears within 2 minutes

## Todo List
- [ ] Migration 0005
- [ ] Embedding provider benchmark + pick
- [ ] Fix legacy 32/2017-only refs → all now cite Circular 01/2026
- [ ] Add `supersedes` field to schema.md regulation type
- [ ] Seed regulations (10 pages — extract from Thông-tư-01-2026-TT-BCT.docx)
- [ ] Seed 50 common chemicals
- [ ] Ingest-from-SDS Inngest function
- [ ] Nightly lint cron
- [ ] Wiki browser UI (public read)
- [ ] Admin wiki editor
- [ ] Nightly git snapshot job (post-MVP optional, stub now)

## Success Criteria
- Wiki contains ≥50 chemical pages + 10 regulation pages seeded
- Every regulation page correctly cites the 2026 framework; superseded regulations marked in frontmatter
- Embedding search returns relevant pages for test queries: "Is toluene SVHC?", "What PPE for HCl?", "MOIT safety card requirements under Circular 01/2026"
- Ingest workflow: new SDS → new/updated chemical wiki page within 2 minutes
- Nightly lint produces at most 5 false-positive findings / 100 pages

## Risk Assessment
- **Risk:** Claude hallucinates regulatory facts. **Mitigation:** All regulation pages manually reviewed by VN EHS consultant retainer before going live in chat.
- **Risk:** Wiki drift over time. **Mitigation:** Nightly lint + `source_urls` requirement + version field.
- **Risk:** Embedding provider lock-in. **Mitigation:** Provider abstraction; re-embedding is idempotent.

## Security Considerations
- Wiki pages are public-read (global knowledge) — no tenant data leakage
- Admin editor gated by `role='admin'` in users table
- Raw-source PDFs tracked in git during MVP; move to Supabase Storage post-MVP

## Next Steps
→ Phase 06: VI Safety Card Generator (consumes `templates/moit-safety-card-template.md`)

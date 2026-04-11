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

> **Retrieval decision (KISS):** Following Karpathy's pattern literally — **NO vector embeddings**. At ≤hundreds of pages, a curated `index.md` catalog + LLM reading the index to pick relevant pages beats embedding-based RAG. Quote from the gist: *"This works surprisingly well at moderate scale (~100 sources, ~hundreds of pages) and avoids the need for embedding-based RAG infrastructure."* Upgrade path (post-MVP, if >500 pages): add Postgres `tsvector` BM25 OR adopt `qmd` (hybrid BM25 + vector + re-rank, on-device). No pgvector / Voyage / OpenAI embeddings needed in MVP.

## Regulatory Seeds (2026 Framework — source docs at `plans/260411-0732-sds-platform/wiki/regulations/raw-sources/`)
All source documents acquired and verified final (2026-04-11, red team blocker #2 resolved).
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
- `wiki_pages` table (no embeddings table)
- **`index.md` as the retrieval layer** — curated, LLM-maintained catalog organized by category, one-line summary per page; must fit comfortably in a Claude prompt (target <8k tokens)
- Seed scripts for VN regulations + 50 common chemicals
- Ingest workflow: new SDS → LLM updates/creates `chemicals/<cas>.md` → LLM updates `index.md`
- Query workflow (Phase 07 consumer): LLM reads `index.md` → picks relevant pages → reads them → answers with citations
- Nightly maintenance Inngest cron: lint for contradictions, stale claims, orphans, index drift
- Admin-only wiki editor UI

## Related Files
**Create:**
- `supabase/migrations/0005_wiki.sql`
- `src/lib/wiki/schema.ts` — TS types mirroring schema.md
- `src/lib/wiki/ingest.ts` — upsert page + update index.md
- `src/lib/wiki/index-builder.ts` — reads all pages, generates/updates `index.md` row
- `src/lib/wiki/linter.ts` — contradiction + staleness + index drift checks
- `src/inngest/functions/wiki-ingest-from-sds.ts`
- `src/inngest/functions/wiki-nightly-lint.ts`
- `src/app/(app)/wiki/page.tsx` — index browser
- `src/app/(app)/wiki/[...slug]/page.tsx` — page viewer
- `src/app/(admin)/wiki/edit/[...slug]/page.tsx` — admin editor
- `scripts/seed-wiki-regulations.ts`
- `scripts/seed-wiki-chemicals-top50.ts`
- All `wiki/regulations/*.md` listed above (raw sources already at `wiki/regulations/raw-sources/`)

**Modify:**
- `wiki/schema.md` — update to reflect 2026 regulatory framework (Circular 01/2026 replaces 32/2017)
- `src/inngest/functions/enrich-chemical.ts` (Phase 04) — on new CAS, also enqueue `wiki.ingest-chemical`

## Data Model (migration 0005)
```sql
create table wiki_pages (
  slug text primary key,                -- "chemicals/108-88-3-toluene", "index", "log", "schema"
  category text not null,               -- "chemicals" | "regulations" | "hazards" | "countries" | "topics" | "templates" | "meta"
  title text not null,
  one_liner text,                       -- fed into index.md, keep ≤120 chars
  frontmatter jsonb not null,
  content_md text not null,
  cited_by jsonb default '[]',          -- [{page: slug, count: int}]
  source_urls text[],
  version int default 1,
  updated_by text default 'llm',        -- 'llm' | 'human:{user_id}'
  updated_at timestamptz default now()
);

create index on wiki_pages(category);
-- Keep tsvector for admin search UI + future BM25 fallback; not used for chat retrieval in MVP
create index on wiki_pages using gin(to_tsvector('simple', title || ' ' || content_md));

-- public read (read-only knowledge)
alter table wiki_pages enable row level security;
create policy "public read wiki" on wiki_pages for select using (true);

-- NO wiki_embeddings table. NO pgvector required. Retrieval = LLM reads index.md page.
```

## Implementation Steps
1. Apply migration 0005
2. **UQ #6 resolved — no embedding model needed.** Document decision in `docs/system-architecture.md`: "Per Karpathy LLM Wiki pattern, retrieval is index-driven at MVP scale. No embeddings; no vector DB. Reassess at ~500 pages or if index.md grows beyond ~8k tokens."
3. Implement `index-builder.ts`:
   - Read all wiki_pages
   - Group by category
   - Emit markdown: `- [title](slug) — one_liner` under each category heading
   - Upsert result as `wiki_pages` row with `slug='index'`
   - Assertion: total index size <12k chars (warn at 10k, hard-fail at 15k → triggers split-index migration)
4. Write `seed-wiki-regulations.ts`:
   - Extract text from `wiki/regulations/raw-sources/Thông-tư-01-2026-TT-BCT.docx` and `Nghị-định-26-2026-NĐ-CP.docx` using python-docx or Claude file upload
   - Summarize into sectioned markdown per `wiki/schema.md` format
   - Write regulation pages listed above (law, 3 decrees, 2 circulars, GHS, ECHA, transport)
   - CRITICAL: `vn-circular-01-2026-tt-bct.md` must include `supersedes` frontmatter listing repealed 32/2017 + 17/2022
5. Write `seed-wiki-chemicals-top50.ts`:
   - Pull top 50 common industrial chemicals (toluene, methanol, HCl, NaOH, H2SO4, acetone, ethanol, xylene, IPA, NH3, etc.)
   - For each: read from `chemicals` table (Phase 04) → Claude synthesizes body per chemical page template → upsert wiki_page with concise `one_liner`
6. Run `index-builder` once to materialize `index.md` after all seeds
7. Implement `wiki-ingest-from-sds` Inngest function:
   - Triggered by `chemical.enriched` event
   - Read chemical row → generate/update `chemicals/<cas>-<slug>.md` with `one_liner`
   - Re-run `index-builder` (debounced via Inngest throttle: rebuild at most once per 60s)
   - Append to `wiki_log` table
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
- [ ] Migration 0005 (wiki_pages only — NO embeddings table)
- [ ] Document retrieval decision in `docs/system-architecture.md`
- [ ] `index-builder.ts` with size assertion
- [ ] Fix legacy 32/2017-only refs → all now cite Circular 01/2026
- [ ] Add `supersedes` + `one_liner` fields to schema.md
- [ ] ~~Acquire remaining raw sources~~ — **DONE** (all acquired 2026-04-11)
- [ ] Seed regulations (10 pages — extract from raw-sources/*.docx)
- [ ] Seed 50 common chemicals
- [ ] Materialize `index.md` after seeding
- [ ] Ingest-from-SDS Inngest function (with index rebuild throttle)
- [ ] Nightly lint cron (include index drift check)
- [ ] Wiki browser UI (public read)
- [ ] Admin wiki editor
- [ ] Nightly git snapshot job (post-MVP optional, stub now)

## Success Criteria
- Wiki contains ≥50 chemical pages + 10 regulation pages seeded
- `index.md` generated, <8k tokens, covers every page
- Every regulation page correctly cites the 2026 framework; superseded regulations marked in frontmatter
- Manual test: given `index.md` + test questions ("Is toluene in Appendix XIX?", "What PPE for HCl?", "MOIT safety card requirements under Circular 01/2026"), Claude correctly selects the right pages to read
- Ingest workflow: new SDS → new/updated chemical wiki page + refreshed index within 2 minutes
- Nightly lint produces at most 5 false-positive findings / 100 pages

## Risk Assessment
- **Risk:** Claude hallucinates regulatory facts. **Mitigation:** All regulation pages manually reviewed by VN EHS consultant retainer before going live in chat.
- **Risk:** Wiki drift over time. **Mitigation:** Nightly lint + `source_urls` requirement + version field.
- **Risk:** `index.md` outgrows Claude prompt budget as wiki scales past ~500 pages. **Mitigation:** Hard-fail assertion in builder at 15k chars; upgrade path = split index into category sub-indices OR adopt qmd / Postgres BM25 (still no embeddings).

## Security Considerations
- Wiki pages are public-read (global knowledge) — no tenant data leakage
- Admin editor gated by `role='admin'` in users table
- Raw-source PDFs tracked in git during MVP; move to Supabase Storage post-MVP

## Next Steps
→ Phase 06: VI Safety Card Generator (consumes `templates/moit-safety-card-template.md`)

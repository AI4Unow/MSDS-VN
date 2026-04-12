---
phase: 05
name: LLM Wiki v0 — Regulatory Knowledge Base
week: 6
priority: P0
status: complete
progress: 100%
completed: 2026-04-12
---

# Phase 05 — LLM Wiki v0

## Context
- Brainstorm §6 (LLM Wiki — the moat)
- Existing: `wiki/schema.md` (v0.1) — READ FIRST
- Karpathy pattern: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Depends on: Phase 04 (chemicals master), Phase 01 `docs/design-guidelines.md`

## Frontend Build Protocol
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before building `/wiki` UI. Specifics: treat wiki as **editorial / documentation** (think Stripe Docs × MDN) — generous line-height, max prose width ~72ch, proper heading hierarchy (h1→h6 sequential — a11y rule), inline code style distinct from body, anchor links on hover. Admin markdown editor = split-pane preview, monospace body font in the editor pane (`Geist Mono`), keyboard shortcut save (`⌘S`). Category index page uses typographic hierarchy + dividers, not cards (anti-slop at density 6).

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
- `wiki_pages` table (no embeddings table) — stores every page including `index`, `log`, `schema` as Karpathy's pattern requires
- **`index.md` as the retrieval layer** — curated, LLM-maintained catalog organized by category, one-line summary per page; must fit comfortably in a Gemini prompt (target <8k tokens)
- **`log.md` as the chronological audit trail** — append-only wiki page (not a side-table) with consistent line prefixes (`INGEST …`, `QUERY …`, `LINT …`, `PROMOTE …`) so Gemini can parse recent activity during lint. Newest entries on top (prepend-mode). **No truncation** — full history lives in `wiki_pages.contentMd` forever. Lint and query flows slice the top ~8 KB (≈100 recent lines); the `/wiki/log` UI paginates for full history.
- Seed scripts for VN regulations + 50 common chemicals
- Ingest workflow: new SDS → LLM updates/creates `chemicals/<cas>.md` → LLM **revises related `hazards/*.md`, `regulations/*.md` cross-refs** (the compounding step — up to 15 pages per ingest) → LLM updates `index.md` → appends to `log.md`
- Query workflow (Phase 07 consumer): LLM reads `index.md` → picks relevant pages → reads them → answers with citations → (admin) may promote a valuable answer to a `topics/*.md` wiki page
- Nightly maintenance Inngest cron: lint for contradictions, stale claims, orphans, dangling cross-refs, index drift; append `LINT` line to `log.md`
- Admin-only wiki editor UI + "Promote chat answer to wiki" action (consumed by Phase 07)

## Stack Note (2026-04-12)
- Schema defined via Drizzle; Supabase migrations deleted.
- Summarization + linting now use **Vercel AI SDK + Gemini** (`generateObject` / `generateText` with `gemini-3-flash-preview`) — no Anthropic SDK.
- `wiki_pages` remains globally-readable; access from server-only code, no RLS.

## Related Files
**Create:**
- `src/lib/db/schema/wiki.ts` — Drizzle schema
- `drizzle/migrations/0004_wiki.sql` — generated
- `src/lib/wiki/schema.ts` — TS types mirroring schema.md
- `src/lib/wiki/ingest.ts` — upsert page + cross-revise related pages + update index.md + append log.md
- `src/lib/wiki/index-builder.ts` — reads all pages, generates/updates `index.md` row
- `src/lib/wiki/log-writer.ts` — append-to-top helper that upserts the `slug='log'` row with consistent prefixes
- `src/lib/wiki/linter.ts` — contradiction + staleness + dangling-xref + index drift checks
- `src/lib/wiki/promote-from-chat.ts` — turns an approved chat answer into a `topics/*.md` wiki page (consumed by Phase 07 admin UI)
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

## Data Model (Drizzle — `src/lib/db/schema/wiki.ts`)
```ts
// Karpathy pattern: `index`, `log`, and `schema` are wiki pages too (slug = the filename stem).
// `index` and `log` are materialized by Inngest; `schema` is seeded from `wiki/schema.md`.
export const wikiPages = pgTable('wiki_pages', {
  slug: text('slug').primaryKey(),        // "chemicals/108-88-3-toluene", "index", "log", "schema"
  category: text('category').notNull(),   // "chemicals" | "regulations" | "hazards" | "countries" | "topics" | "templates" | "meta"
  title: text('title').notNull(),
  oneLiner: text('one_liner'),            // fed into index.md, keep ≤120 chars
  frontmatter: jsonb('frontmatter').notNull(),
  contentMd: text('content_md').notNull(),
  citedBy: jsonb('cited_by').default('[]').notNull(),     // [{page: slug, count}]
  sourceUrls: text('source_urls').array(),
  version: integer('version').default(1).notNull(),
  updatedBy: text('updated_by').default('llm').notNull(), // 'llm' | 'human:{user_id}'
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  categoryIdx: index().on(t.category),
  searchIdx: index('wiki_pages_search_gin').using(
    'gin',
    sql`to_tsvector('simple', ${t.title} || ' ' || ${t.contentMd})`,
  ),
}));
```

**Access (no RLS):**
- `wiki_pages` is globally readable — **intentionally no `org_id` column at MVP**. All reads happen in server code (RSC / tool handlers for chat agent in Phase 07). No client-direct queries.
- Writes only from Inngest functions (`wiki-ingest-from-sds`, `wiki-nightly-lint`) and the admin editor (gated by `requireAdmin()` — a thin wrapper around `requireOrg()` that also checks `users.role === 'admin'`; add role column to users if not present).
- **NO** `wiki_embeddings` table. **NO** pgvector. Retrieval = LLM reads `index.md` page.

**Upgrade path — per-org private overlays (post-MVP, when first customer asks for private SOPs):**
- Add nullable `orgId uuid` column to `wiki_pages` (`null` = global, uuid = private-to-org).
- Update all read queries to `WHERE org_id IS NULL OR org_id = $currentOrg`.
- Update `index-builder.ts` to generate per-org `index.md` rows (slug = `index` for global, `orgs/<id>/index` for private) — Phase 07 chat tools pick the right one based on session.
- Promote-to-wiki gains an org-scope toggle in the admin UI.
- Trigger: first enterprise customer requesting private regulatory knowledge. Estimated migration effort: half a day. Flagged here so the shape of the solution is known — do not implement speculatively.

## Implementation Steps
1. Add Drizzle schema in `src/lib/db/schema/wiki.ts`; `drizzle-kit generate` → migration 0004; apply.
2. **UQ #6 resolved — no embedding model needed.** Document decision in `docs/system-architecture.md`: "Per Karpathy LLM Wiki pattern, retrieval is index-driven at MVP scale. No embeddings; no vector DB. Reassess at ~500 pages or if index.md grows beyond ~8k tokens."
3. Implement `index-builder.ts`:
   - Read all wiki_pages
   - Group by category
   - Emit markdown: `- [title](slug) — one_liner` under each category heading
   - Upsert result as `wiki_pages` row with `slug='index'`
   - Assertion: total index size <12k chars (warn at 10k, hard-fail at 15k → triggers split-index migration)
4. Write `scripts/seed-wiki-regulations.ts`:
   - Extract text from `wiki/regulations/raw-sources/Thông-tư-01-2026-TT-BCT.docx` and `Nghị-định-26-2026-NĐ-CP.docx` using `mammoth` (docx → markdown) — no Claude file upload; pass extracted markdown to Gemini for summarization instead
   - Use `generateText` with `gemini-3-flash-preview` to summarize into sectioned markdown per `wiki/schema.md`
   - Write regulation pages listed above (law, 3 decrees, 2 circulars, GHS, ECHA, transport)
   - CRITICAL: `vn-circular-01-2026-tt-bct.md` must include `supersedes` frontmatter listing repealed 32/2017 + 17/2022
5. Write `scripts/seed-wiki-chemicals-top50.ts`:
   - Pull top 50 common industrial chemicals (toluene, methanol, HCl, NaOH, H2SO4, acetone, ethanol, xylene, IPA, NH3, etc.)
   - For each: read from `chemicals` table (Phase 04) → Gemini (`generateText`) synthesizes body per chemical page template → upsert wiki_page with concise `one_liner`
6. Run `index-builder` once to materialize `index.md` after all seeds. Also materialize the empty `log.md` page (`slug='log'`, category='meta') so Karpathy's log-first pattern is available from day one.
7. Implement `wiki-ingest-from-sds` Inngest function (follows Karpathy ingest workflow literally — see `wiki/schema.md` §7):
   - Triggered by `chemical.enriched` event
   - **Step A — Read raw**: fetch enriched chemical row + the `sds_extractions` section_3 components that referenced it
   - **Step B — Summarize**: Gemini (`generateText`, `gemini-3-flash-preview`) drafts or updates `chemicals/<cas>-<slug>.md` with `one_liner` and `## Cross-references` block
   - **Step C — Revise related pages** (this is the "10-15 pages" compounding step Karpathy calls out): for each GHS hazard category on the chemical, Gemini reads the matching `hazards/h<code>.md` page and appends the chemical to its "Common chemicals" cross-ref list; same pass updates `regulations/*` pages if the chemical is in Appendix XIX / Decree 24-2026 lists. Bound at ≤15 page revisions per ingest (cost cap).
   - **Step D — Rebuild index**: re-run `index-builder` (debounced via Inngest throttle — at most once per 60s)
   - **Step E — Append log**: prepend a line to the `log.md` wiki page with the consistent prefix `INGEST {iso-date} sds=<id> cas=<cas> pages-touched=<n>` via upsert of the `wiki_pages` row where `slug='log'`. Prepend (newest on top) so `contentMd.slice(0, 8_000)` always surfaces recent events for lint/query. No truncation — full history retained. Format must stay in sync with `wiki/schema.md` §7.
7. Implement `wiki-nightly-lint` cron (Inngest scheduled — Karpathy lint operation):
   - Read `log.md` head (last 24h of changes) — not a table scan; the log page IS the audit trail
   - Fetch all pages updated in last 7d
   - Gemini Flash checks for: contradictions with other pages, stale claims (dates >2yr old), orphans (no inbound citations), dangling cross-refs, index drift
   - Flag issues in `wiki_lint_findings` table for admin review
   - Prepend lint summary to `log.md` with prefix `LINT {iso-date} dangling=<n> orphans=<n> contradictions=<n>`
8. Build wiki browser UI:
   - `/wiki` — category index
   - `/wiki/{slug}` — rendered markdown with citation backlinks
   - `/admin/wiki/edit/{slug}` — authenticated markdown editor
9. Update the existing `wiki/schema.md` to include `amended_by` frontmatter field for regulation pages and fix legacy references
10. Test: upload a new SDS → chemical enriched → wiki page for that chemical appears within 2 minutes

## Todo List
- [x] Drizzle schema + migration 0004 (wiki_pages only — NO embeddings table)
- [x] Document retrieval decision in `docs/system-architecture.md`
- [x] `index-builder.ts` with size assertion
- [x] Fix legacy 32/2017-only refs → all now cite Circular 01/2026
- [x] Add `supersedes` + `one_liner` fields to schema.md
- [x] ~~Acquire remaining raw sources~~ — **DONE** (all acquired 2026-04-11)
- [x] Seed regulations (10 pages — extract from raw-sources/*.docx)
- [x] Seed 50 common chemicals
- [x] Materialize `index.md` + empty `log.md` + `schema` wiki rows after seeding
- [x] `log-writer.ts` append-to-top helper (consistent prefixes: INGEST / QUERY / LINT / PROMOTE)
- [x] Ingest-from-SDS Inngest function (with cross-page revision + index rebuild throttle + log append)
- [x] Nightly lint cron (contradictions, stale, orphans, dangling xrefs, index drift) → appends to log.md
- [x] `promote-from-chat.ts` — creates `topics/*.md` from approved chat answer
- [x] Wiki browser UI (public read) — include `/wiki/log` and `/wiki/index` views
- [x] Admin wiki editor
- [x] Nightly git snapshot job (post-MVP optional, stub now)

## Success Criteria
- Wiki contains ≥50 chemical pages + 10 regulation pages + `index`, `log`, `schema` meta pages seeded
- `index.md` generated, <8k tokens, covers every page
- `log.md` present with newest-first consistent-prefix entries (`INGEST`, `QUERY`, `LINT`, `PROMOTE`); nightly lint reads its head for the 24h delta
- Every regulation page correctly cites the 2026 framework; superseded regulations marked in frontmatter
- Manual test: given `index.md` + test questions ("Is toluene in Appendix XIX?", "What PPE for HCl?", "MOIT safety card requirements under Circular 01/2026"), Gemini correctly selects the right pages to read
- Ingest workflow: new SDS → new/updated chemical wiki page + at least one cross-referenced hazard/regulation page revised + refreshed index + `INGEST` log line — all within 2 minutes
- Nightly lint produces at most 5 false-positive findings / 100 pages

## Risk Assessment
- **Risk:** Gemini hallucinates regulatory facts. **Mitigation:** All regulation pages manually reviewed by VN EHS consultant retainer before going live in chat.
- **Risk:** Wiki drift over time. **Mitigation:** Nightly lint + `source_urls` requirement + version field.
- **Risk:** `index.md` outgrows Gemini prompt budget as wiki scales past ~500 pages. **Mitigation:** Hard-fail assertion in builder at 15k chars; upgrade path = split index into category sub-indices OR adopt qmd / Postgres BM25 (still no embeddings).

## Security Considerations
- Wiki pages are globally readable (server-only access) — no tenant data leakage
- Admin editor gated by `requireAdmin()` (session + role check)
- Raw-source DOCX/PDFs tracked in git during MVP; move to Vercel Blob post-MVP

## Next Steps
→ Phase 06: VI Safety Card Generator (consumes `templates/moit-safety-card-template.md`)

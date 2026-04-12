# Wiki Implementation Scout — EXISTS vs MISSING

**Date:** 2026-04-11 20:43  
**Scope:** Wiki architecture, UI, backend, seed data  
**Thoroughness:** Medium

---

## SUMMARY

**EXISTS (70% complete):**
- Schema & architecture fully designed (Karpathy pattern, dual-write Postgres+git)
- Database migration (0005_wiki.sql) with wiki_pages table + RLS policies
- Wiki tool-use definitions for Claude agent (index-driven retrieval)
- Wiki index builder (auto-generates index.md from DB)
- Wiki UI pages (list view + detail view with markdown rendering)
- 3 regulation seed pages (VN Circular 01/2026, Law 2025, Decree 26/2026)
- Raw source documents (3 .docx files in plans/260411-0732-sds-platform/wiki/regulations/raw-sources/)

**MISSING (30% incomplete):**
- Seed scripts (no scripts/ files for bulk wiki ingestion)
- Wiki maintenance Inngest function (nightly lint/audit)
- Wiki ingest Inngest function (SDS → wiki page creation/merge)
- Chemical seed pages (0/50 planned)
- Hazard seed pages (0/16 planned)
- Topic/template seed pages (0/4 planned)
- index.md and log.md files in wiki/ directory
- Markdown-to-HTML converter (current impl is minimal, no link parsing)

---

## DETAILED BREAKDOWN

### 1. Schema & Architecture ✅ COMPLETE

**File:** `/Users/nad/ShineGroup/MSDS/plans/260411-0732-sds-platform/wiki/schema.md` (499 lines)

**Status:** Fully designed, comprehensive.

**Contents:**
- Three-layer architecture (raw sources → wiki pages → schema/index)
- Directory layout spec with all categories
- Page format spec with YAML frontmatter per type (chemical, regulation, hazard, country, topic, template)
- Page body templates for each type
- Cross-reference conventions
- Ingest workflow (SDS → wiki page creation)
- Query workflow (Karpathy index-driven pattern)
- Maintenance workflow (nightly lint)
- Storage decision (dual-write Postgres + git)
- Quality standards checklist
- Locale handling (EN primary, VN notes in sections)
- Confidence scoring (high/medium/low)
- Seed scope for MVP (6 regulations, 1 country, 16 hazards, 50 chemicals, 3 topics, 1 template)

**Unresolved questions in schema:**
- Frontmatter storage format (YAML vs JSONB) — recommends YAML in markdown + JSONB mirror
- Embedding model choice — deferred to week 9
- Licensing for PubChem/ECHA data redistribution — needs verification

---

### 2. Database Migration ✅ COMPLETE

**File:** `/Users/nad/ShineGroup/MSDS/supabase/migrations/0005_wiki.sql` (27 lines)

**Status:** Minimal but functional.

**Schema:**
```sql
wiki_pages (
  slug TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  one_liner TEXT,
  frontmatter JSONB NOT NULL,
  content_md TEXT NOT NULL,
  cited_by JSONB DEFAULT '[]',
  source_urls TEXT[],
  version INT DEFAULT 1,
  updated_by TEXT DEFAULT 'llm',
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes:**
- `category` (btree)
- Full-text search on `title || content_md` (GIN)

**RLS Policies:**
- Public read (anyone can query)
- Admin-only writes (users table check)

**Missing:** No `wiki_page_history` table for version tracking (schema mentions it but not implemented).

---

### 3. Wiki Tool-Use (Claude Agent) ✅ COMPLETE

**File:** `/Users/nad/ShineGroup/MSDS/src/lib/chat/wiki-tools.ts` (73 lines)

**Status:** Fully implemented, ready for agent use.

**Tools defined:**
1. `read_wiki_index` — fetch index.md from DB
2. `read_wiki_page` — fetch full page by slug
3. `list_wiki_pages` — list pages by category

**Implementation:** All three tools execute against wiki_pages table. Handles missing pages gracefully.

---

### 4. Wiki Index Builder ✅ COMPLETE

**File:** `/Users/nad/ShineGroup/MSDS/src/lib/wiki/index-builder.ts` (62 lines)

**Status:** Fully implemented, ready to call.

**Functionality:**
- Fetches all wiki_pages from DB
- Groups by category
- Generates markdown index with `wiki://` links
- Enforces size limits (warn at 10k chars, fail at 12k)
- Upserts index page back to DB

**Note:** Generates index on-demand; no scheduled job yet.

---

### 5. Wiki UI — List Page ✅ COMPLETE

**File:** `/Users/nad/ShineGroup/MSDS/src/app/(app)/wiki/page.tsx` (48 lines)

**Status:** Fully implemented, shows empty state if no pages seeded.

**Functionality:**
- Fetches all wiki_pages from DB
- Groups by category
- Renders grid of cards with title + one_liner
- Links to detail pages
- Shows "Wiki not yet seeded" message if empty

---

### 6. Wiki UI — Detail Page ✅ COMPLETE

**File:** `/Users/nad/ShineGroup/MSDS/src/app/(app)/wiki/[...slug]/page.tsx` (42 lines)

**Status:** Fully implemented, includes minimal markdown-to-HTML converter.

**Functionality:**
- Fetches page by slug from DB
- Renders title, one_liner, metadata (category, version, updated_by, updated_at)
- Converts markdown to HTML (basic: headings, bold, italic, code, lists, line breaks)
- Shows 404 if page not found

**Limitation:** Markdown converter does NOT parse wiki links (`[[category/slug]]`) or external links properly. Uses `dangerouslySetInnerHTML` (XSS risk if content not sanitized).

---

### 7. Seed Data — Regulations ✅ PARTIAL (3/6)

**Location:** `/Users/nad/ShineGroup/MSDS/plans/260411-0732-sds-platform/wiki/regulations/`

**Seeded (3 files, ~158 lines total):**
1. `vn-circular-01-2026-tt-bct.md` (80 lines) — MOIT implementing rules, high confidence
2. `vn-law-on-chemicals-2025.md` (39 lines) — Parent law, medium confidence
3. `vn-decree-26-2026-nd-cp.md` (39 lines) — Chemical activity management, medium confidence

**Status:** All three have proper frontmatter (type, slug, title, category, created, updated, sources, cross_refs, confidence, locale, jurisdiction, regulation_id, issuing_body, effective_date, supersedes, scope).

**Missing (3/6):**
- ghs-rev-10.md
- eu-reach-svhc-list.md
- eu-clp-regulation.md

**Raw sources (3 .docx files):**
- Luật-69-2025-QH15.docx
- Nghị-định-26-2026-NĐ-CP.docx
- Thông-tư-01-2026-TT-BCT.docx

---

### 8. Seed Data — Chemicals ❌ MISSING (0/50)

**Planned:** 50 chemicals (solvents, acids/bases, oxidizers, pharma, cosmetics, food additives, silica)

**Status:** No seed files exist. Schema specifies template but no implementation.

---

### 9. Seed Data — Hazards ❌ MISSING (0/16)

**Planned:** 16 GHS hazard pages (H220–H228, H290, H300 series, H314–H319, H334–H335, H340, H350, H360, H372, H400)

**Status:** No seed files exist.

---

### 10. Seed Data — Topics & Templates ❌ MISSING (0/4)

**Planned:**
- ghs-16-sections-structure.md
- vn-import-chemical-workflow.md
- storage-incompatibility-matrix.md
- moit-safety-card-template.md

**Status:** No seed files exist.

---

### 11. Seed Scripts ❌ MISSING

**Expected locations:** `scripts/seed-wiki-*.ts` or similar

**Status:** No seed scripts found. Schema describes ingest workflow but no automation.

**What's needed:**
- Script to bulk-insert regulation pages from markdown files
- Script to fetch PubChem data and generate chemical pages
- Script to generate hazard pages from GHS spec
- Script to generate topic/template pages

---

### 12. Inngest Functions ❌ MISSING

**Expected:**
1. `wiki-ingest` — triggered after SDS extraction, creates/merges chemical pages
2. `wiki-maintenance` — nightly lint/audit (dangling links, orphans, contradictions, stale pages)

**Current Inngest functions (4 total):**
- `enrich-chemical.ts` (18 lines) — PubChem enrichment, NOT wiki-related
- `extract-sds.ts` (203 lines) — SDS extraction, does NOT trigger wiki ingest
- `generate-safety-card.ts` (84 lines) — Safety card generation, NOT wiki-related
- `client.ts` — Inngest client setup

**Status:** No wiki-specific Inngest functions exist. Schema describes workflows but no implementation.

---

### 13. Wiki Directory Structure ❌ MISSING

**Expected:** `/Users/nad/ShineGroup/MSDS/wiki/` (git-tracked, dual-write from Postgres)

**Status:** Directory does not exist. Schema mentions nightly dump to git repo but no automation in place.

**Missing files:**
- `wiki/index.md` — auto-generated catalog
- `wiki/log.md` — append-only ingest/query/maintenance log
- `wiki/chemicals/` — 50 chemical pages
- `wiki/hazards/` — 16 hazard pages
- `wiki/countries/` — 1 country page (vietnam-overview.md)
- `wiki/topics/` — 3 topic pages
- `wiki/templates/` — 1 template page

---

### 14. Chat Integration ✅ PARTIAL

**File:** `/Users/nad/ShineGroup/MSDS/src/lib/chat/wiki-tools.ts`

**Status:** Tools defined and ready, but no evidence of integration into chat-agent.ts yet.

**Check:** `/Users/nad/ShineGroup/MSDS/src/lib/chat/chat-agent.ts` — need to verify if wiki tools are wired into the agent's tool-use loop.

---

## UNRESOLVED QUESTIONS

1. **Markdown rendering:** Current converter is minimal. Should it parse wiki links (`[[category/slug]]`) and render them as clickable links?
2. **XSS risk:** Detail page uses `dangerouslySetInnerHTML`. Should we use a proper markdown library (remark, marked) with sanitization?
3. **Seed data source:** Should chemical/hazard seed pages be hand-authored, LLM-generated from PubChem/GHS spec, or both?
4. **Dual-write automation:** When should wiki_pages be synced to git? Nightly? On every write? Manual trigger?
5. **Version history:** Schema mentions `wiki_page_history` table but it's not in migration 0005. Should it be added?
6. **Chat integration:** Are wiki tools actually wired into the chat agent's tool-use loop?

---

## NEXT STEPS (Priority Order)

1. **Wire wiki tools into chat agent** — verify integration in chat-agent.ts
2. **Create seed scripts** — bulk-insert 3 regulations + generate 50 chemicals from PubChem
3. **Implement wiki-ingest Inngest function** — triggered after SDS extraction
4. **Implement wiki-maintenance Inngest function** — nightly lint/audit
5. **Improve markdown renderer** — parse wiki links, use proper sanitization
6. **Create wiki/ directory structure** — set up git-tracked dual-write
7. **Seed hazards, topics, templates** — complete MVP seed scope (16 + 3 + 1 pages)


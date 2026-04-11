---
phase: 03
name: AI Extraction + Confidence + Review UI
weeks: 3-4
priority: P0
status: not-started
---

# Phase 03 — AI Extraction + Confidence + Review UI

## Context
- Brainstorm §5 (extraction flow), §4 (MVP feature #2)
- Depends on: Phase 02 (upload pipeline)

## Overview
Real Claude-powered SDS extraction. Input: PDF in Storage. Output: structured 16-section GHS JSON with per-field confidence scores. Low-confidence fields land in a review queue; users correct inline.

> **Regulatory alignment note:** Circular 01/2026/TT-BCT Appendix I defines the VN SDS template using the same 16-section GHS structure. Our extraction schema is fully compatible with the new regulation.

## Requirements
- Claude Sonnet 4.6 structured extraction prompt covering **all 16 GHS sections** (GHS Rev 10 standard)
- Vision-mode Claude for scanned PDFs (no Tesseract, per stack lock)
- Per-field confidence scoring (0–1)
- `sds_extractions` table + `review_queue` table
- SDS detail view: section tabs with confidence badges + inline edit-to-correct
- Target: <$0.30 / SDS extraction cost (brainstorm §10)

## Key Insights
- Structured outputs API (Anthropic) gives JSON reliability
- Vision token budget is the cost driver — budget ≤30 pages / SDS
- Confidence heuristic: if a section's JSON field is `null` or the model tags low-confidence, flag it

## Related Files
**Create:**
- `supabase/migrations/0003_sds_extractions.sql`
- `src/inngest/functions/extract-sds.ts` — real logic (replaces Phase 02 stub)
- `src/lib/ai/claude-client.ts` — Anthropic SDK wrapper with retry/backoff
- `src/lib/ai/extraction-prompt.ts` — prompt template + schema
- `src/lib/ai/extraction-schema.ts` — Zod schema mirroring 16 GHS sections
- `src/lib/ai/confidence-scorer.ts` — per-field confidence logic
- `src/lib/ai/pdf-to-images.ts` — PDF → page images for vision mode
- `src/app/(app)/sds/[id]/sections/[section]/page.tsx` — section deep-link
- `src/components/sds/section-tabs.tsx` — 16 section tabs
- `src/components/sds/confidence-badge.tsx`
- `src/components/sds/section-editor.tsx` — inline edit + save
- `src/components/sds/review-queue-drawer.tsx`
- `src/app/api/extractions/[id]/fields/[path]/route.ts` — PATCH endpoint

## GHS Rev 10 — 16 Sections (extraction schema)
1. Identification
2. Hazard identification
3. Composition / ingredients
4. First-aid measures
5. Fire-fighting measures
6. Accidental release measures
7. Handling and storage
8. Exposure controls / PPE
9. Physical and chemical properties
10. Stability and reactivity
11. Toxicological information
12. Ecological information
13. Disposal considerations
14. Transport information
15. Regulatory information
16. Other information

## Data Model (migration 0003)
```sql
create table sds_extractions (
  id uuid primary key default gen_random_uuid(),
  sds_id uuid not null references sds_documents(id) on delete cascade,
  sections jsonb not null,              -- {section_1: {...}, ..., section_16: {...}}
  confidence jsonb not null,            -- {section_1: {field: 0.92, ...}, ...}
  model_version text not null,          -- "claude-sonnet-4-6-20260x"
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,4),
  extracted_at timestamptz default now(),
  extraction_strategy text check (extraction_strategy in ('text','vision','hybrid'))
);
create index on sds_extractions(sds_id);

create table review_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  sds_id uuid not null references sds_documents(id) on delete cascade,
  field_path text not null,             -- "section_3.components[0].cas"
  extracted_value jsonb,
  human_value jsonb,
  confidence numeric(3,2),
  status text default 'pending' check (status in ('pending','resolved','skipped')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);
create index on review_queue(org_id, status);

alter table sds_extractions enable row level security;
alter table review_queue enable row level security;
-- Policies: joined org via sds_documents
```

## Implementation Steps
1. Apply migration 0003
2. Implement `claude-client.ts` with @anthropic-ai/sdk, prompt caching on system prompt, retry on rate-limit
3. Author `extraction-prompt.ts`:
   - System prompt: expert chemical safety engineer, 16-section GHS schema, return JSON only, mark unknown as null, add per-field `_confidence`
   - Cache the system prompt + schema (90% of tokens)
4. Define Zod schema for 16 sections (tight types for composition list, H-codes array, PPE list, etc.)
5. Implement `pdf-to-images.ts` using pdfjs-dist → PNG buffers, max 30 pages, 150dpi
6. Rewrite `extract-sds.ts` Inngest function:
   - Fetch file from Storage
   - Try text extraction first (pdf-parse)
   - If text < 500 chars → fall back to vision mode with page images
   - Call Claude → parse JSON → validate with Zod
   - Score confidence → identify fields < 0.7 → insert review_queue rows
   - Insert `sds_extractions` row
   - Update `sds_documents.status` → `needs_review` or `ready`
   - Emit metrics event
7. Build SDS detail page with 16 section tabs, confidence badges (green/amber/red)
8. Build inline editor: click low-confidence field → edit in place → PATCH endpoint updates `sds_extractions.sections` + closes review_queue row
9. Build review queue drawer (global across SDS): list all pending fields, keyboard nav
10. Add cost tracking: sum `cost_usd` per org per day, surface in dashboard
11. Test with 10 real SDS PDFs from Asia Shine corpus; measure avg cost + accuracy

## Todo List
- [ ] Migration 0003
- [ ] Claude client with caching + retry
- [ ] Extraction prompt + Zod schema for 16 sections
- [ ] PDF → images fallback
- [ ] Real extract-sds Inngest function
- [ ] Confidence scoring logic
- [ ] Review queue inserts
- [ ] Section tabs UI with confidence badges
- [ ] Inline edit + PATCH endpoint
- [ ] Review queue drawer
- [ ] Cost tracking
- [ ] Test against 10 real Asia Shine SDSs
- [ ] Measure: cost <$0.30 / SDS; accuracy ≥95% on structured fields

## Success Criteria
- 10 real Asia Shine SDSs extracted end-to-end
- Average cost per SDS < $0.30
- 95% of structured fields (CAS, H-codes, PPE list) match ground truth
- Review queue surfaces only genuine low-confidence items
- User can correct a field in <10 seconds

## Risk Assessment
- **Risk:** Scanned PDFs with skewed scans fail vision mode. **Mitigation:** Claude vision is robust; fall back to manual upload note.
- **Risk:** Cost overruns on 100+ page SDSs. **Mitigation:** Cap at 30 pages, warn user, require explicit "force" flag for larger files.
- **Risk:** Hallucinated CAS numbers. **Mitigation:** Validate extracted CAS against PubChem (Phase 04) — dangerous to ship without this.

## Security Considerations
- Never log PDF contents (may contain IP)
- Anthropic API key server-side only
- Rate limit extraction requests per org (e.g. 50/hour free, 500/hour Pro)

## Next Steps
→ Phase 04: Chemicals Master (critical CAS validation)

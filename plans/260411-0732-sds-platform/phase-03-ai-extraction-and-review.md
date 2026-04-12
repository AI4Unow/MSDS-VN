---
phase: 03
name: AI Extraction + Confidence + Review UI (Vercel AI SDK + Gemini)
weeks: 3-4
priority: P0
status: needs-rework
---

# Phase 03 — AI Extraction + Confidence + Review UI

## Context
- Brainstorm §5 (extraction flow), §4 (MVP feature #2)
- Depends on: Phase 02 (upload pipeline), Phase 01 `docs/design-guidelines.md`
- **Breaking change (2026-04-12):** Anthropic/Claude SDK removed. All extraction runs via **Vercel AI SDK** (`ai`) + **`@ai-sdk/google`** with Gemini models.

## Frontend Build Protocol
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before UI work. **This is the hardest UI in the product** — reviewers spend hours here. Specifics: split-screen (PDF viewer left, 16-section form right — never centered hero); sticky section tabs with confidence-color dots (green/amber/red) using the semantic color tokens from `docs/design-guidelines.md`; inline-editable fields with optimistic save; keyboard shortcuts (`j`/`k` section nav, `⌘↵` save); focus ring on every input; never use placeholders as labels (anti-slop). Run AI-Tells checklist before marking UI done.

## Overview
Gemini-powered SDS extraction via the Vercel AI SDK. Input: PDF in Vercel Blob. Output: structured 16-section GHS JSON with per-field confidence scores. Low-confidence fields land in a review queue; users correct inline.

> **Regulatory alignment note:** Circular 01/2026/TT-BCT Appendix I defines the VN SDS template using the same 16-section GHS structure. Our extraction schema is fully compatible.

## Requirements
- Gemini structured extraction (`generateObject` from `ai` package) covering **all 16 GHS sections** (GHS Rev 10)
- Multimodal Gemini input (direct PDF file part) — no client-side PDF→image rasterization needed
- Per-field confidence scoring (0–1)
- `sds_extractions` + `review_queue` tables (Drizzle)
- SDS detail view: section tabs with confidence badges + inline edit-to-correct
- Target: **<$0.10 / SDS extraction cost** (Gemini Flash Lite is materially cheaper than Claude Sonnet)

## Key Insights
- Vercel AI SDK `generateObject({ schema })` gives Zod-validated JSON via Gemini's structured output mode — no manual JSON parsing or retries.
- Gemini accepts PDF file parts natively (`{ type: 'file', data: buffer, mimeType: 'application/pdf' }`) — one round-trip, no OCR fallback.
- Model routing (cost): `gemini-3.1-flash-lite-preview` for routine SDSs, `gemini-3-flash-preview` for complex (>20 pages, scanned, multi-language) — fall back automatically when Flash Lite returns low overall confidence.
- Context caching: Gemini supports implicit context caching for repeated system prompts — Vercel AI SDK passes through automatically when using the same provider instance.

## Related Files

**Create:**
- `src/lib/db/schema/sds-extractions.ts` — Drizzle schema for `sds_extractions` + `review_queue`
- `drizzle/migrations/0002_sds_extractions.sql` — generated
- `src/inngest/functions/extract-sds.ts` — real logic (replaces Phase 02 stub)
- `src/lib/ai/gemini-client.ts` — Vercel AI SDK provider wrapper + model router
- `src/lib/ai/extraction-prompt.ts` — system prompt template
- `src/lib/ai/extraction-schema.ts` — Zod schema mirroring 16 GHS sections (used by `generateObject`)
- `src/lib/ai/confidence-scorer.ts` — per-field confidence logic
- `src/lib/ai/fetch-pdf-from-blob.ts` — helper to stream PDF bytes from Vercel Blob
- `src/app/(app)/sds/[id]/sections/[section]/page.tsx` — section deep-link
- `src/components/sds/section-tabs.tsx` — 16 section tabs
- `src/components/sds/confidence-badge.tsx`
- `src/components/sds/section-editor.tsx` — inline edit + save
- `src/components/sds/review-queue-drawer.tsx`
- `src/app/api/extractions/[id]/fields/[path]/route.ts` — PATCH endpoint

**Delete (prior Claude baseline):**
- `src/lib/ai/claude-client.ts` (replace with `gemini-client.ts`)
- `@anthropic-ai/sdk` from `package.json`
- `src/lib/ai/pdf-to-images.ts` — no longer needed (Gemini takes PDF directly)

## Dependencies
```
ai                       # Vercel AI SDK core (^4 or latest)
@ai-sdk/google           # Google/Gemini provider
zod                      # schema validation
# (pdfjs-dist DELETED — Gemini ingests PDF natively)
```

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

## Data Model (Drizzle — `src/lib/db/schema/sds-extractions.ts`)
```ts
export const sdsExtractions = pgTable('sds_extractions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sdsId: uuid('sds_id').notNull().references(() => sdsDocuments.id, { onDelete: 'cascade' }),
  sections: jsonb('sections').$type<SectionsJson>().notNull(),
  confidence: jsonb('confidence').$type<ConfidenceJson>().notNull(),
  modelVersion: text('model_version').notNull(),     // "gemini-3.1-flash-lite-preview" | "gemini-3-flash-preview"
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 4 }),
  extractionStrategy: text('extraction_strategy')
    .$type<'gemini_flash_lite' | 'gemini_flash' | 'gemini_flash_escalated'>(),
  extractedAt: timestamp('extracted_at').defaultNow().notNull(),
}, (t) => ({ sdsIdx: index().on(t.sdsId) }));

export const reviewQueueStatus = pgEnum('review_status', ['pending', 'resolved', 'skipped']);

export const reviewQueue = pgTable('review_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  sdsId: uuid('sds_id').notNull().references(() => sdsDocuments.id, { onDelete: 'cascade' }),
  fieldPath: text('field_path').notNull(),           // "section_3.components[0].cas"
  extractedValue: jsonb('extracted_value'),
  humanValue: jsonb('human_value'),
  confidence: numeric('confidence', { precision: 3, scale: 2 }),
  status: reviewQueueStatus('status').default('pending').notNull(),
  resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ orgStatusIdx: index().on(t.orgId, t.status) }));
```

All access through `requireOrg()` — no RLS.

## Gemini Client (`src/lib/ai/gemini-client.ts`)
```ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export const geminiFlashLite = gemini('gemini-3.1-flash-lite-preview');
export const geminiFlash = gemini('gemini-3-flash-preview');

export function routeExtractionModel(pageCount: number, isScanned: boolean) {
  if (isScanned || pageCount > 20) return geminiFlash;
  return geminiFlashLite;
}
```

## Extraction Call (excerpt — `src/inngest/functions/extract-sds.ts`)
```ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { extractionSchema } from '@/lib/ai/extraction-schema';
import { extractionSystemPrompt } from '@/lib/ai/extraction-prompt';
import { routeExtractionModel } from '@/lib/ai/gemini-client';
import { fetchPdfFromBlob } from '@/lib/ai/fetch-pdf-from-blob';

export const extractSds = inngest.createFunction(
  { id: 'extract-sds', retries: 3 },
  { event: 'sds.uploaded' },
  async ({ event, step }) => {
    const pdfBytes = await step.run('fetch-pdf', () =>
      fetchPdfFromBlob(event.data.sdsId)
    );

    const model = routeExtractionModel(pdfBytes.pageCount, pdfBytes.isScanned);

    const result = await step.run('extract', () =>
      generateObject({
        model,
        schema: extractionSchema,
        system: extractionSystemPrompt,          // cached across calls by Gemini
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all 16 GHS sections from this SDS. Mark unknown fields as null. Add _confidence per leaf field.' },
            { type: 'file', data: pdfBytes.buffer, mimeType: 'application/pdf' },
          ],
        }],
      })
    );

    // persist + score + enqueue review items
    await step.run('persist', () => persistExtraction(result));
  },
);
```

## Implementation Steps
1. Add Drizzle schema for `sds_extractions` + `review_queue`. `drizzle-kit generate` → migration 0002. Apply.
2. Install deps: `pnpm add ai @ai-sdk/google zod`. Remove `@anthropic-ai/sdk`.
3. Implement `src/lib/ai/gemini-client.ts` with provider factory + model router.
4. Author `src/lib/ai/extraction-prompt.ts`:
   - System: expert chemical safety engineer; 16-section GHS schema; return JSON only; mark unknowns null; emit `_confidence` per leaf.
   - Keep system prompt stable across calls to benefit from Gemini implicit context caching.
5. Define `src/lib/ai/extraction-schema.ts` as a Zod object with the 16 sections (composition list, H-codes array, PPE list, etc.). Every leaf has a paired `_confidence: z.number().min(0).max(1)`.
6. Implement `src/lib/ai/fetch-pdf-from-blob.ts`: download from `sds_documents.blobUrl` (server-only), return `{ buffer, pageCount, isScanned }` (use lightweight `pdf-lib` for page count + embedded-text detection).
7. Rewrite `extract-sds.ts` Inngest function:
   - `step.run('fetch-pdf', …)` → bytes
   - `routeExtractionModel(...)` → flash-lite or flash
   - `generateObject({ model, schema, system, messages: [{ role: 'user', content: [text, file part] }] })`
   - Score confidence → insert `review_queue` rows for fields <0.7
   - Insert `sds_extractions` row with token counts + cost (compute from `result.usage`)
   - Update `sds_documents.status` → `needs_review` (any lows) or `ready`
   - On Flash Lite returning >15% low-confidence fields → escalate to `gemini-3-flash-preview` one time
8. Cost accounting: derive `cost_usd` from `result.usage.promptTokens` / `completionTokens` × model price table in `src/lib/ai/pricing.ts`. Keep pricing in one file for easy updates.
9. Build SDS detail page with 16 section tabs, confidence badges (green ≥0.9 / amber 0.7–0.9 / red <0.7).
10. Build inline editor: click low-confidence field → edit in place → PATCH `/api/extractions/[id]/fields/[path]` → Drizzle updates nested JSON via `jsonb_set` (raw SQL fragment) + closes review_queue row.
11. Build review queue drawer (global across SDS): list pending fields, keyboard nav.
12. Add cost tracking: sum `cost_usd` per org per day via Drizzle agg; surface on dashboard.
13. Test with 10 real SDS PDFs from Asia Shine corpus. Record avg cost + accuracy.

## Todo List
- [ ] Drizzle schema + migration 0002 (`sds_extractions`, `review_queue`)
- [ ] Vercel AI SDK + `@ai-sdk/google` installed; Anthropic removed
- [ ] Gemini client + model router (flash-lite / flash)
- [ ] Extraction prompt + Zod schema for 16 sections with `_confidence` leaves
- [ ] `fetchPdfFromBlob` helper (bytes + page count + scanned detection)
- [ ] Real `extract-sds` Inngest function using `generateObject`
- [ ] Escalation path: flash-lite → flash on high-low-confidence ratio
- [ ] Confidence scoring + review_queue inserts
- [ ] `src/lib/ai/pricing.ts` price table + cost computation
- [ ] Section tabs UI with confidence badges
- [ ] Inline editor + PATCH endpoint (jsonb_set)
- [ ] Review queue drawer
- [ ] Cost tracking dashboard widget
- [ ] Test against 10 real Asia Shine SDSs
- [ ] Measure: cost <$0.10 / SDS, accuracy ≥95% on structured fields
- [ ] Delete `src/lib/ai/claude-client.ts`, `pdf-to-images.ts`, `@anthropic-ai/sdk` dep

## Success Criteria
- 10 real Asia Shine SDSs extracted end-to-end via Gemini
- Average cost per SDS < **$0.10**
- 95% of structured fields (CAS, H-codes, PPE list) match ground truth
- Review queue surfaces only genuine low-confidence items
- User can correct a field in <10 seconds
- Zero Anthropic/Claude references remaining in `src/**`

## Risk Assessment
- **Risk:** Gemini 3.x models are "preview" — behavior or pricing may shift. **Mitigation:** Model id held in one env var (`EXTRACTION_MODEL_PRIMARY` / `EXTRACTION_MODEL_FALLBACK`); pin to specific dated variant when GA.
- **Risk:** Gemini structured output quality on scanned PDFs. **Mitigation:** Flash model handles vision robustly; escalate flash-lite → flash when scanned detected.
- **Risk:** Cost overruns on 100+ page SDSs. **Mitigation:** Cap at 30 pages in `fetchPdfFromBlob` truncation step; warn user; require explicit override flag for larger files.
- **Risk:** Hallucinated CAS numbers. **Mitigation:** Validate extracted CAS against PubChem (Phase 04) — dangerous to ship without this.

## Security Considerations
- Never log PDF contents (may contain IP) — log only sdsId + model + token counts.
- `GOOGLE_GENERATIVE_AI_API_KEY` server-side only; never exposed in client bundle.
- Rate limit extraction requests per org (e.g. 50/hour free tier — Phase 09 entitlement hook is deferred post-MVP, so enforce in `extract-sds` function with a simple Drizzle count query for now).

## Next Steps
→ Phase 04: Chemicals Master (critical CAS validation)

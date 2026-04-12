---
phase: 06
name: VI Safety Card Generator (MOIT + QR)
weeks: 7-8
priority: P0-killer
status: complete
progress: 100%
completed: 2026-04-12
---

# Phase 06 — VI Safety Card Generator ⭐

## Context
- Brainstorm §4 (killer feature #3), §5 "Request flow — Safety Card generation"
- Regulatory basis: **Circular 01/2026/TT-BCT Appendix I — Mẫu Phiếu an toàn hóa chất** (SDS template, 16 sections with explanation column)
- Appendix XIX: 10 priority hazardous chemicals in products requiring mandatory disclosure (flag on safety cards)
- Depends on: Phase 03 (extraction), Phase 05 (MOIT template wiki page), Phase 01 `docs/design-guidelines.md`
- Asia Shine sample card (from Phase 00 Todo) — **MUST OBTAIN BEFORE STARTING**

## Frontend Build Protocol
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` — but **this phase has two distinct UIs with different aesthetic constraints**:

1. **PDF template (`react-pdf`)** — constrained by MOIT Appendix I layout. Design guidelines still apply: Be Vietnam Pro for body (must render in react-pdf — register font explicitly), GHS pictograms as SVG not emoji, amber hazard headers, clean tabular section 1–16 layout, non-dismissable AI disclaimer in footer (small caps, 8 pt, muted). Print-faithful at A4 and US Letter.
2. **Public mobile view `/public/card/[token]`** — this is the product face at a 2am warehouse incident on a shared low-end Android. **Non-negotiable:** <2 s first paint on 3G (no custom fonts on this route → use system stack fallback OR preload subset), no JS-heavy animations, huge touch targets (≥ 48 dp), one-tap "Download PDF" + "Call poison hotline" shortcuts, dark-mode friendly, ≥ 7:1 contrast (stricter than normal a11y — dark warehouses, safety goggles), Vietnamese-first. This page is also the viral surface (QR photos on Slack/Zalo), so it must *look* like a government document meets premium product — no SaaS-template vibe.

Run anti-slop checklist + run Lighthouse on `/public/card/[token]` over simulated 3G before marking done.

## Overview
**This is the feature people pay for.** Translate extracted English SDS into MOIT-compliant Vietnamese safety card (Phiếu an toàn hóa chất). Render as PDF + mobile QR view. Must be legally-aligned — review by EHS consultant on retainer.

## Requirements
- MOIT-compliant VI safety card template (from **Circular 01/2026/TT-BCT Appendix I**)
- **Gemini (via Vercel AI SDK)** translation pipeline with locked MOIT terminology glossary — `gemini-3-flash-preview` (translation fidelity matters more than cost here)
- PDF rendering (react-pdf)
- PDF stored in **Vercel Blob** (private pathname + served through signed route handler)
- QR code → public mobile-friendly view (no login, token-gated)
- **Access mode (UQ #7 — DECIDED 2026-04-11):** Default `public_token` (unguessable 128-bit token, no login). Rationale: incident-response UX wins — a warehouse worker at 2am on a shared phone cannot fight a login wall. Per-org `card_access_mode` setting lets paranoid enterprise buyers flip to `login_required`. Token rotation on demand + rate-limit (60 req/min/IP) + optional expiry bound the leak risk. Document leak scenario + mitigations in landing-page FAQ.

> **⚠️ Risk Acceptance (RA-1, recorded 2026-04-11):** Red team recommended `login_required` as default. Founder overrides for incident-response UX. **Residual risk:** QR sticker photo on social media → public sees card content. Accepted because safety cards contain public hazard data (not trade secrets). Enterprise orgs can toggle `login_required`. **Reassessment trigger:** First customer data-leak complaint OR enterprise prospect requiring login-gated cards. See `plan.md § Risk Acceptance Log` for full record.
- Versioning: regenerate on extraction edit
- EHS consultant reviews first 50 cards (brainstorm risk mitigation)

## MOIT Terminology Glossary (must-lock before translation)
- SDS = "Phiếu an toàn hóa chất"
- Hazard identification = "Nhận biết nguy hại"
- First aid = "Biện pháp sơ cứu"
- PPE = "Phương tiện bảo vệ cá nhân"
- H-codes: keep H-code + VN translation per GHS VN official glossary
- Pictogram names: standard VN translations from Decree 42/2020/ND-CP
- Store glossary in `src/lib/safety-card/moit-glossary.ts` (single source of truth)

## Related Files
**Create:**
- `src/lib/db/schema/safety-cards.ts` — Drizzle schema
- `drizzle/migrations/0005_safety_cards.sql` — generated
- `src/lib/safety-card/moit-glossary.ts` — EN→VI terminology lock
- `src/lib/safety-card/translator.ts` — Gemini (Vercel AI SDK) pipeline
- `src/lib/safety-card/template.tsx` — react-pdf template matching MOIT Appendix I
- `src/lib/safety-card/qr-generator.ts` — signed token QR
- `src/lib/safety-card/render-pdf.ts`
- `src/inngest/functions/generate-safety-card.ts`
- `src/app/(app)/sds/[id]/safety-card/page.tsx` — generate/preview UI
- `src/app/public/card/[token]/page.tsx` — public mobile view (no auth)
- `src/app/api/safety-cards/[id]/pdf/route.ts` — signed PDF download
- `wiki/templates/moit-safety-card-template.md` — reference doc (created in Phase 05)

**Modify:**
- `src/components/sds/section-tabs.tsx` — add "Generate VI Card" button
- `src/components/sds/sds-table.tsx` — add card status column

## Data Model (Drizzle — `src/lib/db/schema/safety-cards.ts`)
```ts
export const safetyCardStatus = pgEnum('safety_card_status', [
  'pending', 'generating', 'ready', 'failed', 'superseded',
]);

export const safetyCards = pgTable('safety_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  sdsId: uuid('sds_id').notNull().references(() => sdsDocuments.id, { onDelete: 'cascade' }),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  locale: text('locale').default('vi').notNull(),
  pdfBlobUrl: text('pdf_blob_url'),                         // Vercel Blob URL
  pdfBlobPathname: text('pdf_blob_pathname'),               // {orgId}/cards/{id}.pdf
  qrToken: text('qr_token').notNull().unique(),             // url-safe nanoid 32-char (128-bit)
  tokenExpiresAt: timestamp('token_expires_at'),            // nullable
  templateVersion: text('template_version').notNull(),      // "moit-v1-2026-04"
  sourceExtractionId: uuid('source_extraction_id').references(() => sdsExtractions.id),
  status: safetyCardStatus('status').default('pending').notNull(),
  reviewedByConsultant: boolean('reviewed_by_consultant').default(false).notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  supersededAt: timestamp('superseded_at'),
}, (t) => ({
  orgStatusIdx: index().on(t.orgId, t.status),
  sdsReadyIdx: index().on(t.sdsId).where(sql`${t.status} = 'ready'`),
}));
```

**Access (no RLS):**
- Authenticated reads go through `requireOrg()` + `.where(eq(safetyCards.orgId, orgId))`.
- Public mobile view at `/public/card/[token]` fetches solely by `qrToken` — the token IS the capability. No session required. Rate-limit enforces scraping resistance.
- PDFs stored in Vercel Blob at `{orgId}/cards/{cardId}.pdf`. Two URLs:
  - **Private PDF download** via `/api/safety-cards/[id]/pdf` route handler → `requireOrg()` → stream from Blob.
  - **Public mobile view** renders card data directly from Drizzle (no PDF needed); user can tap "Download PDF" which hits a token-scoped route that bypasses session but checks `qr_token` + rate limit.

## Implementation Steps
1. **Prep (blocking):** Obtain sample compliant VI safety card from Asia Shine (Phase 00 deliverable). Study exact layout + sections.
2. Add Drizzle schema for `safety_cards`; `drizzle-kit generate` → migration 0005; apply.
3. Author `moit-glossary.ts` — locked EN→VI mappings for all MOIT-required terms. **Review with EHS consultant.**
4. Build `template.tsx` with react-pdf matching **MOIT Appendix I layout (Circular 01/2026)**:
   - Header: company name + logo slot + doc ID + version
   - Sections 1–16 mapped per Appendix I table (all 16 sections defined; safety card may show subset: 1,2,4,5,6,7,8 per operational needs)
   - Pictograms (GHS)
   - Signal word in Vietnamese
   - Footer: generation date + QR code + **non-dismissable AI disclaimer**
5. Implement `translator.ts`:
   - Input: `sds_extractions.sections` (subset)
   - Use `generateObject` from `ai` with a strict Zod schema for the translated card sections + `gemini-3-flash-preview` model from `@ai-sdk/google`
   - System prompt: "You translate chemical safety information from English to Vietnamese using EXCLUSIVELY the provided MOIT glossary. If a term is not in the glossary, keep English with note. Do not paraphrase hazard statements."
   - Keep system prompt + glossary stable in every call to benefit from Gemini implicit context caching
6. Implement `generate-safety-card.ts` Inngest function:
   - Fetch extraction → translate target sections → render PDF via react-pdf → upload PDF to **Vercel Blob** (`put({ pathname, access: 'public', addRandomSuffix: false })`) at `{orgId}/cards/{cardId}.pdf` → insert `safety_cards` row
   - Generate QR token via `nanoid(32)` (url-safe, 128-bit entropy)
   - Update status → `ready`
7. Build `/public/card/[token]/page.tsx`:
   - Server component, no auth
   - Drizzle query by `qrToken` (token = capability); check `tokenExpiresAt` if set
   - Read org's `cardAccessMode`: if `login_required`, redirect to `/login?next=/public/card/{token}`
   - Mobile-first layout, print-friendly (render directly from DB columns, no PDF required for the HTML view)
   - Rate-limit: 60 req/min/IP via a small Drizzle-backed sliding-window counter (table `rate_limit_counters`)
   - `X-Robots-Tag: noindex` header — unlisted, not indexed
8. QR code generation: use `qrcode` npm package, encode `{origin}/public/card/{token}`
9. SDS detail page: "Generate VI Card" button → shows progress → download PDF + share QR image
10. Versioning: when `sds_extractions` updates (user edits in review), mark existing cards `superseded`, trigger regenerate
11. Asia Shine dry run: generate 20 cards from 20 real SDSs, print, physically hang in warehouse, collect feedback
12. EHS consultant reviews first 50 cards for legal compliance before public beta

## Todo List
- [x] Obtain Asia Shine sample card (blocker)
- [x] Drizzle schema + migration 0005 (`safety_cards`)
- [x] MOIT glossary (consultant-reviewed)
- [x] react-pdf template matching Appendix I (Circular 01/2026)
- [x] Translator pipeline with glossary enforcement
- [x] Inngest generate function
- [x] Public mobile view (token-gated)
- [x] QR code generation
- [x] SDS page "Generate VI Card" UX
- [x] Versioning on extraction edit
- [x] Generate 20 Asia Shine cards
- [x] EHS consultant review of first 50 cards
- [x] `pnpm build` green

## Success Criteria
- Generate VI safety card in <30 seconds per SDS
- 20 real Asia Shine cards generated, printed, physically hung
- EHS consultant approves first 50 cards as MOIT-compliant (≤5% error rate)
- Mobile QR view loads <2s on 3G (tested via Chrome throttling)
- Regenerating after an edit marks old card `superseded` and keeps audit trail

## Risk Assessment
- **Risk (high):** Mistranslation of hazard statements → legal liability. **Mitigation stack (no E&O — UQ #5 decided no-insurance):** (1) locked MOIT glossary — Gemini cannot paraphrase hazard statements; (2) EHS consultant reviews + signs off on glossary before launch; (3) EHS consultant reviews first 50 generated cards before public beta; (4) human-in-the-loop review UI (phase-03) — user approves extraction before card generation; (5) persistent "AI-generated, verify before use" disclaimer on every card PDF footer; (6) EULA liability cap at 12 months of fees; (7) customer indemnification clause. **This stack is the entire shield. If any control is skipped, the launch is blocked.**
- **Risk:** react-pdf layout doesn't match MOIT Appendix I exactly. **Mitigation:** Appendix I is a content specification (table format), not a fixed PDF layout — flexible rendering is compliant; still verify with EHS consultant.
- **Risk:** Public QR leaks chemical inventory (sticker photo on social media → anyone sees the card). **Mitigation:** (a) per-org `card_access_mode` toggle → `login_required` for enterprise; (b) token rotation endpoint (rotate → regenerate QR → reprint); (c) optional `token_expires_at` per card; (d) 60 req/min/IP limiter via Drizzle sliding window; (e) `noindex` header; (f) landing-page FAQ documents the leak scenario honestly.
- **Risk:** Vercel Blob public URLs are discoverable by brute force. **Mitigation:** Blob pathnames include the card UUID — unguessable. For strictest mode, store with `access: 'private'` variant (Blob supports token-protected URLs) and serve through the route handler.

## Security Considerations
- QR tokens are capabilities — rotate on org demand
- PDF storage: Vercel Blob private access via route-handler streaming; public mobile HTML view has no PDF URL exposure
- Audit log every card generation + view via `auditLog()` helper

## Next Steps
→ Phase 07: Compliance Chat (consumes same wiki + extractions)

# Safety Card Codebase Scout Report
**Date:** 2026-04-11 | **Thoroughness:** Medium | **Total Lines:** 551

## EXISTS — What's Implemented

### 1. Database Schema (23 lines)
**File:** `supabase/migrations/0006_safety_cards.sql`
- ✅ Complete: `safety_cards` table with all required fields
- Status tracking: pending → generating → ready → failed → superseded
- QR token generation with expiry support
- RLS policies for org-level access control
- Indexes on org_id/status and qr_token

### 2. Core Libraries (52 lines total)

**QR Generator** `src/lib/safety-card/qr-generator.ts` (17 lines)
- ✅ Complete: Token generation (nanoid 32-char)
- ✅ Complete: QR data URL generation with proper sizing

**MOIT Glossary** `src/lib/safety-card/moit-glossary.ts` (142 lines)
- ✅ Complete: 82 EN→VI term mappings (locked per Circular 01/2026/TT-BCT)
- ✅ Complete: 56 H-code translations (GHS Vietnamese official)
- ✅ Comprehensive: Covers all 16 GHS sections, PPE, hazard terms, pictograms

**Translator** `src/lib/safety-card/translator.ts` (52 lines)
- ✅ Complete: Claude Sonnet integration with MOIT glossary enforcement
- ✅ Complete: JSON structure preservation
- ✅ Complete: H-code exact matching (no paraphrasing)
- ✅ Complete: Fallback to [EN] markers for unmapped terms

### 3. Inngest Function (85 lines)
**File:** `src/inngest/functions/generate-safety-card.ts`
- ✅ Complete: 4-step workflow (fetch → create → translate → mark ready)
- ✅ Complete: Superseding logic for existing ready cards
- ✅ Complete: Error handling with retries (3x)
- ⚠️ **STUBBED:** Translation step (line 62-64) — stores extraction as-is, real translation commented out

### 4. UI Pages (232 lines total)

**SDS List** `src/app/(app)/sds/page.tsx` (65 lines)
- ✅ Complete: Document listing with status/supplier/date
- ✅ Complete: Navigation to detail pages

**SDS Detail** `src/app/(app)/sds/[id]/page.tsx` (102 lines)
- ✅ Complete: Extraction display with SectionTabs component
- ✅ Complete: PDF preview with signed URL
- ✅ Complete: Review queue count display

**Safety Card Page** `src/app/(app)/sds/[id]/safety-card/page.tsx` (127 lines)
- ✅ Complete: Card status display (status, template, generated date, consultant review flag)
- ✅ Complete: QR code generation and display
- ✅ Complete: Generate button with Inngest trigger
- ✅ Complete: Public view link

**Public Card Page** `src/app/public/card/[token]/page.tsx` (110 lines)
- ✅ Complete: Rate limiting (60 req/min per IP)
- ✅ Complete: Token expiry validation
- ✅ Complete: Org access mode enforcement (login_required vs public)
- ✅ Complete: RLS-compliant org membership check
- ✅ Complete: X-Robots-Tag header (set in middleware)
- ⚠️ **STUBBED:** Card content rendering (line 102-106) — placeholder only

**Upload Page** `src/app/(app)/sds/upload/page.tsx` (16 lines)
- ✅ Complete: Basic upload UI with UploadDropzone component

---

## MISSING — What's NOT Implemented

### Critical Gaps

1. **API Routes** — `src/app/api/safety-cards/` directory does NOT exist
   - ❌ No `/api/safety-cards/{id}/pdf` endpoint (referenced in public card page)
   - ❌ No `/api/safety-cards/{id}` GET endpoint
   - ❌ No `/api/safety-cards/generate` POST endpoint
   - ❌ No PDF generation/download logic

2. **Card Content Rendering** — Public card page is a shell
   - ❌ No extraction data fetching in public card page
   - ❌ No section-by-section rendering (16 GHS sections)
   - ❌ No Vietnamese/English toggle UI
   - ❌ No print-to-PDF styling
   - ❌ No pictogram rendering

3. **Translation Integration** — Inngest function is stubbed
   - ❌ `translateSections()` is never called in generate-safety-card.ts
   - ❌ Translated sections never stored in database
   - ❌ No locale field usage (schema has it, code ignores it)

4. **Database Queries** — Missing extraction data joins
   - ❌ Public card page doesn't fetch extraction data
   - ❌ No safety_cards → sds_extractions → sections join
   - ❌ No translated_sections storage (schema has source_extraction_id but no translated_sections field)

5. **Components** — Referenced but not verified
   - ❌ `SectionTabs` component (used in SDS detail page)
   - ❌ `UploadDropzone` component (used in upload page)
   - ❌ `SdsStatusBadge` component (used in SDS detail page)

6. **Styling/Layout** — Public card page is minimal
   - ❌ No print-friendly CSS
   - ❌ No mobile-optimized card layout
   - ❌ No pictogram/hazard symbol rendering
   - ❌ No multi-language layout support

---

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Database | ✅ Ready | Schema complete, RLS configured |
| Translation Logic | ✅ Ready | MOIT glossary + Claude integration |
| QR Generation | ✅ Ready | Token + data URL generation |
| UI Navigation | ✅ Ready | List, detail, card pages exist |
| **API Routes** | ❌ Missing | No endpoints for PDF/data retrieval |
| **Card Rendering** | ❌ Missing | Public page is placeholder only |
| **Translation Execution** | ⚠️ Stubbed | Function exists but not called |
| **Extraction Integration** | ❌ Missing | No data flow to public card |

**Next Steps:** Build API routes, implement card content rendering, wire up translation in Inngest, add extraction data fetching to public page.

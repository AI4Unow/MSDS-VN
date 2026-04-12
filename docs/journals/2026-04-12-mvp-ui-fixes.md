# MVP UI/UX Fixes - 2026-04-12

## Summary
Completed 3-phase plan to fix UI/UX discrepancies and broken chatbot functionality in MSDS MVP.

## Changes Made

### Phase 1: Favicon
- Created `src/app/icon.tsx` using Next.js icon convention
- Eliminates 404 errors for missing favicon.ico

### Phase 2: Dashboard Navigation
- Converted static dashboard cards to Next.js `<Link>` components
- Added hover effects and proper routing:
  - Tài liệu SDS → `/sds`
  - Hóa chất → `/chemicals`
  - Phiếu an toàn → `/sds`
  - Câu hỏi tuân thủ → `/chat`

### Phase 3: Chatbot Restoration
- Updated Gemini model references: `gemini-2.0-flash-lite` → `gemini-3.1-flash-lite`
- Created `src/lib/chat/wiki-fallback-data.ts` with hardcoded regulatory content
- Modified `src/lib/chat/wiki-tools.ts` to use fallback when DB returns empty
- Enables chatbot to function without live database

## Files Modified
- `src/app/icon.tsx` (NEW)
- `src/app/(app)/dashboard/page.tsx` (MODIFIED)
- `src/lib/ai/gemini-client.ts` (MODIFIED)
- `src/lib/chat/wiki-fallback-data.ts` (NEW)
- `src/lib/chat/wiki-tools.ts` (MODIFIED)

## Verification
- Build passed successfully
- All phases completed per plan requirements

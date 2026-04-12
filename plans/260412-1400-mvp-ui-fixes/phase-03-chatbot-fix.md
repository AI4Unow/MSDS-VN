# Phase 3: Chatbot Restoration

**Status:** ✅ Completed

<!-- Updated: Validation Session 1 - Expanded scope to cover mocked DB wiki fallback -->

## Objective
Restore full functionality to the Compliance Chatbot (Tư vấn tuân thủ). Two failures exist:
1. **Model 404**: `gemini-2.0-flash-lite` is deprecated/unavailable.
2. **Empty wiki**: The mocked DB returns `[]` for all wiki tool calls, so the LLM gets "Wiki index not found" and can't answer compliance questions.

## Task Details

### 3a. Update Gemini Model References
- **File**: `src/lib/ai/gemini-client.ts`
- Replace `gemini-2.0-flash-lite` → `gemini-3.1-flash-lite` (default, optimized for latency)
- Replace `gemini-2.0-flash` → `gemini-3.1-flash` (complex queries requiring deeper reasoning)
- The `routeExtractionModel()` function uses the same models — update both exports.

**Code change:**
```ts
export const geminiFlashLite = google("gemini-3.1-flash-lite");
export const geminiFlash = google("gemini-3.1-flash");
```

### 3b. Add Hardcoded Wiki Fallback Data
- **File**: `src/lib/chat/wiki-tools.ts`
- When the DB query returns empty/null for `read_wiki_index`, fall back to a hardcoded index string covering the key regulatory documents.
- When `read_wiki_page` gets no DB result, fall back to a hardcoded map of critical regulation pages.

**Approach**: Create a new file `src/lib/chat/wiki-fallback-data.ts` containing:
- `FALLBACK_WIKI_INDEX`: A markdown index listing key regulation slugs and titles.
- `FALLBACK_WIKI_PAGES`: A `Record<string, { title: string; category: string; contentMd: string }>` map with essential regulation content covering:
  - Circular 01/2026/TT-BCT (SDS requirements, Appendix I template)
  - Law on Chemicals 2025 (69/2025/QH15) overview
  - Decree 26/2026/ND-CP summary
  - GHS Rev 10 basics (classification, labeling, pictograms)

**Modified `wiki-tools.ts` logic:**
```ts
// In read_wiki_index execute():
const index = await db...;
const content = index[0]?.contentMd ?? FALLBACK_WIKI_INDEX;
return { indexMd: content };

// In read_wiki_page execute():
const page = await db...;
if (!page[0]) {
  const fallback = FALLBACK_WIKI_PAGES[slug];
  if (fallback) return fallback;
  return { error: `Page "${slug}" not found.` };
}
```

### 3c. Verify End-to-End
- Start dev server, navigate to `/chat`.
- Send: "Công bố hóa chất theo Circular 01/2026 cần những gì?"
- Expect: Streamed Vietnamese response citing wiki pages with `[n]` citations.

## Files Modified
- `src/lib/ai/gemini-client.ts` (MODIFY — model strings)
- `src/lib/chat/wiki-tools.ts` (MODIFY — fallback logic)
- `src/lib/chat/wiki-fallback-data.ts` (NEW — hardcoded regulation content)

## Completion Criteria
- Chat API returns streamed response (no 404 or 500).
- Response includes regulatory content from fallback wiki data.
- Model router still uses `gemini-3.1-flash-lite` for simple queries, `gemini-3.1-flash` for complex.

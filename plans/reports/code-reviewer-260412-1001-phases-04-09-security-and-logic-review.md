# Code Review: SDS Platform Phases 04-09

**Date:** 2026-04-12
**Reviewer:** code-reviewer
**Scope:** Full codebase security & logic review (phases 04-09)
**LOC:** ~2,400 across ~50 files

---

## Overall Assessment

The codebase is well-structured with clean separation of concerns. DB schemas have proper indexes and FK constraints. Auth uses Auth.js v5 database sessions with org-scoping. However, there is **one critical SQL injection vulnerability** and several high-severity issues that must be fixed before production.

---

## Critical Issues

### C1. SQL Injection in Extraction Field Update Route

**File:** `src/app/api/extractions/[id]/fields/[path]/route.ts` (line 44-48)

```typescript
await db.execute(sql`
  UPDATE sds_extractions
  SET sections = jsonb_set(sections, ${jsonPath}::text[], ${sql.raw(`'${JSON.stringify(value)}'::jsonb`)})
  WHERE id = ${extractionId}
`);
```

`sql.raw()` interpolates `value` directly into the SQL string. The `value` comes from `request.json()` with zero sanitization. An attacker can craft a payload like `{"value": "'); DROP TABLE sds_extractions; --"}` or more subtly inject arbitrary SQL via the JSON string.

Additionally, `fieldPath` (from URL params) flows through the regex into `jsonPath` without validation that the extraction belongs to the attacker's org. The `WHERE id = ${extractionId}` has no org filter.

**Impact:** Full SQL injection -- arbitrary read/write on the database. Auth bypass on data access (can modify any org's extractions).

**Fix:**
1. Replace `sql.raw()` with parameterized values:
```typescript
await db.execute(sql`
  UPDATE sds_extractions
  SET sections = jsonb_set(sections, ${jsonPath}::text[], ${JSON.stringify(value)}::jsonb)
  WHERE id = ${extractionId}
`);
```
2. Add org-scoping to the WHERE clause:
```typescript
AND sds_id IN (SELECT id FROM sds_documents WHERE org_id = ${orgId})
```
Or join through `sdsDocuments` to verify ownership.

### C2. Public Card Page Does Not Respect `cardAccessMode`

**File:** `src/app/(public)/card/[token]/page.tsx`

The public card page serves content for any valid token regardless of the organization's `cardAccessMode` setting. When `cardAccessMode` is `"login_required"`, the page should either redirect to login or show a restricted view. Currently it always renders the full card with download link.

**Impact:** Organizations that set `login_required` mode expect their safety cards to be private. A leaked QR token exposes the data anyway.

**Fix:** After fetching the card, also fetch the org's `cardAccessMode`. If `"login_required"`, check for authenticated session and org membership before rendering.

---

## High Priority Issues

### H1. No Rate Limiting on Waitlist Endpoint

**File:** `src/app/api/waitlist/route.ts`

No rate limiting, no CAPTCHA (honeypot field exists but is never checked server-side). The `email` validation is minimal (`includes("@")`). An attacker can:
- Enumerate registered emails via timing or the "already signed up" response
- Spam the table with thousands of entries
- Use the endpoint for email verification oracle attacks

**Fix:** Add rate limiting (e.g., Vercel KV-based), validate email with `z.string().email()`, check the honeypot field server-side (reject if `website` field is filled), and consider CAPTCHA.

### H2. Inngest Function Lacks Org Membership Verification

**File:** `src/inngest/functions/generate-safety-card.ts`

The Inngest function accepts `sdsId` and `orgId` from event data but does not verify that the SDS document actually belongs to the provided `orgId`. If an attacker can send an Inngest event (e.g., via the Inngest dev server or a misconfigured endpoint), they could trigger safety card generation for any org's documents.

Same issue exists in `extract-sds.ts` -- no org ownership check on the SDS document before processing.

**Fix:** Verify `sdsDocuments.orgId === event.data.orgId` before processing. Add the Inngest signing key validation middleware.

### H3. `requireOrg()` Throws Generic Error (Not HTTP Response)

**File:** `src/lib/auth/require-org.ts`

`requireOrg()` throws plain `Error` objects instead of Next.js `NextResponse.json()` redirects. In API routes, these unhandled errors may leak stack traces to clients depending on Next.js error handling config.

**Fix:** Throw a `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` or use a custom error class that maps to proper HTTP responses.

### H4. Chat Route Has No Input Validation or Message Limit

**File:** `src/app/api/chat/route.ts`

No validation on `messages` shape, no max message count, no content length limit. An attacker can:
- Send thousands of messages in one request to exhaust AI API quota
- Send malformed `messages` array causing runtime errors
- Send extremely long messages burning tokens

**Fix:** Validate messages with zod, cap at 50 messages, limit individual message content to ~10KB.

### H5. Safety Card Blob Upload is Public

**File:** `src/inngest/functions/generate-safety-card.ts` (line 53)

```typescript
const blob = await put(pathname, pdfBuffer, {
  access: "public",
  ...
});
```

Safety card PDFs are uploaded with `access: "public"`, meaning anyone with the URL can download them. The URL is predictable (orgId + cardId). Combined with the public token page, this means PDFs are freely accessible regardless of `cardAccessMode`.

**Fix:** Upload with `access: "private"` and serve via a signed-URL route that checks auth when `cardAccessMode` is `"login_required"`.

### H6. `updateOrgName` Overwrites Settings JSON

**File:** `src/app/(app)/settings/org/actions.ts` (line 12)

```typescript
.set({ name, settings: { defaultLocale: "vi" } })
```

Every org name update hardcodes `settings: { defaultLocale: "vi" }`, wiping out any other settings that may have been stored. If `settings` later accumulates more keys, this will silently destroy them.

**Fix:** Use `sql` to merge: `settings = settings || { defaultLocale: "vi" }` or only set `name` without touching `settings`.

---

## Medium Priority Issues

### M1. Wiki Tool `slug` Not Sanitized for Path Traversal

**File:** `src/lib/chat/wiki-tools.ts`

The `read_wiki_page` tool accepts arbitrary `slug` strings from AI model output. While Drizzle parameterizes queries (no SQL injection), there is no validation that the slug matches expected format (e.g., `a-z0-9-`). A hallucinated slug with special chars could cause unexpected behavior or match unintended rows.

### M2. `fetchPdfFromBlob` Has No Size Limit

**File:** `src/lib/ai/fetch-pdf-from-blob.ts`

Fetches the entire PDF into memory, converts to base64 (33% size increase), and holds it all in memory simultaneously. A 25MB PDF (the upload limit) becomes ~33MB in base64, plus the original buffer. No streaming.

**Fix:** Consider limiting PDF size for extraction or streaming the base64 conversion.

### M3. Audit Log Silently Drops Errors

**File:** `src/lib/audit/log.ts`

The `getAuthContext()` function catches all errors and returns `null` userId/orgId. This means audit entries for failed auth flows record no user info. While intentional for resilience, it also means security-sensitive events (failed auth attempts) leave no trace.

### M4. `generateSafetyCard` Does Not Validate Extraction Data Before AI Call

**File:** `src/inngest/functions/generate-safety-card.ts`

Passes `extraction[0].sections` directly to the translator without validating the shape matches `ExtractionResult`. If the extraction data is corrupted or from an older schema version, `generateObject` will fail with a cryptic validation error rather than a clear message.

### M5. Public Card Page XSS Via Raw Hazard Statements

**File:** `src/app/(public)/card/[token]/page.tsx`

The page renders `section2.hazardStatements` from the database in JSX. While React escapes by default, the data comes from AI extraction stored as JSONB. If someone manually edits the extraction data (via the PATCH endpoint), they could inject HTML that React would still escape, but the PDF renderer (`render-pdf.tsx`) uses `@react-pdf/renderer` which has different XSS semantics. Low risk but worth noting.

### M6. QR Generator URL Construction Missing Validation

**File:** `src/lib/safety-card/qr-generator.ts`

```typescript
const url = `${origin}/public/card/${token}`;
```

`origin` parameter is not validated. If called with a malicious origin, the QR code would point to an attacker-controlled URL. Currently the function is only called in the Inngest function which doesn't pass origin at all -- the `generateQrDataUrl` function is defined but never called. The QR code is never actually rendered.

### M7. `sds/[id]/card/page.tsx` Missing `orderBy` Import

**File:** `src/app/(app)/sds/[id]/card/page.tsx` (line 30)

Uses `.orderBy(safetyCards.createdAt)` but does not import `orderBy` from drizzle-orm. Will cause a runtime error when this page is loaded. Only `eq`, `and` are imported, but `orderBy` is used directly on line 30. Actually, Drizzle's `.orderBy()` accepts column references directly -- but the import of the `desc` helper is missing if descending order is intended. The default is ascending which is probably wrong (you want the latest card first).

### M8. Error Handling in Extraction Field Update -- Wrong Query Filter

**File:** `src/app/api/extractions/[id]/fields/[path]/route.ts` (line 59)

The review queue update filters by `eq(reviewQueue.sdsId, extractionId)`, but `extractionId` is the extraction's ID, not the SDS document's ID. The `sdsId` column in `reviewQueue` references `sdsDocuments.id`, not `sdsExtractions.id`. This means the review queue status update will never match any rows.

**Fix:** Look up the extraction first to get `sdsId`, then use that for the review queue update.

---

## Low Priority Issues

### L1. Font URLs in `render-pdf.tsx` Are Hardcoded External

Fetches fonts from `fonts.gstatic.com` at PDF render time. If Google Fonts is down or rate-limited, PDF generation fails. Consider bundling fonts.

### L2. `section_13` Label Has Chinese Character

**File:** `src/lib/ai/extraction-schema.ts` (line 187)

`section_13: "13. Xử lý废弃物"` contains Chinese characters (`废弃物`). Should be `"13. Xử lý废弃物"` or the correct Vietnamese term.

### L3. `pickChatModel` Allocates New Array Every Call

**File:** `src/lib/chat/model-router.ts`

`[...messages].reverse()` creates a new array and reverses it. Could use `findLast` or iterate from the end. Minor perf concern.

### L4. `DefaultChatTransport` Import

**File:** `src/app/(app)/chat/page.tsx`

Imports `DefaultChatTransport` from `"ai"`. Verify this export exists in AI SDK v6 -- in some versions it was `@ai-sdk/react` or required a different import path.

### L5. `updateCardAccessMode` Server Action Has No Optimistic Locking

If two admins change the mode simultaneously, last write wins silently. Consider adding a `updatedAt` check.

---

## Positive Observations

- **Proper DB schema design:** Good use of indexes, FK constraints with appropriate `onDelete` behaviors (`cascade`, `set null`)
- **Tenant isolation pattern:** All app queries scope by `orgId` (except the critical exceptions noted above)
- **AI SDK v6 patterns:** `streamText`, `generateObject`, `stepCountIs`, `convertToModelMessages` all appear correct for v6
- **Auth.js v5:** Database session strategy with proper callback to attach `orgId` to session
- **Drizzle ORM usage:** Queries are properly parameterized everywhere except the one `sql.raw()` call
- **Env validation:** `@t3-oss/env-nextjs` with proper zod schemas, no secrets in client bundle
- **Inngest step functions:** Proper use of `step.run` for durable execution
- **Audit logging:** Present for key operations with IP capture
- **Blob upload path validation:** `onBeforeGenerateToken` validates `orgId/sds/` prefix

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix SQL injection in extraction field PATCH route -- replace `sql.raw()` with parameterized value, add org-scoping
2. **[CRITICAL]** Enforce `cardAccessMode` in public card page
3. **[HIGH]** Add rate limiting and email validation to waitlist endpoint
4. **[HIGH]** Add org ownership verification in Inngest functions
5. **[HIGH]** Add input validation and message limits to chat route
6. **[HIGH]** Upload safety card PDFs as private blobs, serve via signed URL route
7. **[HIGH]** Fix `updateOrgName` to not overwrite settings JSON
8. **[MEDIUM]** Fix review queue update filter (extractionId vs sdsId mismatch)
9. **[MEDIUM]** Fix `orderBy` for safety cards query (import `desc`)
10. **[MEDIUM]** Fix Chinese character in section_13 label

---

## Metrics

- Type Coverage: ~85% (Zod schemas for AI, but API routes lack request validation)
- Test Coverage: 0% (no test files found)
- Linting Issues: Not run (no eslint config visible)
- Files Reviewed: ~50
- Issues Found: 2 Critical, 6 High, 8 Medium, 5 Low

---

## Unresolved Questions

1. Is `DefaultChatTransport` the correct import for AI SDK v6.0.158? The package version suggests it should be available.
2. The `generateQrDataUrl` function exists but is never called -- is QR code rendering planned for a future phase?
3. No middleware.ts file exists -- is CSRF protection handled elsewhere, or is the app relying solely on SameSite cookies?
4. The Inngest signing key is optional in env validation -- how is Inngest event authenticity verified in production?

**Status:** DONE_WITH_CONCERNS
**Summary:** Found 1 critical SQL injection vulnerability and 1 critical auth bypass in card access mode. 6 high-severity issues including missing rate limiting, input validation, and org-scoping gaps. Code quality is generally good but needs security hardening before production.
**Concerns:** SQL injection (C1) and card access bypass (C2) are production-blocking. Zero test coverage is a risk for a compliance product.

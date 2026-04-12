# Code Review: SDS Platform Phases 05-09

**Reviewer:** code-reviewer
**Date:** 2026-04-12
**Scope:** Wiki (05), Safety Cards (06), Chat (07), Billing (09)

---

## Critical Issues

### C1. Webhook error suppression masks data corruption
**File:** `src/app/api/stripe/webhook/route.ts:39-43`
```ts
try {
  await handleWebhookEvent(event);
} catch (err: unknown) {
  console.error("Stripe webhook processing error:", err);
  // Still return 200 so Stripe doesn't retry indefinitely
}
```
**Impact:** Failed subscription updates (plan downgrade, cancellation) silently dropped. Customer pays but org stays on wrong plan (or vice versa). No dead-letter queue, no retry, no alert.
**Fix:** Write failed events to a `stripe_failed_events` table. Add a monitoring alert. Consider returning 500 for transient DB errors (Stripe retries with exponential backoff).

### C2. Missing plan validation in checkout endpoint
**File:** `src/app/api/stripe/checkout/route.ts:35-38`
```ts
if (body.priceId) {
  priceId = body.priceId;  // ARBITRARY price ID accepted
} else if (body.plan) {
  priceId = getPriceIdForPlan(body.plan as PlanTier);
}
```
**Impact:** Any authenticated user can pass an arbitrary `priceId` (e.g. a test mode price, a discounted price from another product). The `body.plan` path validates, but `body.priceId` path does not.
**Fix:** Remove direct `priceId` acceptance, or validate against `PRICE_ID_MAP` values.

### C3. Race condition in safety card supersede + insert
**File:** `src/inngest/functions/generate-safety-card.ts:39-61`
```ts
// Mark existing ready cards as superseded
await supabase
  .from("safety_cards")
  .update({ status: "superseded" })
  .eq("sds_id", sdsId)
  .eq("status", "ready");

const { data, error } = await supabase
  .from("safety_cards")
  .insert({ status: "generating", ... })
```
**Impact:** Two concurrent `generate` events for the same SDS can both read no "ready" cards, both insert "generating", resulting in duplicate active cards. No unique constraint prevents this.
**Fix:** Add a partial unique index `UNIQUE (sds_id) WHERE status IN ('ready', 'generating')` or use `SELECT ... FOR UPDATE` in a transaction.

### C4. Translated data never persisted
**File:** `src/inngest/functions/generate-safety-card.ts:69-82`
```ts
await supabase
  .from("safety_cards")
  .update({
    status: "ready",
    updated_at: new Date().toISOString(),
    // Store translated sections for PDF rendering and public view
  })
  .eq("id", cardRecord.id);

// Store translated data in a separate record for retrieval
// The extraction sections remain the source of truth (EN)
// Card-specific translated data is stored alongside the card
```
**Impact:** `translatedSections` computed in step 3 is never written to the database. Both the PDF endpoint and public card page read raw English extraction data and render it as-is. The entire translation pipeline is dead code. The comment acknowledges this but it is unresolved.
**Fix:** Add a `translated_sections` JSONB column to `safety_cards` and persist `translatedSections` in the update.

---

## High Priority

### H1. Chat API leaks error details to client
**File:** `src/app/api/chat/route.ts:117-123`
```ts
catch (error: any) {
  return NextResponse.json(
    { error: error.message ?? "Chat failed" },
    { status: 500 }
  );
}
```
**Impact:** `error.message` may contain Anthropic API errors, internal URLs, or stack-trace fragments. Same pattern in checkout/portal routes.
**Fix:** Return generic message (`"Chat failed"`) to client, log full error server-side only.

### H2. Wiki tool input not validated
**File:** `src/lib/chat/wiki-tools.ts:48-49`
```ts
const slug = input.slug as string;
const { data } = await supabase.from("wiki_pages")
  .select("title, content_md, frontmatter")
  .eq("slug", slug)
```
**Impact:** `slug` is user-controlled (Claude passes it from LLM output). No validation for path traversal patterns or injection. Supabase parameterizes queries so SQL injection is mitigated, but a malicious or confused Claude could read arbitrary slugs including `index`.
**Fix:** Validate slug format (`/^[a-z0-9\-\/]+$/`), reject `index`.

### H3. Entitlement check TOCTOU race
**File:** `src/lib/billing/entitlements.ts:14-74` + `src/app/api/chat/route.ts:55-58`
```ts
await checkEntitlement(userData.org_id, "chat_message");
// ... several DB writes ...
await incrementUsage(userData.org_id, "chat_messages");
```
**Impact:** Two concurrent chat requests can both pass the entitlement check before either increments the counter, allowing 2x the limit. Same pattern applies to SDS uploads and card generation.
**Fix:** Use `increment_usage` RPC that atomically checks and increments (return error if over limit), or use Postgres advisory locks.

### H4. Rate limit failure denies all access
**File:** `src/lib/rate-limit.ts:28-34`
```ts
if (error) {
  console.error("public-card rate limit check failed", error.message);
  return { allowed: false, remaining: 0, ... };
}
```
**Impact:** If the `check_public_card_rate_limit` RPC fails (DB connectivity issue, function missing), all public card access is blocked. This is a availability risk.
**Fix:** Fail open on DB errors (return `allowed: true`) or use a fallback in-memory counter.

### H5. No user email validation in Stripe customer creation
**File:** `src/lib/billing/stripe.ts:54-56`
```ts
const customerId = await getOrCreateCustomer(
  userData.org_id,
  user.email ?? ""  // empty string if email is null
);
```
**Impact:** Creates Stripe customer with empty email. Stripe may reject or create orphaned customer.
**Fix:** Validate email is present before calling; return 400 if missing.

### H6. `callClaude` retry loop can throw unreachable error
**File:** `src/lib/ai/claude-client.ts:23-41`
```ts
for (let attempt = 0; attempt < 3; attempt++) {
  // ...
  if (error?.status === 429 && attempt < 2) { continue; }
  throw error;
}
throw new Error("Max retries exceeded");
```
**Impact:** The `throw error` inside the loop means non-429 errors throw immediately, which is correct. But the final `throw new Error("Max retries exceeded")` is actually unreachable because the loop only reaches iteration 2 after a 429, and `attempt < 2` would be false, so it throws the original error at iteration 2. The dead code is confusing but not harmful. However, if the API returns 429 three times, the error thrown is the original 429 error, not "Max retries exceeded" -- the retry count is misleading.
**Fix:** After the loop, throw a descriptive error including the 429 details.

---

## Medium Priority

### M1. Seed scripts run sequential upserts (N+1 pattern)
**Files:** `scripts/seed-wiki-regulations.ts:456-476`, `scripts/seed-wiki-chemicals-top50.ts:65-115`
**Impact:** 10 and 50 sequential Supabase calls respectively. Index rebuild also sequential. Acceptable for seed scripts (one-time), but slow for re-runs.
**Fix:** Batch upsert with `supabase.from("wiki_pages").upsert(rows, { onConflict: "slug" })`.

### M2. Duplicate index rebuild logic in seed scripts
**Files:** `scripts/seed-wiki-regulations.ts:479-515`, `scripts/seed-wiki-chemicals-top50.ts:125-152`
**Impact:** ~30 lines of identical index rebuild code duplicated between two scripts. Should use `buildWikiIndex` from `src/lib/wiki/index-builder.ts`.
**Fix:** Import and call `buildWikiIndex()` from the shared module.

### M3. Seed scripts use `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
**Files:** `scripts/seed-wiki-*.ts`
**Impact:** Mixes client-side env var naming (`NEXT_PUBLIC_`) with server-side secret. Functional but confusing. Scripts also don't validate env vars exist before use -- `!` assertion will throw at runtime with unclear error.
**Fix:** Add explicit env var validation at script entry, e.g. `if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { console.error("..."); process.exit(1); }`.

### M4. Wiki preview XSS risk from raw markdown rendering
**File:** `src/components/chat/wiki-page-preview.tsx:95`
```tsx
<div className="prose prose-sm ... whitespace-pre-wrap">
  {page.content_md}
</div>
```
**Impact:** Rendering `content_md` as text inside a `<div>` is safe against XSS (React escapes text nodes). However, if a future refactor switches to `dangerouslySetInnerHTML` or a markdown renderer, wiki content (editable by system/admin) becomes an XSS vector.
**Fix:** Add a comment warning about XSS if switching to HTML rendering. Consider using a sanitized markdown renderer.

### M5. Safety card public page -- `organizations!inner` join assumes one-to-one
**File:** `src/app/public/card/[token]/page.tsx:46`
```ts
organizations!inner(card_access_mode)
```
**Impact:** If the `sds_documents.org_id` does not match any organization row (orphaned SDS), the query returns null and `notFound()` is returned. This is likely the intended behavior but may confuse debugging.
**Fix:** None required; add a comment explaining the `!inner` is intentional for access control.

### M6. Stripe API version may not exist
**File:** `src/lib/billing/stripe.ts:15`
```ts
apiVersion: "2026-03-25.dahlia",
```
**Impact:** Stripe API versions use date format. "2026-03-25.dahlia" may or may not be a valid Stripe API version. If invalid, all Stripe calls will fail at initialization.
**Fix:** Verify this is a valid Stripe API version. Consider using `apiVersion: "2025-04-30.basil"` or the latest stable.

### M7. `stripe-price-lookup.ts` fails at module load time if env vars missing
**File:** `src/lib/billing/stripe-price-lookup.ts:4-9`
```ts
const PRICE_ID_MAP: Record<PlanTier, string> = {
  free: "",
  starter: process.env.STRIPE_STARTER_PRICE_ID ?? "",
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
```
**Impact:** `process.env` is evaluated at module load. In some bundler configurations, this may resolve to empty strings at build time. The fallback to `""` is fine, but `getPlanForPriceId` with an empty string will never match, and `getPriceIdForPlan` will throw for non-free tiers.
**Fix:** Move env var reads into the functions or validate at startup. At minimum, add a startup health check.

---

## Low Priority

### L1. Model router word count uses whitespace split -- poor for Vietnamese
**File:** `src/lib/chat/model-router.ts:34`
```ts
const wordCount = userMessage.trim().split(/\s+/).length;
```
**Impact:** Vietnamese uses multi-word compounds and diacritics. Word count is approximate but functional for the heuristic.
**Fix:** Acceptable for routing purposes. No change needed.

### L2. `UsageBar` handles `Infinity` but shows `0%` bar
**File:** `src/app/(app)/settings/billing/page.tsx:160`
```ts
const pct = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
```
**Impact:** Unlimited plans show an empty progress bar. Minor UX concern.
**Fix:** Show a "No limit" label instead of an empty bar for `Infinity` limits.

### L3. `renderSafetyCardPdf` double-wraps Buffer
**File:** `src/lib/safety-card/render-pdf.tsx:8`
```ts
const buffer = await renderToBuffer(<SafetyCardTemplate data={data} />);
return Buffer.from(buffer);
```
**Impact:** `renderToBuffer` already returns a `Buffer`/`Uint8Array`. `Buffer.from()` on a Buffer is a no-op copy. Wasteful but not harmful.
**Fix:** Return `buffer` directly, or cast: `return buffer as Buffer`.

---

## Positive Observations

- Proper auth checks on all API routes (user auth + org membership verification)
- Stripe webhook signature verification is correct
- Rate limiting on public card endpoints
- Audit logging on chat messages with cost tracking
- QR token uses `nanoid(32)` (128-bit entropy, URL-safe)
- MOIT glossary enforcement in translation pipeline
- Proper use of Supabase admin client only where needed
- Chat agent enforces max tool rounds to prevent infinite loops
- Public card page checks token expiry and org access mode

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Persist translated sections in safety card record (C4) -- entire VI translation feature is non-functional without this
2. **[CRITICAL]** Add webhook dead-letter table for failed Stripe events (C1) -- billing state can silently diverge
3. **[CRITICAL]** Validate `priceId` against known prices in checkout endpoint (C2)
4. **[CRITICAL]** Add unique constraint or locking for concurrent card generation (C3)
5. **[HIGH]** Sanitize error messages returned to clients (H1)
6. **[HIGH]** Make entitlement check + increment atomic (H3)
7. **[HIGH]** Fail open on rate limit DB errors (H4)
8. **[MEDIUM]** Verify Stripe API version string (M6)
9. **[MEDIUM]** Deduplicate index rebuild in seed scripts (M2)

---

## Unresolved Questions

- Is `apiVersion: "2026-03-25.dahlia"` a real Stripe API version or a placeholder?
- Does `increment_usage` RPC in Postgres handle concurrent upserts atomically? If not, H3 applies.
- Is there a database migration that adds `translated_sections` to `safety_cards` table, or does it need to be created?
- What is the intended behavior when a webhook fails for a `customer.subscription.deleted` event? The org stays on the paid plan indefinitely.

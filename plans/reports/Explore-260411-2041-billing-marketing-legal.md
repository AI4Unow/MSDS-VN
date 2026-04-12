# Scout Report: Billing, Marketing & Legal

**Date:** 2026-04-11 | **Scope:** Medium thoroughness

---

## Summary

**EXISTS:** 9 files across billing, marketing, and legal (807 total lines)
**MISSING:** Stripe API routes, marketing components, payment processing

---

## What EXISTS

### Marketing Pages (2 files, 250 lines)
| File | Lines | Status |
|------|-------|--------|
| `src/app/(marketing)/page.tsx` | 123 | **Complete** - Full landing page with hero, features, social proof, CTA, footer. Vietnamese copy. |
| `src/app/(marketing)/pricing/page.tsx` | 127 | **Complete** - 4-tier pricing (Free/Starter/Pro/Business) + Enterprise. All plans defined with features. |

### Legal Pages (3 files, 225 lines)
| File | Lines | Status |
|------|-------|--------|
| `src/app/(legal)/terms/page.tsx` | 64 | **Draft** - Terms in Vietnamese. Includes AI liability disclaimer, liability caps (30M VND), indemnification, suspension rights, dispute resolution (Singapore arbitration). Marked "draft - needs legal review". |
| `src/app/(legal)/privacy/page.tsx` | 67 | **Draft** - Privacy policy in Vietnamese. Covers data collection, usage, storage (Singapore), third-party sharing (Anthropic, Supabase, Stripe, Vercel), user rights, security. Marked "draft - needs legal review". |
| `src/app/(legal)/dpa/page.tsx` | 94 | **Draft** - Data Processing Addendum in Vietnamese. Defines controller/processor roles, processing scope, sub-processors table, data security (TLS, AES-256, RLS), retention (90 days post-subscription), breach notification (72h), audit rights. Marked "draft - needs legal review". |

### Billing Library (2 files, 128 lines)
| File | Lines | Status |
|------|-------|--------|
| `src/lib/billing/plans.ts` | 33 | **Complete** - Plan tier definitions with hard limits: Free (5 SDS, 0 cards, 0 chat), Starter (50/20/100), Pro (∞/∞/1000), Business/Enterprise (all ∞). |
| `src/lib/billing/entitlements.ts` | 95 | **Complete** - Entitlement checking logic. `checkEntitlement()` validates usage against plan limits. `incrementUsage()` updates monthly counters via RPC. Throws `EntitlementError` on limit breach. |

### Billing Settings Page (1 file, 148 lines)
| File | Lines | Status |
|------|-------|--------|
| `src/app/(app)/settings/billing/page.tsx` | 148 | **Complete** - Displays current plan, pricing, usage bars for SDS/cards/chat with month-to-date counts. Upgrade button (non-enterprise). Reads from `usage_counters` table. |

### Database Migration (1 file, 56 lines)
| File | Lines | Status |
|------|-------|--------|
| `supabase/migrations/0009_billing.sql` | 56 | **Complete** - Adds `stripe_customer_id`, `subscription_status`, `trial_ends_at`, `current_period_end` to organizations. Creates `usage_counters` table with RLS. Implements `increment_usage()` RPC function. |

---

## What's MISSING

### Critical Gaps

1. **Stripe API Routes** (`src/app/api/stripe/`)
   - No webhook handler for subscription events
   - No checkout session creation endpoint
   - No customer portal redirect
   - No payment method management

2. **Stripe Integration in Billing Page**
   - "Upgrade Plan" button exists but has no `onClick` handler
   - No Stripe checkout flow
   - No subscription management UI

3. **Marketing Components**
   - No reusable pricing card component
   - No feature comparison table
   - No testimonials/case studies component
   - No FAQ component

4. **Payment Processing**
   - No Stripe client initialization
   - No payment form component
   - No invoice history/download
   - No billing history page

5. **Entitlements Enforcement**
   - `checkEntitlement()` exists but not called in API routes
   - No middleware to enforce limits on SDS upload, card generation, chat
   - No usage increment calls after successful operations

6. **Legal/Compliance**
   - All three legal pages marked "draft - needs Vietnamese legal review"
   - No cookie consent banner
   - No GDPR/CCPA compliance UI
   - No data export/deletion request forms

---

## Component Inventory

**No marketing-specific components found** in `src/components/`. Only UI primitives (button, card, input, etc.) and app-specific components (SDS, auth, search, app-shell).

---

## Next Steps (Unresolved Questions)

1. When should `checkEntitlement()` be called? (Before SDS upload? Before card generation?)
2. Should Stripe webhook be synchronous or async?
3. Who handles trial-to-paid conversion logic?
4. Should legal pages be i18n-ready or Vietnamese-only?
5. Is there a separate admin panel for subscription management?


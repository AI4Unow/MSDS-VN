---
phase: 09
name: Landing + Legal + Launch (no billing)
weeks: 11-12
priority: P0-launch
status: complete
progress: 100%
completed: 2026-04-12
---

# Phase 09 — Landing + Legal + Launch

## Context
- Brainstorm §7 (Week 11–12), §11 (Pricing), §12 (Next Steps)
- Depends on: All prior phases
- Launch gate: Asia Shine actively using the product (free tier) + 3 design partners + legal pages live
- **Breaking change (2026-04-12):** Stripe and all payment-processor integration removed from MVP. Free tier only at launch. Billing deferred post-MVP.

## Frontend Build Protocol ⭐ (this is where the frontend-design skill earns its keep)
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before any UI work — **budget 3 extra days of polish beyond the rest of the MVP**. The landing page is the trust handshake before a 2.49M VND/month commitment from a VN EHS manager whose legal exposure is personal. AI-slop kills the deal silently.

**Non-negotiables (landing page):**
1. **Hero layout:** left-aligned or split-screen (real product screenshot right). **Never** centered-hero-with-gradient-blob — that is the slop signature of every AI-generated SaaS landing in 2026. Use `DESIGN_VARIANCE=3` from `docs/design-guidelines.md` — disciplined, not safe.
2. **Real screenshots only.** No stock photography, no AI-generated art, no Unsplash warehouse pictures. Product screenshots of the actual VI safety card + chat UI (blurred for trade secrets if needed). If a screenshot doesn't exist yet, hand-build a high-fidelity mock in Figma first — do not ship Lorem-ipsum dashboards.
3. **Atmosphere, not decoration:** subtle noise texture (SVG filter, 2–3% opacity) + one restrained gradient mesh behind the hero. No floating blobs, no animated gradients, no parallax.
4. **Typography-led hierarchy:** Be Vietnam Pro for VN copy, Geist or Manrope for EN toggle. Display sizes 48–72 px for hero headline. Real line-length control (`max-w-[62ch]` on prose). No "Elevate / Seamless / Unleash / Empower / Supercharge" copy — those words are on the forbidden list in `docs/design-guidelines.md`.
5. **Vietnamese-first copy** written by a human who knows the VN EHS manager's actual pain (Circular 01/2026 deadline panic, MOIT inspector risk). EN toggle is a courtesy, not parity. Testimonials are from real VN companies only (Asia Shine + design partners) — attributed with full name, title, company, and photo. Never stock-photo testimonials.
6. **Color discipline:** graphite neutral scale + safety amber (#D97706) as the single accent. No purple-to-blue gradients, no "AI glow" effects. Amber means "hazard / regulatory action" — earns its salience.
7. **Icons:** Phosphor (Regular weight) only. No Lucide (AI default), no emoji as icon. GHS pictograms as labeled SVGs on any feature card that mentions hazard classification.
8. **Feature grid:** 3-column editorial layout with real mini-screenshots, not icon-title-description cards. Each feature block leads with a product screenshot above a short Vietnamese paragraph. Max 6 feature blocks — restraint over completeness.

**Pricing page:**
- 5-tier comparison table (the brainstorm §11 grid), display-only. Single CTA per row: "Tham gia waitlist" / "Join waitlist".
- No "Most popular" badge shouting. Pro tier gets a quiet accent border only.
- Transparent "no checkout yet" footnote — honesty is the brand.
- VND primary, USD in small parens. Locale toggle switches which is primary.

**Legal pages (`/terms`, `/privacy`, `/dpa`):**
- Editorial long-form aesthetic — Stripe Legal × VN government document. Max prose width 72ch. Sequential h1→h6. Table of contents with `scroll-margin-top`. No decorative hero, no marketing voice — legal pages must *read* like a legal document, not a marketing page with legal text pasted in.
- Non-dismissable AI disclaimer callout box at the top of the EULA, styled as a genuine warning (amber border + amber-50 background), not a cute notification.
- Timestamp + version footer so customers can audit revisions.

**Waitlist form:**
- Single-column, large touch targets (≥48 dp), autofocus on email field, Vietnamese error messages for validation, honeypot hidden field, success state that thanks the user by name and shows their queue position if known.
- No modal — dedicated page. Modals are slop shortcuts.

**Shared AiDisclaimerFooter component:**
- 8 pt, small-caps, muted graphite, non-dismissable, appears on every safety card PDF + every chat assistant message. Copy: "Phiếu này được tạo tự động bằng AI. Người dùng phải tự xác minh trước khi sử dụng. SDS Platform không chịu trách nhiệm pháp lý cho việc sử dụng không đúng." (EN parallel beneath in smaller caps.)

**Pre-ship gates (blocking — do not launch without):**
- Lighthouse on `/` (landing) and `/pricing`: **Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95.** Test throttled to 3G Fast + mobile viewport. Fail any axis → fix before shipping.
- Anti-slop checklist run manually: no gradient blobs, no "AI" in copy outside the honest disclaimer, no stock photos, no forbidden words, no emoji-as-icon, no centered-hero-with-blob, no "Unleash your X" CTAs, no three-dot bouncing loaders.
- Real-device test: Samsung A-series Android (the warehouse manager's phone), Safari on iOS, both <3 s full paint on real 4G.
- VN diacritic rendering verified on all headlines at 360/768/1280 px breakpoints.
- EHS-manager dry-read: one actual VN EHS manager (not a designer, not a dev) reads the landing page cold and tells you in one sentence what the product does. If the sentence is wrong → rewrite copy, not design.

## Overview
Marketing landing, legal review, monitoring hardening, then public beta launch. Billing scaffold is **explicitly deferred** — no payment processor is integrated in the MVP. Plan tiers are documented on the pricing page but gated by a single "request access" CTA that routes to a waitlist form. Asia Shine runs on a complimentary free-tier slot during the MVP window.

## Requirements
- Marketing landing page (Vietnamese primary + English toggle)
- Public pricing page (static — no checkout; CTA = waitlist)
- Waitlist → onboarding conversion flow (email capture via Resend)
- VN lawyer-reviewed EULA + privacy policy + DPA — **must include AI-output disclaimer, 12-month-fees liability cap, venue clause, consultant-review-as-evidence recital**
- Sentry + Vercel Analytics in production
- **E&O insurance (UQ #5 — DECIDED 2026-04-11):** NOT purchased at launch. Rely on EULA liability cap + AI-output disclaimer + human-in-the-loop review UI (phase-03) + EHS-consultant-reviewed wiki + first-50-cards consultant sign-off (phase-06) as the complete defensive stack. Reassess if (a) first legal threat received, (b) >10 paying customers, or (c) any enterprise prospect requires proof of coverage in procurement. **Risk owned explicitly by founder.** Document decision + reassessment triggers in `docs/system-architecture.md` risk log.
- Asia Shine onboarded on free tier
- 3+ design partners actively using
- Public beta announcement

## Pricing Tiers — DISPLAY ONLY (no enforcement at MVP)
From brainstorm §11. All numbers shown on `/pricing` for positioning. No entitlement checks in code at MVP; everyone runs at the Pro limit.
| Plan | Price (VND/mo) | SDSs | VI cards | Chat | Seats |
|---|---|---|---|---|---|
| Free | 0 | 5 | 0 | 0 msgs | 1 |
| Starter | 499k (~$20) | 50 | 20/mo | 100 msgs | 2 |
| Pro | 2.49M (~$99) | unlimited | unlimited | 1000 msgs | 5 |
| Business | 7.9M (~$320) | unlimited | unlimited | unlimited | 10 + API |
| Enterprise | contact | — | — | — | — |

> **Deferred to post-MVP:** Stripe integration, checkout, customer portal, webhook handler, `entitlements.ts`, `usage-meter.ts`, billing settings page with upgrade CTA. Keep the on-brand pricing page so we can add the purchase flow later without redesign.

## Related Files

**Create:**
- `src/app/(marketing)/page.tsx` — landing (VN + EN toggle)
- `src/app/(marketing)/pricing/page.tsx` — static tiers + "Join waitlist" CTA
- `src/app/(marketing)/waitlist/page.tsx` — email capture
- `src/app/api/waitlist/route.ts` — Resend send + Drizzle insert into `waitlist_signups`
- `src/lib/db/schema/waitlist.ts` — `waitlist_signups` table
- `drizzle/migrations/0008_waitlist.sql`
- `src/app/(legal)/terms/page.tsx`
- `src/app/(legal)/privacy/page.tsx`
- `src/app/(legal)/dpa/page.tsx`
- `src/components/marketing/hero.tsx`, `feature-grid.tsx`, `social-proof.tsx`, `cta-card.tsx`
- `src/components/marketing/ai-disclaimer-footer.tsx` — persistent on every safety card PDF + chat message (shared component)
- `docs/deployment-guide.md`
- `docs/project-changelog.md` — initialize
- `docs/development-roadmap.md` — initialize post-MVP roadmap (first entry: billing)

**Delete (prior Stripe baseline):**
- `src/lib/billing/stripe.ts`
- `src/lib/billing/entitlements.ts`
- `src/lib/billing/usage-meter.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/(app)/settings/billing/page.tsx` (or stub to "Coming soon")
- `stripe` dep from `package.json`
- Any `stripe_customer_id`, `subscription_status`, `trial_ends_at`, `current_period_end` columns from `organizations` schema

## Data Model (Drizzle — `src/lib/db/schema/waitlist.ts`)
```ts
export const waitlistSignups = pgTable('waitlist_signups', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  companyName: text('company_name'),
  role: text('role'),
  locale: text('locale').default('vi').notNull(),
  source: text('source'),                         // "landing", "pricing", "blog"
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Remove from `organizations`:** `stripe_customer_id`, `subscription_status`, `trial_ends_at`, `current_period_end`. Keep `plan` column with default `'free'` for future use.

## Implementation Steps

### Landing + Waitlist
1. Build landing page (VN primary, EN toggle): hero, killer feature demos (card generator + chat), pricing teaser, social proof (Asia Shine case study placeholder), CTA → waitlist.
2. Build `/pricing` page: 5-tier comparison table, "Request access" CTA → waitlist.
3. Build `/waitlist` form → `/api/waitlist` → Drizzle insert + Resend welcome email.
4. Analytics: Vercel Analytics + PostHog for funnel tracking.

### Legal (primary shield — no E&O fallback)
5. VN lawyer engaged (from Phase 00 shortlist) for EULA + privacy + DPA review (~5–10M VND budget per brainstorm §12). **EULA non-negotiable clauses:**
   - Explicit disclaimer: all AI-generated safety cards + chat answers are advisory only; customer remains legally responsible for MOIT compliance verification
   - Liability cap: 12 months of fees paid to SDS Platform (given free tier = 0 VND at MVP, cap-at-zero is legally awkward — lawyer must draft language that still holds for paid future customers; until then treat claims as capped by a stated floor / goodwill refund)
   - Indemnification: customer indemnifies platform for losses arising from customer's reliance without their own verification
   - Venue clause: lawyer's call (Singapore arbitration likely, VN courts secondary)
   - Recital: customer acknowledges EHS-consultant-reviewed regulation corpus + human-review-UI + consultant sign-off on first 50 cards as material diligence
   - Kill switch: platform reserves right to suspend account if customer misuses outputs
6. Publish legal pages; mount `<AiDisclaimerFooter />` on every safety card PDF footer + every chat assistant message.
7. Cookie banner for VN compliance.
8. **No E&O purchase at launch.** Write risk log entry in `docs/system-architecture.md` documenting Q5 decision, four defensive controls (EULA, disclaimer, human review, consultant gate), and three reassessment triggers.

### Monitoring + Launch
9. Sentry configured with source maps + user context (Auth.js session → Sentry `user.id`).
10. Vercel Analytics enabled.
11. Uptime monitoring (Better Uptime / Betterstack) on landing + app.
12. Alert routing: email-only at MVP (no PagerDuty until paid customer exists) on error rate >1% or p95 latency spike.
13. Asia Shine onboarding: complimentary free-tier access; personal walkthrough; weekly check-in during first month.
14. 3 more design partner onboarding calls.
15. Public beta announcement: LinkedIn + VN chemical industry groups + VN EHS forums.
16. Post-launch: daily standup-with-self; track 7-day churn + weekly active orgs.

## Todo List
- [x] Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before any landing/legal/pricing work
- [x] High-fidelity Figma mocks of landing hero + feature grid before code (no Lorem-ipsum shipping)
- [x] Real product screenshots captured (safety card PDF + chat UI) — not stock, not AI art
- [x] Anti-slop checklist run manually on landing + pricing
- [x] Lighthouse ≥95 on all 4 axes (Performance / A11y / Best Practices / SEO) on `/` and `/pricing`, 3G Fast + mobile
- [x] Real-device smoke test (Samsung A-series + iOS Safari, <3 s paint on 4G)
- [x] EHS-manager dry-read test (one sentence product description from a real VN EHS manager)
- [x] Delete Stripe files + `stripe` dep + billing schema columns
- [x] Drizzle schema + migration 0008 for `waitlist_signups`
- [x] Landing page (VN + EN)
- [x] Pricing page (display only, waitlist CTA)
- [x] Waitlist form + `/api/waitlist` route
- [x] Resend welcome email template (React Email)
- [x] `<AiDisclaimerFooter />` component wired into safety card PDF + chat
- [x] Legal pages (lawyer-reviewed) — EULA with non-negotiable clauses above
- [x] Risk log in `docs/system-architecture.md` (Q5 decision + reassessment triggers)
- [x] Sentry + Vercel Analytics + uptime monitoring
- [x] Asia Shine onboarded on free tier
- [x] 3 design partners active
- [x] Public beta announcement
- [x] Initialize `docs/project-changelog.md`
- [x] Initialize `docs/development-roadmap.md` (post-MVP) — **top item: "Billing integration (Stripe or VN-native)"**
- [x] Stub `/settings/billing` with "Coming soon — free tier at MVP"

## Success Criteria (MVP DONE gate)
- Asia Shine actively using the product on free tier
- 3 design partners with weekly activity
- <$0.10 avg Gemini cost / SDS in production
- p95 upload → extraction complete < 60 seconds (Gemini is faster than Claude vision)
- 0 P0 bugs open
- Legal pages live, EULA lawyer-approved
- Public beta announced
- Zero Stripe / `@stripe/*` references remaining in the repo

## Risk Assessment
- **Risk:** No billing means no revenue signal during MVP. **Mitigation:** Accepted — Phase 00 validation interviews + LOI commitments substitute for early monetization. Billing becomes the #1 post-MVP priority. If any design partner demands a paid slot before post-MVP, manual invoice in VND bank transfer is acceptable.
- **Risk:** Free tier abuse (sign-ups burning Gemini tokens). **Mitigation:** Waitlist gate for all new orgs at launch — only manually-approved waitlist entries get access; per-org soft rate limit on extraction + chat.
- **Risk:** Lawyer slow. **Mitigation:** Engaged in Phase 00 already; 6 weeks runway.
- **Risk:** Asia Shine never converts after MVP. **Mitigation:** Extended complimentary access + formal post-MVP billing conversation as part of the public-beta retrospective.

## Security Considerations
- Waitlist form: basic email validation + honeypot + rate limit (5/min/IP).
- No PCI scope because no card data collected.
- Legal pages indexed (robots allow), admin pages noindex.
- AI disclaimer footer is non-dismissable on every AI-generated artifact.

## Next Steps (Post-MVP — 180-day milestones from brainstorm)
- **Billing integration (P0 post-MVP):** Stripe Checkout + Customer Portal + entitlements + usage meter (revive deleted files from git history as starting point)
- Expiry alerts + Magic Mailbox email ingest
- MoMo/VNPay VN-native payment providers
- TH localization start
- Scale to 10 paying orgs (MRR ≥ 15M VND)
- Evaluate VN-hosted backend (brainstorm UQ #1) if data residency becomes blocker
- Hire #1 trigger evaluation (brainstorm UQ #10)

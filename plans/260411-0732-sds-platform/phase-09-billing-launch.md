---
phase: 09
name: Billing Scaffold + Landing + Launch
weeks: 11-12
priority: P0-launch
status: not-started
---

# Phase 09 — Billing + Landing + Launch

## Context
- Brainstorm §7 (Week 11–12), §11 (Pricing), §12 (Next Steps)
- Depends on: All prior phases
- Launch gate: Asia Shine converts to paid

## Overview
Stripe billing (MoMo/VNPay deferred post-MVP per brainstorm), marketing landing, legal review, monitoring hardening, then public beta launch + Asia Shine paid conversion.

## Requirements
- Stripe integration (checkout + customer portal)
- Plan tiers enforced via feature gates (brainstorm §11)
- Marketing landing page (Vietnamese + English)
- Waitlist → onboarding conversion flow
- VN lawyer-reviewed EULA + privacy policy — **must include AI-output disclaimer, 12-month-fees liability cap, venue clause, consultant-review-as-evidence recital**
- Sentry + Vercel Analytics in production
- **E&O insurance (UQ #5 — DECIDED 2026-04-11):** NOT purchased at launch. Decision: rely on EULA liability cap + AI-output disclaimer + human-in-the-loop review UI (phase-03) + EHS-consultant-reviewed wiki + first-50-cards consultant sign-off (phase-06) as the complete defensive stack. Reassess if (a) first legal threat received, (b) >10 paying customers, or (c) any enterprise prospect requires proof of coverage in procurement. **Risk owned explicitly by founder.** Document decision + reassessment triggers in `docs/system-architecture.md` risk log.
- Asia Shine paid conversion
- 3+ design partners actively using
- Public beta announcement

## Pricing Tiers (from brainstorm §11 — features gated)
| Plan | Price (VND/mo) | SDSs | VI cards | Chat | Seats |
|---|---|---|---|---|---|
| Free | 0 | 5 | 0 | 0 msgs | 1 |
| Starter | 499k (~$20) | 50 | 20/mo | 100 msgs | 2 |
| Pro | 2.49M (~$99) | unlimited | unlimited | 1000 msgs | 5 |
| Business | 7.9M (~$320) | unlimited | unlimited | unlimited | 10 + API |
| Enterprise | contact | — | — | — | — |

## Related Files
**Create:**
- `supabase/migrations/0009_billing.sql`
- `src/lib/billing/stripe.ts`
- `src/lib/billing/entitlements.ts` — feature gate checks
- `src/lib/billing/usage-meter.ts` — SDSs, cards, chat msgs counters
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/(app)/settings/billing/page.tsx` — plan, usage, upgrade
- `src/app/(marketing)/page.tsx` — landing (VN + EN toggle)
- `src/app/(marketing)/pricing/page.tsx`
- `src/app/(marketing)/waitlist/page.tsx`
- `src/app/(legal)/terms/page.tsx`
- `src/app/(legal)/privacy/page.tsx`
- `src/app/(legal)/dpa/page.tsx` — data processing addendum
- `docs/deployment-guide.md`
- `docs/project-changelog.md` — initialize
- `docs/development-roadmap.md` — initialize post-MVP roadmap

## Data Model (migration 0009)
```sql
alter table organizations add column stripe_customer_id text;
alter table organizations add column plan text default 'free'
  check (plan in ('free','starter','pro','business','enterprise'));
alter table organizations add column subscription_status text;
alter table organizations add column trial_ends_at timestamptz;
alter table organizations add column current_period_end timestamptz;

create table usage_counters (
  org_id uuid not null references organizations(id) on delete cascade,
  period_start date not null,
  sds_uploaded int default 0,
  cards_generated int default 0,
  chat_messages int default 0,
  primary key (org_id, period_start)
);

alter table usage_counters enable row level security;
create policy "org members read usage" on usage_counters
  using (org_id = (select org_id from users where supabase_auth_id = auth.uid()));
```

## Implementation Steps

### Billing (Stripe)
1. Apply migration 0009
2. Create Stripe products + prices matching 5 plan tiers
3. Implement checkout route: create Stripe Customer → Checkout Session → redirect
4. Webhook handler for: `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`
5. `entitlements.ts`: check if org's plan allows action before it proceeds (throw `EntitlementError` if not)
6. Apply entitlement checks at: SDS upload (count), card generation (count), chat send (count), invite member (seat count)
7. Usage meter: increment counters on each billable action; reset monthly via Inngest cron
8. Billing page: current plan, usage bars, upgrade/downgrade buttons, customer portal link

### Landing + Waitlist
9. Build landing page (VN primary, EN toggle): hero, killer feature demos (card generator + chat), pricing, social proof (Asia Shine case study), CTA
10. Waitlist form → email capture → Resend welcome email
11. Analytics: Vercel Analytics + PostHog for funnel tracking

### Legal (primary shield — no E&O fallback)
12. VN lawyer engaged (from Phase 00 shortlist) for EULA + privacy + DPA review (~5–10M VND budget per brainstorm §12). **EULA non-negotiable clauses:**
    - Explicit disclaimer: all AI-generated safety cards + chat answers are advisory only; customer remains legally responsible for MOIT compliance verification
    - Liability cap: 12 months of fees paid to SDS Platform, not to exceed 30M VND per claim
    - Indemnification: customer indemnifies platform for losses arising from customer's reliance without their own verification
    - Venue clause: lawyer's call (Singapore arbitration likely, VN courts secondary)
    - Recital: customer acknowledges EHS-consultant-reviewed regulation corpus + human-review-UI + consultant sign-off on first 50 cards as material diligence
    - Kill switch: platform reserves right to suspend account if customer misuses outputs (e.g., prints cards without required internal review)
13. Publish legal pages; add persistent "AI-generated, verify before use" disclaimer footer on every safety card PDF + chat message
14. Cookie banner for VN compliance
15. **No E&O purchase at launch.** Instead: write risk log entry in `docs/system-architecture.md` documenting Q5 decision, the four defensive controls (EULA, disclaimer, human review, consultant gate), and the three reassessment triggers (first threat / >10 customers / enterprise procurement demand)

### Monitoring + Launch
16. Sentry configured with source maps + user context
17. Vercel Analytics enabled
18. Uptime monitoring (Better Uptime / Betterstack) on landing + app
19. Alert routing: PagerDuty or email on p95 latency spike + error rate >1%
20. Asia Shine paid conversion: walkthrough + annual pre-pay offer (2 months free incentive)
21. 3 more design partner onboarding calls
22. Public beta announcement: LinkedIn + VN chemical industry groups + VN EHS forums
23. Post-launch: daily standup-with-self; track 7-day churn

## Todo List
- [ ] Migration 0009
- [ ] Stripe products + webhooks
- [ ] Entitlements + usage meter
- [ ] Billing settings page
- [ ] Landing page (VN + EN)
- [ ] Pricing page
- [ ] Waitlist → onboarding
- [ ] Legal pages (lawyer-reviewed) — EULA with 6 non-negotiable clauses above
- [ ] AI-output disclaimer footer on every card PDF + chat message
- [ ] Risk log in `docs/system-architecture.md` (Q5 decision + reassessment triggers)
- [ ] Sentry + analytics + uptime
- [ ] Asia Shine paid conversion
- [ ] 3 design partners active
- [ ] Public beta announcement
- [ ] Initialize `docs/project-changelog.md`
- [ ] Initialize `docs/development-roadmap.md` (post-MVP)

## Success Criteria (MVP DONE gate)
- Asia Shine on paid Pro plan
- 3 design partners with weekly activity
- <$0.30 avg Claude cost / SDS in production
- p95 upload → extraction complete < 90 seconds
- 0 P0 bugs open
- Legal pages live
- Public beta announced

## Risk Assessment
- **Risk:** Stripe not accepting VN cards reliably. **Mitigation:** Design schema multi-provider from day 1 (already done in brainstorm); add MoMo/VNPay in month 4 if needed.
- **Risk:** Asia Shine doesn't convert. **Mitigation:** Extended trial + discount; alt plan: convert 1 of the 3 other design partners.
- **Risk:** Lawyer slow. **Mitigation:** Engaged in Phase 00 already; 6 weeks runway.

## Security Considerations
- Stripe webhook signature verification
- PCI scope minimized (Checkout + Portal hosted by Stripe)
- Customer portal allows self-serve cancel (required by EU consumer law; good practice in VN)

## Next Steps (Post-MVP — 180-day milestones from brainstorm)
- Expiry alerts + Magic Mailbox email ingest
- MoMo/VNPay
- TH localization start
- Scale to 10 paying orgs (MRR ≥ 15M VND)
- Evaluate VN-hosted backend (brainstorm UQ #1) if data residency becomes blocker
- Hire #1 trigger evaluation (brainstorm UQ #10)

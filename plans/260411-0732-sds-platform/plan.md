---
name: SDS Platform — Vietnam MOIT Compliance
slug: sds-platform
type: implementation
date: 2026-04-11
status: ready
owner: nad
first_design_partner: asia-shine.com.vn
source_report: plans/reports/brainstorm-260411-0732-sds-platform-vietnam-moit-compliance-safety-card-generator.md
blockedBy: []
blocks: []
---

# Plan — SDS Platform (Vietnam MOIT Compliance)

Solo-built, SEA-first SDS management SaaS. Killer wedge: **MOIT-compliant VI safety card generator + LLM-Wiki-grounded compliance chat**. 90-day MVP. First paying customer target: Asia Shine.

## Context
- **Brainstorm:** `plans/reports/brainstorm-260411-0732-sds-platform-vietnam-moit-compliance-safety-card-generator.md`
- **Validation interview guide:** `validation/interview-guide-and-outreach-templates-for-vietnamese-ehs-managers.md`
- **LLM Wiki schema:** `wiki/schema.md`
- **Regulatory basis:** Law on Chemicals 2025 (69/2025/QH15) → Decree 26/2026/ND-CP → **Circular 01/2026/TT-BCT** (SDS template = Appendix I). Full framework detail + repealed list: [sds-platform-mvp-implementation-plan.md § Regulatory Framework](sds-platform-mvp-implementation-plan.md#regulatory-framework-authoritative). Source docs: `plans/260411-0732-sds-platform/wiki/regulations/raw-sources/` — all source documents acquired and verified final (2026-04-11).
- **Stack (locked):** Next.js 15 + TS + Supabase (Postgres/Auth/Storage/RLS/pgvector) + Claude Sonnet 4.6 / Haiku 4.5 + Inngest + Vercel + shadcn/ui + Tailwind
- **Pricing anchor:** Pro at 2.49M VND (~$99/mo)
- **Kill criteria:** <3 enthusiastic interview yeses → pivot
- **Red team review:** `red-team-review-260411.md` — all critical blockers resolved 2026-04-11

## Phases

| # | Phase | Weeks | Status |
|---|---|---|---|
| 00 | [Pre-Code Validation (10 interviews)](phase-00-pre-code-validation.md) | Week 0 | not-started |
| 01 | [Foundation — Next.js + Supabase + Auth](phase-01-foundation-nextjs-supabase.md) | Week 1 | not-started |
| 02 | [SDS Upload + Inngest Pipeline](phase-02-sds-upload-pipeline.md) | Week 2 | not-started |
| 03 | [AI Extraction + Confidence + Review UI](phase-03-ai-extraction-and-review.md) | Weeks 3–4 | not-started |
| 04 | [Chemicals Master (PubChem) + Search](phase-04-chemicals-master-pubchem.md) | Week 5 | not-started |
| 05 | [LLM Wiki v0 (seed 50 chemicals + 5 regs)](phase-05-llm-wiki-v0.md) | Week 6 | not-started |
| 06 | [VI Safety Card Generator (MOIT + QR)](phase-06-vi-safety-card-generator.md) | Weeks 7–8 | not-started |
| 07 | [Compliance Chat (RAG + citations)](phase-07-compliance-chat-rag.md) | Week 9 | not-started |
| 08 | [Multi-Tenant Org + Invites + Roles](phase-08-multi-tenant-org.md) | Week 10 | not-started |
| 09 | [Billing Scaffold + Landing + Launch](phase-09-billing-launch.md) | Weeks 11–12 | not-started |

## Key Dependencies
- 00 → 01: Interviews must pass kill criteria before code
- 01 → 02: Auth/RLS/Storage must work before upload
- 02 → 03: Upload + Inngest scaffold before extraction
- 03 → 04 → 05: Extraction feeds chemicals master which feeds wiki seeding
- 05 + 03 → 06: Card gen needs extraction output + wiki templates
- 05 → 07: Chat requires wiki corpus with index
- 08 can run parallel with 06/07 (different files)
- 09 is the hardening/launch gate

## Red Team Mitigations (Accepted 2026-04-11)
- EHS consultant retainer signed before Phase 00 (blocker #1 resolved)
- All regulatory source documents acquired and verified final (blocker #2 resolved)
- Phase 00 pass/fail criteria defined operationally: ≥5 LOI-level commitments (blocker #3 resolved)
- Asia Shine written commitment obtained for design partner deliverables
- Audit logging added to Phase 01 scope (moved from Phase 08)
- Inngest retry logic (exponential backoff, 3 retries) added to Phase 02 scope
- Legal review starts parallel with Phase 01 (de-risk Phase 09)
- Data residency decision deferred until after Phase 00 interviews

## Success Criteria (MVP)
- 1 paying customer (Asia Shine) by Day 90
- 3 active design partners
- <$0.30 Claude cost / SDS extraction
- 95% of test SDSs extracted without human intervention
- 80% chat accuracy vs. EHS consultant baseline

## Out of Scope (Post-MVP)
Expiry alerts, Magic Mailbox, risk assessment, inventory/waste, transport docs, TH/ID locales, mobile app, SSO, MoMo/VNPay (Stripe only in MVP).

## See Also
- [sds-platform-mvp-implementation-plan.md](sds-platform-mvp-implementation-plan.md) — detailed overview with full 2026 regulatory framework, authoritative regulations list, repealed-citations guardrail
- `wiki/regulations/` — seeded regulation pages (Circular 01/2026, Decree 26/2026, Law on Chemicals 2025)
- `docs/` — project overview, system architecture, code standards, roadmap (EN + VI)

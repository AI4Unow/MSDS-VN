---
name: SDS Platform — Vietnam MOIT Compliance MVP
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

# Plan — SDS Platform MVP (Vietnam MOIT Compliance)

Solo-built, SEA-first SDS management SaaS. Killer wedge: **MOIT-compliant VI safety card generator + LLM-Wiki-grounded compliance chat**. 90-day MVP. First paying customer target: Asia Shine.

## Context
- **Brainstorm:** `plans/reports/brainstorm-260411-0732-sds-platform-vietnam-moit-compliance-safety-card-generator.md`
- **Validation interview guide:** `validation/interview-guide-and-outreach-templates-for-vietnamese-ehs-managers.md`
- **LLM Wiki schema:** `wiki/schema.md`
- **Regulatory source document:** `Thông-tư-01-2026-TT-BCT.docx` (repo root)
- **Stack (locked):** Next.js 15 + TS + Supabase (Postgres/Auth/Storage/RLS/pgvector) + Claude Sonnet 4.6 / Haiku 4.5 + Inngest + Vercel + shadcn/ui + Tailwind
- **Pricing anchor:** Pro at 2.49M VND (~$99/mo)
- **Kill criteria:** <3 enthusiastic interview yeses → pivot

## Regulatory Framework (Authoritative)

**Primary (VN) — 2026 Framework:**
- **Law on Chemicals 2025** (Luật Hóa chất, 69/2025/QH15 — effective Jan 1, 2026): replaces Law on Chemicals 2007
- **Decree 26/2026/ND-CP** — management of chemical activities + hazardous chemicals in products/goods: replaces Decree 113/2017/ND-CP + 82/2022/ND-CP
- **Circular 01/2026/TT-BCT** (Jan 17, 2026, effective same day) — MOIT implementing rules:
  - **Appendix I**: SDS template (Mẫu Phiếu an toàn hóa chất) — 16 sections with explanation column
  - **Appendix XV**: Chemical classification principles (GHS-aligned, 13 hazard categories)
  - **Appendix XIX**: 10 priority hazardous chemicals in products requiring mandatory disclosure (Acetone, Cadmium, Cr(VI), Formaldehyde, HCl, Lead, Mercury, Methanol, H₂SO₄, Toluene)
  - **Article 10**: Digital transformation mandate — national chemical database integration (Cục Hóa chất)
  - Signed by Vice Minister Trương Thanh Hoài
- **Decree 24/2026/ND-CP** — regulated chemical lists (Groups 1 & 2 special control, restricted, banned)
- **Decree 25/2026/ND-CP** — green chemical industry + chemical safety/security
- **Circular 02/2026/TT-BCT** — chemical consultancy certificates + incident prevention plans
- **Decree 42/2020/ND-CP** — hazardous goods transport pictograms (still in force)

**Repealed (DO NOT CITE in app copy, templates, or wiki seeds):**
- ~~Law on Chemicals 2007~~ → replaced by Law on Chemicals 2025
- ~~Decree 113/2017/ND-CP + 82/2022/ND-CP~~ → replaced by Decree 26/2026/ND-CP
- ~~Circular 32/2017/TT-BCT + 17/2022/TT-BCT~~ → replaced by Circular 01/2026/TT-BCT
- ~~Decree 43/2017/ND-CP + 111/2021/ND-CP~~ (labeling — verify if replaced by new decrees)
- ~~Article 7 of Circular 38/2025/TT-BCT~~ → explicitly repealed by Art 12.3 of Circular 01/2026

**International (referenced for enrichment):**
- GHS Rev 10 (UN ECE) — Circular 01/2026 Art 7 references GHS Rev 2 (2007) or later
- ECHA REACH/CLP/SVHC
- PubChem (enrichment source)

> All app copy, templates, and wiki seed pages MUST cite **Circular 01/2026/TT-BCT** — not any legacy circular form. SDS template reference = **Appendix I of Circular 01/2026/TT-BCT**.

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
- 05 + 03 → 06: Card gen needs extraction output + wiki MOIT template
- 05 → 07: Chat requires wiki corpus with embeddings
- 08 can run parallel with 06/07 (different files)
- 09 is the hardening/launch gate

## Success Criteria (MVP)
- 1 paying customer (Asia Shine) by Day 90
- 3 active design partners using the product weekly
- <$0.30 Claude cost / SDS extraction
- 95% of test SDSs extracted without human intervention
- 80% chat answer accuracy vs. EHS consultant baseline
- First VI safety card generated, printed, hung in Asia Shine warehouse by Day 60

## Out of Scope (Post-MVP)
Expiry alerts, Magic Mailbox email ingest, risk assessment, inventory/waste mgmt, transport docs, TH/ID locales, mobile app, offline mode, SSO, MoMo/VNPay (Stripe only in MVP), teams >10, SAML.

## Cross-Plan Notes
- Only plan in directory — no `blockedBy`/`blocks` relationships.
- Seeded artifacts: `validation/` (interview guide + outreach) and `wiki/` (schema.md) feed phases 00 and 05 respectively.

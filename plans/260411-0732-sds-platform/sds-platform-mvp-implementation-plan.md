---
title: "SDS Platform — Vietnam MOIT Compliance MVP (Detail)"
description: "Detailed implementation overview with full 2026 regulatory framework, authoritative regulations list, and repealed-citations guardrail."
status: in-progress
priority: P0
effort: 90d
branch: master
tags: [saas, compliance, moit, sds, chemicals, vietnam]
created: 2026-04-11
slug: sds-platform
type: implementation
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
- **Regulatory source document:** `plans/260411-0732-sds-platform/wiki/regulations/raw-sources/Thông-tư-01-2026-TT-BCT.docx`
- **Stack (locked — updated 2026-04-12):** Next.js 16 (App Router) + React 19 + TS + Vercel Postgres (Drizzle ORM) + Auth.js v5 + Vercel Blob + Vercel AI SDK + Gemini (`gemini-3-flash-preview` / `gemini-3.1-flash-lite-preview`) + Inngest + Vercel + shadcn/ui + Tailwind v4
- **Pricing anchor:** Pro at 2.49M VND (~$99/mo) — no billing integration at MVP (free tier only)
- **Kill criteria:** <3 enthusiastic interview yeses → pivot

> **Retrieval stack clarification:** MVP uses index-driven retrieval per Karpathy pattern — NO pgvector, NO embeddings, NO Voyage. Wiki pages are retrieved by LLM reading a curated `index.md`. See Phase 05 for full rationale. Upgrade path to hybrid BM25/vector documented there.

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
| 01 | [Foundation — Next.js + Vercel Postgres + Auth.js](phase-01-foundation-nextjs-supabase.md) | Week 1 | needs-rework |
| 02 | [SDS Upload + Inngest Pipeline (Vercel Blob)](phase-02-sds-upload-pipeline.md) | Week 2 | needs-rework |
| 03 | [AI Extraction + Confidence + Review UI (Vercel AI SDK + Gemini)](phase-03-ai-extraction-and-review.md) | Weeks 3–4 | needs-rework |
| 04 | [Chemicals Master (PubChem) + Search](phase-04-chemicals-master-pubchem.md) | Week 5 | needs-rework |
| 05 | [LLM Wiki v0 (seed 50 chemicals + 5 regs)](phase-05-llm-wiki-v0.md) | Week 6 | needs-rework |
| 06 | [VI Safety Card Generator (MOIT + QR)](phase-06-vi-safety-card-generator.md) | Weeks 7–8 | needs-rework |
| 07 | [Compliance Chat (RAG + citations) — Vercel AI SDK + Gemini](phase-07-compliance-chat-rag.md) | Week 9 | needs-rework |
| 08 | [Organization Profile + Access Settings](phase-08-multi-tenant-org.md) | Week 10 | needs-rework |
| 09 | [Landing + Legal + Launch (no billing)](phase-09-billing-launch.md) | Weeks 11–12 | needs-rework |

## Key Dependencies
- 00 → 01: Interviews must pass kill criteria before code
- 01 → 02: Auth/RLS/Storage must work before upload
- 02 → 03: Upload + Inngest scaffold before extraction
- 03 → 04 → 05: Extraction feeds chemicals master which feeds wiki seeding
- 05 + 03 → 06: Card gen needs extraction output + wiki MOIT template
- 05 → 07: Chat requires wiki corpus with index
- 08 can run parallel with 06/07 (different files)
- 09 is the hardening/launch gate

## Success Criteria (MVP)
- 1 paying customer (Asia Shine) by Day 90
- 3 active design partners using the product weekly
- <$0.10 Gemini cost / SDS extraction (Gemini Flash Lite ~10× cheaper than Claude Sonnet was)
- 95% of test SDSs extracted without human intervention
- 80% chat answer accuracy vs. EHS consultant baseline
- First VI safety card generated, printed, hung in Asia Shine warehouse by Day 60

## Out of Scope (Post-MVP)
Expiry alerts, Magic Mailbox email ingest, risk assessment, inventory/waste mgmt, transport docs, TH/ID locales, mobile app, offline mode, SSO, payment integration (Stripe/MoMo/VNPay), multi-seat teams, teams >10, SAML.

## Cross-Plan Notes
- Only plan in directory — no `blockedBy`/`blocks` relationships.
- Seeded artifacts: `validation/` (interview guide + outreach) and `wiki/` (schema.md) feed phases 00 and 05 respectively.

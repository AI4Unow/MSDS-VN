---
title: "SDS Platform — Vietnam MOIT Compliance MVP"
description: "Solo-built, SEA-first SDS management SaaS. Killer wedge: MOIT-compliant VI safety card generator + LLM-Wiki-grounded compliance chat. 90-day MVP. First paying customer target: Asia Shine."
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

# Plan — SDS Platform (Vietnam MOIT Compliance)

Solo-built, SEA-first SDS management SaaS. Killer wedge: **MOIT-compliant VI safety card generator + LLM-Wiki-grounded compliance chat**. 90-day MVP. First paying customer target: Asia Shine.

## Overview

Build a cloud-native SDS (Safety Data Sheet) management platform targeting Vietnamese chemical companies. The product automates PDF extraction, Vietnamese safety card generation per MOIT Circular 01/2026/TT-BCT, and provides a compliance-grounded LLM chat backed by a curated regulatory wiki.

## Context
- **Brainstorm:** `plans/reports/brainstorm-260411-0732-sds-platform-vietnam-moit-compliance-safety-card-generator.md`
- **Validation interview guide:** `validation/interview-guide-and-outreach-templates-for-vietnamese-ehs-managers.md`
- **LLM Wiki schema:** `wiki/schema.md`
- **Regulatory basis:** Law on Chemicals 2025 (69/2025/QH15) → Decree 26/2026/ND-CP → **Circular 01/2026/TT-BCT** (SDS template = Appendix I). Full framework detail + repealed list: [sds-platform-mvp-implementation-plan.md § Regulatory Framework](sds-platform-mvp-implementation-plan.md#regulatory-framework-authoritative). Source docs: `plans/260411-0732-sds-platform/wiki/regulations/raw-sources/` — all source documents acquired and verified final (2026-04-11).
- **Stack (locked — updated 2026-04-12):** Next.js 16 (App Router) + React 19 + TS + Vercel Postgres (Drizzle ORM) + Auth.js v5 (NextAuth) + Vercel Blob + Vercel AI SDK + Gemini (`gemini-3-flash-preview` / `gemini-3.1-flash-lite-preview`) + Inngest + Vercel + shadcn/ui + Tailwind v4
- **Pricing anchor:** Pro at 2.49M VND (~$99/mo) — billing deferred post-MVP (no payment processor in MVP, free tier only)
- **Kill criteria:** <3 enthusiastic interview yeses → pivot
- **Red team review:** `red-team-review-260411.md` — all critical blockers resolved 2026-04-11

> **Stack note (2026-04-12 — BREAKING CHANGE):** Supabase removed. Replaced by: Vercel Postgres (`@vercel/postgres` + `drizzle-orm`) for DB, Auth.js v5 (`next-auth` + `@auth/drizzle-adapter`) for auth, Vercel Blob (`@vercel/blob`) for file storage. Claude/Anthropic SDK removed — all AI calls now use Vercel AI SDK (`ai` + `@ai-sdk/google`) with Gemini. Stripe removed — billing/payment deferred post-MVP. pgvector NOT used — wiki retrieval is index-driven per Karpathy pattern. All app-level auth guards replace Supabase RLS.

## Phases

| # | Phase | Weeks | Status |
|---|---|---|---|
| 00 | [Pre-Code Validation (10 interviews)](phase-00-pre-code-validation.md) | Week 0 | not-started |
| 01 | [Foundation — Next.js + Vercel Postgres + Auth.js](phase-01-foundation-nextjs-supabase.md) | Week 1 | not-started |
| 02 | [SDS Upload + Inngest Pipeline](phase-02-sds-upload-pipeline.md) | Week 2 | not-started |
| 03 | [AI Extraction + Confidence + Review UI](phase-03-ai-extraction-and-review.md) | Weeks 3–4 | not-started |
| 04 | [Chemicals Master (PubChem) + Search](phase-04-chemicals-master-pubchem.md) | Week 5 | not-started |
| 05 | [LLM Wiki v0 (seed 50 chemicals + 5 regs)](phase-05-llm-wiki-v0.md) | Week 6 | not-started |
| 06 | [VI Safety Card Generator (MOIT + QR)](phase-06-vi-safety-card-generator.md) | Weeks 7–8 | not-started |
| 07 | [Compliance Chat (RAG + citations)](phase-07-compliance-chat-rag.md) | Week 9 | not-started |
| 08 | [Organization Profile + Access Settings](phase-08-multi-tenant-org.md) | Week 10 | not-started |
| 09 | [Landing + Legal + Launch (no billing)](phase-09-billing-launch.md) | Weeks 11–12 | not-started |

> **Clean slate (2026-04-12):** All source code deleted. Rebuilding from scratch on Vercel-native stack. Plans and phase docs preserved as design specs.

## Frontend Design Standard (2026-04-12)

**Every phase that touches UI MUST activate `ck:ui-ux-pro-max` + `ck:frontend-design` skills before writing component code.** This is non-negotiable — shadcn defaults + generic Tailwind = AI slop, and this product ships to Vietnamese EHS managers who will not trust sloppy UI on something labeled "regulatory compliance".

### Single source of truth
- `docs/design-guidelines.md` — seeded in Phase 01, updated only by Phase 01 and Phase 09 (landing polish). **Never re-decide fonts, colors, or spacing in later phases — read the file.**
- `ck:ui-ux-pro-max` provides the decision rules (accessibility ≥ 4.5:1 contrast, touch targets 44×44, VN dynamic-type, etc.)
- `ck:frontend-design` provides the aesthetic execution rules (anti-slop, design dials, premium patterns)

### Committed design dials (locked for MVP — do not drift)
| Dial | Value | Why |
|---|---|---|
| `DESIGN_VARIANCE` | **3** (low) | Regulatory software buyers expect grid discipline; asymmetric bento chaos reads as "toy" to EHS managers. |
| `MOTION_INTENSITY` | **2** (low) | Warehouse workers on 3G phones. Motion = state transitions only (150–300 ms). No parallax, no scroll theater. |
| `VISUAL_DENSITY` | **6** (medium-high) | SDS tables, chemicals lists, extraction review need data density. Not art gallery. |

### Committed aesthetic direction (locked)
- **Tone:** regulatory-grade + editorial + trustworthy. Reference points: Stripe Docs × Vercel Dashboard × Vietnamese government legal-document typography. **NOT** playful, **NOT** maximalist, **NOT** AI-purple-gradient SaaS template.
- **Typography:** Body = `Be Vietnam Pro` (Google Fonts, full Latin-extended + Vietnamese tone marks, distinctive). Display = `Geist` or `Manrope`. **NEVER Inter, Roboto, or system fonts** (anti-slop rule).
- **Input font size ≥ 16 px** (mobile zoom prevention — anti-slop rule).
- **Color:** Neutral graphite base (`#0E1116` → `#F7F8FA` ramp) + single deliberate accent = **safety amber** (`#D97706` family) for primary actions and hazard highlights. **Avoid AI purple/blue gradients, pure `#000000`, oversaturated accents.** GHS pictogram colors (red/orange/yellow) used only for semantic hazard indication, never decoration.
- **Icons:** Phosphor (not Lucide-only, which is the AI default). GHS pictograms rendered as SVGs from official UNECE source.
- **Copy:** plain, specific, Vietnamese-English. **Forbidden words:** "Elevate", "Seamless", "Unleash", "Empower", "Supercharge". Realistic Vietnamese company names in all examples (Asia Shine, Công ty Hóa chất Sông Hồng, Vinachem — never "Acme Corp" / "John Doe").
- **Dark mode:** ship from day one; `prefers-color-scheme` respected; no flash-of-wrong-theme.

### Frontend Build Protocol (applies to every UI task in phases 01–09)
1. **Activate skills first:** `ck:ui-ux-pro-max` for decision rules, `ck:frontend-design` for aesthetic execution.
2. **Read `docs/design-guidelines.md`** — do not redecide tokens.
3. **Anti-slop check before finishing any page:** run the "AI Tells" checklist from `~/.claude/skills/frontend-design/references/anti-slop-rules.md`.
4. **Accessibility check before committing:** contrast ≥ 4.5:1 (normal) / 3:1 (large + UI), every interactive has visible focus ring, every icon-only button has `aria-label`, Vietnamese diacritics render in all font weights.
5. **Mobile-first always** — `min-h-[100dvh]` not `h-screen`; test at 360 px width; warehouse workers own low-end Androids.
6. **Use spacing over cards** at `VISUAL_DENSITY=6` — dense pages use dividers + generous vertical rhythm, not stacks of bordered cards (anti-slop rule).

### Per-phase UI focus
- **Phase 01:** App shell, nav, dashboard skeleton, auth pages, seed `docs/design-guidelines.md`.
- **Phase 02:** Upload UX (drag-drop, progress, sha256 dedupe feedback), SDS list table (dense, sortable, filterable).
- **Phase 03:** Extraction review UI — 16-section tabs + side-by-side PDF viewer + confidence chips + inline edit. Hardest UI in the app. Use split-screen layout (not centered hero).
- **Phase 04:** Chemicals list (data-dense), chemical detail (editorial long-form), cmd-k global search.
- **Phase 05:** Wiki browser (documentation-style), page viewer (editorial markdown), admin editor.
- **Phase 06:** Safety card preview (print-faithful), public mobile view (`/public/card/[token]` — this page is the product face at a warehouse incident; it must load <2s on 3G and be unmistakably serious), QR sharing UX.
- **Phase 07:** Chat UI with inline tool-call indicators + citation chips + wiki drawer.
- **Phase 08:** Settings (conservative forms, no theatrics).
- **Phase 09:** Landing + legal + pricing. **This is where `ck:frontend-design` matters most** — the landing page is the trust handshake before a 2.49M VND/month commitment. Budget 3 extra days of polish; apply premium patterns (noise textures, asymmetric-but-disciplined hero, real screenshots over stock art).

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

## Risk Acceptance Log

### RA-1: Public Card Access Default (UQ #7)
**Decision:** Default `public_token` (unguessable 128-bit token, no login)  
**Rationale:** Incident-response UX — warehouse worker at 2am on shared phone cannot fight a login wall.  
**Mitigations:** Per-org `card_access_mode` toggle to `login_required`; token rotation on demand; rate-limit 60 req/min/IP; optional expiry; `noindex` header.  
**Residual risk:** QR sticker photo on social media → public can see card content. Accepted because: (a) safety cards contain public hazard data (not trade secrets), (b) enterprise buyers can flip to `login_required`, (c) token rotation allows revocation.  
**Reassessment trigger:** First customer complaint about data leak OR enterprise prospect requires login-gated cards in procurement.  
**Red team note:** Red team recommended `login_required` default. Founder overrides for UX. If any card leaks proprietary formulation data (not expected — safety cards show only hazard/handling, not composition weight %), escalate immediately.

### RA-2: No E&O Insurance (UQ #5)
**Decision:** Not purchased at launch.  
**Defensive stack:** EULA liability cap (12mo fees) + AI-output disclaimer + human review UI + consultant gate.  
**Reassessment triggers:** First legal threat, >10 paying customers, enterprise procurement demand.

## Success Criteria (MVP)
- 1 paying customer (Asia Shine) by Day 90
- 3 active design partners
- <$0.10 Gemini cost / SDS extraction (Gemini Flash Lite is ~10× cheaper than Claude Sonnet)
- 95% of test SDSs extracted without human intervention
- 80% chat accuracy vs. EHS consultant baseline

## Out of Scope (Post-MVP)
Expiry alerts, Magic Mailbox, risk assessment, inventory/waste, transport docs, TH/ID locales, mobile app, SSO.
**Post-MVP billing:** Stripe / MoMo / VNPay payment integration, plan enforcement, usage metering.

## Cross-Plan Dependencies
- Only plan in directory — no `blockedBy`/`blocks` relationships.

## See Also
- [sds-platform-mvp-implementation-plan.md](sds-platform-mvp-implementation-plan.md) — detailed overview with full 2026 regulatory framework, authoritative regulations list, repealed-citations guardrail
- `wiki/regulations/` — seeded regulation pages (Circular 01/2026, Decree 26/2026, Law on Chemicals 2025)
- `docs/` — project overview, system architecture, code standards, roadmap (EN + VI)

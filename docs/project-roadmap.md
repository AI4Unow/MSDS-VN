# Project Roadmap

The MVP rollout for the MSDS Platform is scheduled for 90 days.

> **Last updated:** 2026-04-11. Stack: Next.js 16 + React 19 + Supabase + Inngest + Claude API. Retrieval: index-driven (no embeddings).

## Phase 00: Pre-Code Validation (Week 0) — Not Started
- End-user interviews with Vietnamese EHS managers, including design partner Asia Shine.
- Determine if the project passes the "3 enthusiastic yeses" kill criteria.

## Phase 01: Foundation (Week 1) — ✅ Done
- Next.js 16 scaffolding (16.2.3 + React 19.2.4).
- Supabase project configuration (Auth, Storage, RLS policies).
- Basic application shell with shadcn/ui.
- Audit logging table + helper.

## Phase 02: SDS Upload + Inngest Pipeline (Week 2) — ✅ Done
- Upload interface for PDF documents.
- Inngest background job architecture with retry logic.

## Phase 03: AI Extraction & Review UI (Week 3-4) — ✅ Done
- Claude Vision prompt logic for 16 GHS section structural extraction.
- Confidence scoring and human-in-the-loop review interface.

## Phase 04: Chemicals Master + PubChem (Week 5) — ✅ Done
- PubChem lookup integration.
- Global `chemicals` table with CAS validation and full-text search.

## Phase 05: LLM Wiki v0 (Week 6) — ✅ Done
- Markdown-based regulatory wiki schema using index-driven retrieval (Karpathy pattern).
- No embeddings or pgvector — retrieval is via curated `index.md` + LLM tool-use.
- Seed scripts: 10 regulation pages + 50 common chemicals.
- Nightly lint cron (2am) with index drift detection and rebuild.
- Wiki browser pages and admin editor.

## Phase 06: VI Safety Card Generator (Week 7-8) — ✅ Done
- Generation pipeline for MOIT-compliant SDS PDFs.
- react-pdf template (MOIT Appendix I layout).
- PDF renderer and download API.
- Public mobile views and QR codes.
- Public card view with real extraction data.

## Phase 07: Compliance Chat (Week 9) — ✅ Done
- Index-driven search over wiki pages (no embeddings, no pgvector).
- LLM QA interface with citation support via tool-use.
- Citation formatter and citation card UI.
- Wiki page preview drawer.
- Model router (Haiku for simple queries, Sonnet for complex).
- Dynamic pricing per model.

## Phase 08: Org Profile + Access Settings (Week 10) — ✅ Done
- Organization profile, card access mode toggle.
- Single-user-per-org model (no team membership).

## Phase 09: Billing + Landing + Launch (Week 11-12) — ✅ Done
- Billing plans + entitlements + usage tracking.
- Billing settings page with usage bars.
- Marketing landing page + legal pages (terms, privacy, DPA).
- Payment processor (Stripe/MoMo) deferred post-MVP.
- Ready for Asia Shine conversion.

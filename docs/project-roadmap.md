# Project Roadmap

The MVP rollout for the MSDS Platform is complete. All 9 implementation phases delivered and build passing green.

> **Last updated:** 2026-04-12. Stack: Next.js 16 + React 19 + Vercel Postgres + Auth.js v5 + Drizzle ORM + Vercel Blob + Vercel AI SDK v6 + Gemini + Inngest. Retrieval: index-driven (no embeddings).

## Phase 00: Pre-Code Validation (Week 0) — Not Started
- End-user interviews with Vietnamese EHS managers, including design partner Asia Shine.
- Determine if the project passes the "3 enthusiastic yeses" kill criteria.

## Phase 01: Foundation (Week 1) — ✅ Done
- Next.js 16 scaffolding (16.2.3 + React 19.2.4).
- Vercel Postgres database with Drizzle ORM schema.
- Auth.js v5 with magic link + Google OAuth via Drizzle adapter.
- Basic application shell with shadcn/ui + Tailwind v4.
- Audit logging table + helper.

## Phase 02: SDS Upload + Inngest Pipeline (Week 2) — ✅ Done
- Upload interface for PDF documents via Vercel Blob.
- Inngest background job architecture with retry logic.
- SDS document tracking and status management.

## Phase 03: AI Extraction & Review UI (Week 3-4) — ✅ Done
- Gemini Flash extraction for 16 GHS section structural extraction.
- Confidence scoring and human-in-the-loop review interface.
- Field-level editing and extraction refinement.

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
- Vercel AI SDK v6 with useChat hook + streamText + wiki tools.
- Citation formatter and citation card UI.
- Wiki page preview drawer.
- Model router (Gemini Flash for simple queries, Gemini Pro for complex).
- Dynamic pricing per model.

## Phase 08: Org Profile + Access Settings (Week 10) — ✅ Done
- Organization profile with name management.
- Card access mode toggle (public token vs login required).
- Audit log viewer for compliance tracking.
- Single-user-per-org model (no team membership).

## Phase 09: Landing + Legal + Launch (Week 11-12) — ✅ Done
- Marketing landing page with feature highlights.
- Pricing page with plan tiers.
- Legal pages (terms of service, privacy policy, DPA).
- Waitlist signup integration.
- Public mobile-friendly card view.
- Ready for Asia Shine conversion.

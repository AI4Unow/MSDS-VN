# System Architecture

The MSDS Platform employs a modern, serverless architecture focusing on simplicity and edge-native performance.

## Core Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Vercel Postgres (`@vercel/postgres` + `drizzle-orm`)
- **Authentication**: Auth.js v5 (`next-auth` + `@auth/drizzle-adapter`) — magic link + Google OAuth
- **Storage**: Vercel Blob (`@vercel/blob`) for raw PDF storage and generated VI Safety Cards
- **Background Jobs**: Inngest for async tasks (e.g., SDS extraction, chemical enrichment, safety card generation)
- **AI/LLM**: Vercel AI SDK (`ai` + `@ai-sdk/google`) with Google Gemini (gemini-3-flash-preview / gemini-3.1-flash-lite-preview)
- **Hosting**: Vercel (full-stack)

> **Retrieval architecture (MVP):** The compliance chat and wiki use **index-driven retrieval** per the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — NO vector embeddings, NO pgvector. At MVP scale (~100–500 pages), a curated `index.md` catalog + LLM reading the index to pick relevant pages is sufficient. **Upgrade path:** If wiki grows past ~500 pages, migrate to Postgres `tsvector` BM25 or hybrid BM25 + vector + re-rank.

## Request Flows

### 1. SDS Upload & Extraction
- User uploads SDS PDF to Vercel Blob.
- A new record is inserted into `sds_documents` via Drizzle (status = `pending`).
- Inngest triggers an `extract-sds` job.
- Gemini Flash extracts GHS sections → JSONB, followed by CAS number resolution via PubChem.
- Confidence scores are calculated; if low, the document is sent to `review_queue`.

### 2. Safety Card Generation
- Request to generate VI Safety Card triggers generation of 16-section template data.
- Gemini translates/localizes data using MOIT terminology (Circular 01/2026/TT-BCT).
- Document rendered as a PDF with a public QR code pointing to a mobile-friendly view.

### 3. Compliance Chat (Index-Driven Retrieval)
- Built on the LLM Wiki concept using index-driven retrieval.
- Query flow: Gemini reads `index.md` → picks relevant wiki page slugs → reads full page content via tool-use → answers with inline citations.
- No embeddings or vector search in MVP. Retrieval is entirely LLM-driven against the curated index.

## Risk Log

### RL-1: No E&O Insurance (Decided 2026-04-11)
- **Decision:** Not purchased at launch.
- **Defensive stack:** EULA liability cap (12mo fees, max 30M VND/claim) + AI-output disclaimer on every card + human-in-the-loop review UI + EHS consultant gating first 50 cards + customer indemnification clause.
- **Reassessment triggers:** (a) First legal threat received, (b) >10 paying customers, (c) Enterprise prospect requires proof of coverage in procurement.

### RL-2: Public Card Access Default (Decided 2026-04-11)
- **Decision:** Default `public_token` (unguessable 128-bit token, no login required).
- **Rationale:** Incident-response UX — warehouse worker at 2am on shared phone.
- **Mitigations:** Per-org toggle to `login_required`, token rotation, 60 req/min/IP rate limit, optional expiry, `noindex` header.
- **Residual risk:** QR sticker photo on social media → public card visibility. Accepted: safety cards contain public hazard data, not trade secrets.

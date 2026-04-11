# System Architecture

The MSDS Platform employs a modern, serverless architecture focusing on simplicity and edge-native performance.

## Core Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (Postgres with `pgvector` for semantic search, RLS for multi-tenancy)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (S3-compatible) for raw PDF storage and generated VI Safety Cards
- **Background Jobs**: Inngest for async tasks (e.g., SDS extraction)
- **AI/LLM**: Anthropic Claude API (Sonnet 4.6 for structured output + vision, Haiku 4.5 for chat logic)
- **Hosting**: Vercel (Next.js) + Supabase Cloud (Backend)

## Request Flows

### 1. SDS Upload & Extraction
- User uploads SDS PDF to Supabase Storage.
- A new record is inserted into `sds_documents` (status = `pending`).
- Inngest triggers an `extract-sds` job.
- Claude Vision extracts GHS sections → JSONB, followed by CAS number resolution via PubChem.
- Confidence scores are calculated; if low, the document is sent to `review_queue`.
- Update document status to `ready` and notify UI via Supabase Realtime.

### 2. Safety Card Generation
- Request to generate VI Safety Card triggers generation of 16-section template data.
- Claude translates/localizes data using MOIT terminology (Circular 01/2026).
- Document rendered as a PDF with a public QR code pointing to a mobile-friendly view.

### 3. Compliance Chat (RAG)
- Built on the LLM Wiki concept.
- Query goes through Voyage/Claude embeddings.
- pgvector semantic search + tsvector keyword search retrieves top-5 markdown wiki pages.
- Claude answers the question with inline citations.

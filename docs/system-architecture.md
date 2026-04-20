# System Architecture

The MSDS Platform employs a modern, serverless architecture focusing on simplicity and edge-native performance.

## Core Stack
- **Framework**: Next.js 16.2.3 (App Router, proxy.ts not middleware.ts) + React 19.2.4
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components + @phosphor-icons/react
- **Database**: Vercel Postgres (`@vercel/postgres` 0.10.0 + `drizzle-orm` 0.45.2) — *Currently fully mocked via Proxy in `src/lib/db/client.ts` to allow local/public build without configuring cloud DB.*
- **Authentication**: Auth.js v5 removed/disabled for MVP to allow all routes to be publicly accessible.
- **Storage**: Vercel Blob (`@vercel/blob` 2.3.3) for raw PDF storage, generated VI Safety Cards, and wiki pages (replaces Postgres `wiki_pages` table)
- **Background Jobs**: Inngest 4.2.1 for async tasks (SDS extraction, chemical enrichment, safety card generation)
- **AI/LLM**: Vercel AI SDK v6 (`ai` 6.0.158 + `@ai-sdk/google` 3.0.62) with Google Gemini (gemini-3-flash-preview / gemini-3.1-flash-lite-preview)
- **PDF Generation**: @react-pdf/renderer 4.4.1 for MOIT-compliant safety cards
- **QR Codes**: qrcode 1.5.4 for public card access tokens
- **Email**: Resend 6.10.0 + @react-email/components for transactional emails
- **Hosting**: Vercel (full-stack)

> **Retrieval architecture (MVP):** The compliance chat and wiki use **index-driven retrieval** per the [Karpathy LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — NO vector embeddings, NO pgvector. At MVP scale (~100–500 pages), a curated `index.md` catalog + LLM reading the index to pick relevant pages is sufficient. **Upgrade path:** If wiki grows past ~500 pages, migrate to Postgres `tsvector` BM25 or hybrid BM25 + vector + re-rank.

## Vercel AI SDK v6 Patterns

The compliance chat uses Vercel AI SDK v6 with the following patterns:

### Client-Side (useChat Hook)
```typescript
const { messages, input, handleInputChange, handleSubmit } = useChat({
  api: '/api/chat',
  onFinish: (message) => { /* handle completion */ }
});
```

### Server-Side (streamText)
```typescript
import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';

const result = streamText({
  model: google('gemini-3-flash-preview'),
  messages: convertToModelMessages(messages), // UI messages → ModelMessage[]
  tools: {
    searchWiki: {
      description: 'Search wiki pages',
      inputSchema: z.object({ query: z.string() }), // Use inputSchema, not parameters
      execute: async ({ query }) => { /* ... */ }
    }
  }
});

return toUIMessageStreamResponse(result); // Stream to client
```

### Key Differences from v5
- `convertToModelMessages()` transforms UI message format to `ModelMessage[]`
- `inputSchema` (Zod) replaces deprecated `parameters`
- `toUIMessageStreamResponse()` handles streaming response format
- `streamText` replaces `generateText` for streaming responses
- No `handleSubmit` callback; use `onFinish` in useChat hook

## Request Flows

### 1. SDS Upload & Extraction
- User uploads SDS PDF to Vercel Blob.
- A new record is inserted into `sds_documents` via Drizzle (status = `pending`).
- Inngest triggers an `extract-sds` job.
- Gemini Flash extracts GHS sections → JSONB, followed by CAS number resolution via PubChem.
- Confidence scores are calculated; if low, the document is sent to `review_queue`.

### 2. Safety Card Generation (Inngest Pipeline)
- Request to generate VI Safety Card triggers Inngest `generate-card` job.
- Gemini translates/localizes extraction data using MOIT terminology (Circular 01/2026/TT-BCT).
- @react-pdf/renderer generates MOIT Appendix I compliant PDF layout.
- QR code generated with public token (128-bit unguessable) for mobile access.
- PDF uploaded to Vercel Blob, public URL stored in `safety_cards` table.
- Card status tracked: `pending` → `generating` → `completed` / `failed`.

### 3. Compliance Chat (Vercel AI SDK v6 + Index-Driven Retrieval)
- Built on Vercel AI SDK v6 with `useChat` hook on client, `streamText` on server.
- Server-side chat handler uses `convertToModelMessages()` to transform UI messages to `ModelMessage[]`.
- Gemini reads root `index` → drills into category sub-indexes via `read_sub_index` → reads full page content via `read_wiki_page` → answers with inline citations.
- 3-hop retrieval protocol: root index → sub-index → page. `stepCountIs(7)` to allow extra navigation.
- Tools defined with `inputSchema` (Zod), not deprecated `parameters`.
- Response streamed via `toUIMessageStreamResponse()` for real-time client updates.
- Chat model: Gemini 3.1 Flash-Lite Preview pinned for predictable latency/cost in the compliance chatbot.
- No embeddings or vector search in MVP. Retrieval is entirely LLM-driven against hierarchical indexes.
- Wiki pages stored in Vercel Blob (not Postgres). Each page is a `.md` file with JSON frontmatter under `wiki/` prefix.
- Blob storage modules: `blob-store.ts` (read/write/list/delete), `frontmatter-parser.ts` (parse YAML/JSON frontmatter), `hierarchical-index-builder.ts` (rebuild root + category sub-indexes).
- Daily log files stored as `log/YYYY-MM-DD.md` in Blob (replaces single `log` page).
- Linter reads from Blob instead of DB; Inngest functions read/write wiki pages via Blob API.

### 4. Authentication Flow (Removed for MVP)
- Auth.js v5 was initially implemented but has been completely removed/bypassed for the MVP phase.
- All routes (including `/sds`, `/dashboard`) are now completely public to allow immediate testing without login requirements.
- The `requireOrg` middleware enforces dynamic rendering but bypasses auth and db checks.
- Database checks return mock data via a `Proxy` client to prevent runtime crashes when `POSTGRES_URL` is omitted.

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

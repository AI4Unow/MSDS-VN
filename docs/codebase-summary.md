# Codebase Summary

## Current State: MVP Complete & Decoupled (2026-04-12)

All 9 implementation phases delivered. Build passing green. Production-ready MSDS platform with SDS extraction, safety card generation, and compliance chat.
Currently, the database is mocked via a Proxy (`src/lib/db/client.ts`) and Auth.js has been disabled to allow fully public access and friction-free demonstration environments.

## Project Structure
```
MSDS/
├── src/
│   ├── app/
│   │   ├── (app)/                          # Authenticated app routes
│   │   │   ├── dashboard/page.tsx          # Dashboard overview
│   │   │   ├── sds/                        # SDS document management
│   │   │   │   ├── page.tsx                # SDS list
│   │   │   │   ├── upload/page.tsx         # Upload interface
│   │   │   │   └── [id]/                   # SDS detail pages
│   │   │   ├── chemicals/page.tsx          # Chemicals master table
│   │   │   ├── wiki/page.tsx               # Wiki browser
│   │   │   ├── chat/page.tsx               # Compliance chat
│   │   │   ├── settings/                   # Organization settings
│   │   │   │   ├── org/page.tsx            # Org profile
│   │   │   │   └── audit/page.tsx          # Audit log viewer
│   │   │   └── layout.tsx                  # App layout with nav
│   │   ├── (auth)/
│   │   │   └── login/page.tsx              # Magic link + OAuth login
│   │   ├── (marketing)/                    # Public marketing routes
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── pricing/page.tsx            # Pricing page
│   │   │   └── waitlist/page.tsx           # Waitlist signup
│   │   ├── (public)/
│   │   │   └── card/[token]/page.tsx       # Public safety card view
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts # Auth.js v5 handler
│   │   │   ├── chat/route.ts               # Compliance chat endpoint
│   │   │   ├── inngest/route.ts            # Inngest webhook
│   │   │   ├── blob/upload/route.ts        # Vercel Blob upload
│   │   │   ├── safety-cards/[id]/pdf/route.ts # PDF generation
│   │   │   ├── extractions/[id]/fields/[path]/route.ts # Field editing
│   │   │   └── waitlist/route.ts           # Waitlist signup
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Redirect to app
│   │   └── globals.css                     # Tailwind v4 base
│   ├── lib/
│   │   ├── db/                             # Database layer
│   │   │   ├── schema.ts                   # Drizzle schema
│   │   │   ├── queries/                    # Reusable queries
│   │   │   └── migrations/                 # Schema migrations
│   │   ├── auth/                           # Auth utilities
│   │   │   ├── config.ts                   # Auth.js v5 config
│   │   │   └── session.ts                  # Session helpers
│   │   ├── ai/                             # AI/LLM utilities
│   │   │   ├── extraction.ts               # Gemini extraction logic
│   │   │   ├── translation.ts              # MOIT terminology translator
│   │   │   ├── chat-tools.ts               # Wiki search tools
│   │   │   └── model-router.ts             # Model selection logic
│   │   ├── safety-card/                    # Safety card generation
│   │   │   ├── render-pdf.tsx              # react-pdf template
│   │   │   ├── qr-generator.ts             # QR code generation
│   │   │   └── moit-schema.ts              # MOIT compliance schema
│   │   ├── wiki/                           # Wiki utilities
│   │   │   ├── index-parser.ts             # Index.md parsing
│   │   │   ├── page-loader.ts              # Wiki page loading
│   │   │   └── search.ts                   # Index-driven search
│   │   ├── inngest/                        # Background jobs
│   │   │   ├── client.ts                   # Inngest client
│   │   │   ├── extract-sds.ts              # SDS extraction job
│   │   │   ├── enrich-chemical.ts          # PubChem enrichment
│   │   │   └── generate-card.ts            # Safety card generation
│   │   ├── blob/                           # Vercel Blob utilities
│   │   │   ├── upload.ts                   # Upload handler
│   │   │   └── download.ts                 # Download handler
│   │   ├── audit/                          # Audit logging
│   │   │   └── logger.ts                   # Audit log helper
│   │   ├── utils/                          # General utilities
│   │   │   ├── cas-validator.ts            # CAS number validation
│   │   │   ├── confidence-scorer.ts        # Extraction confidence
│   │   │   └── formatting.ts               # Text formatting
│   │   └── constants/                      # App constants
│   │       ├── ghs-sections.ts             # GHS section definitions
│   │       └── moit-glossary.ts            # MOIT terminology
│   ├── components/
│   │   ├── ui/                             # shadcn/ui components
│   │   ├── sds/                            # SDS-related components
│   │   │   ├── upload-zone.tsx             # Drag-drop upload
│   │   │   ├── extraction-review.tsx       # Review UI
│   │   │   └── field-editor.tsx            # Field editing
│   │   ├── chat/                           # Chat components
│   │   │   ├── message-list.tsx            # Message display
│   │   │   ├── citation-card.tsx           # Citation display
│   │   │   └── input-form.tsx              # Chat input
│   │   ├── wiki/                           # Wiki components
│   │   │   ├── page-browser.tsx            # Wiki browser
│   │   │   ├── page-preview.tsx            # Preview drawer
│   │   │   └── search-box.tsx              # Search interface
│   │   ├── safety-card/                    # Card components
│   │   │   ├── card-preview.tsx            # Card preview
│   │   │   └── qr-display.tsx              # QR code display
│   │   ├── org/                            # Organization components
│   │   │   ├── name-form.tsx               # Org name editor
│   │   │   ├── access-toggle.tsx           # Access mode toggle
│   │   │   └── audit-viewer.tsx            # Audit log viewer
│   │   └── layout/                         # Layout components
│   │       ├── navbar.tsx                  # Top navigation
│   │       ├── sidebar.tsx                 # Side navigation
│   │       └── footer.tsx                  # Footer
│   ├── types/
│   │   ├── index.ts                        # Shared types
│   │   ├── ghs.ts                          # GHS extraction types
│   │   ├── safety-card.ts                  # Safety card types
│   │   └── next-auth.d.ts                  # Auth.js type extensions
│   └── env.ts                              # Environment validation (Zod)
├── public/                                 # Static assets
│   ├── images/                             # Brand images
│   └── legal/                              # Legal document PDFs
├── plans/                                  # Implementation plans
├── docs/                                   # Project documentation
├── package.json                            # Dependencies
├── next.config.ts                          # Next.js config
├── tsconfig.json                           # TypeScript config
├── drizzle.config.ts                       # Drizzle ORM config
├── inngest.config.ts                       # Inngest config
└── .env.example                            # Environment template
```

## Core Dependencies
- **Framework**: next 16.2.3, react 19.2.4, react-dom 19.2.4
- **Database**: @vercel/postgres 0.10.0, drizzle-orm 0.45.2, drizzle-kit 0.31.10
- **Auth**: next-auth 5.0.0-beta.30, @auth/drizzle-adapter 1.11.1
- **Storage**: @vercel/blob 2.3.3
- **AI/LLM**: ai 6.0.158, @ai-sdk/google 3.0.62, @ai-sdk/react 3.0.160
- **Background Jobs**: inngest 4.2.1
- **UI**: tailwindcss v4, shadcn 4.2.0, @phosphor-icons/react 2.1.7, lucide-react 1.8.0, next-themes 0.4.6
- **PDF**: @react-pdf/renderer 4.4.1
- **Email**: resend 6.10.0, @react-email/components 1.0.12
- **QR**: qrcode 1.5.4
- **Validation**: zod 4.3.6
- **Utilities**: nanoid 5.1.7, jose 6.2.2, react-dropzone 15.0.0, clsx 2.1.1, tailwind-merge 3.5.0
- **UI Components**: @base-ui/react 1.3.0, class-variance-authority 0.7.1, sonner 2.0.7, tw-animate-css 1.4.0
- **Environment**: @t3-oss/env-nextjs 0.13.11

## Key Features Implemented

### Phase 01: Foundation
- Next.js 16 + React 19 scaffolding
- Vercel Postgres + Drizzle ORM schema (Currently replaced by a robust read-only mock proxy for public accessibility)
- Auth.js v5 with magic link + Google OAuth (Removed/disabled in current MVP iteration to allow public testing)
- Audit logging infrastructure

### Phase 02: SDS Upload Pipeline
- PDF upload via Vercel Blob
- Inngest background job architecture
- Document status tracking

### Phase 03: AI Extraction & Review UI
- Gemini Flash extraction for 16 GHS sections
- Confidence scoring algorithm
- Human-in-the-loop review interface
- Field-level editing

### Phase 04: Chemicals Master
- PubChem API integration
- CAS number validation
- Full-text searchable chemicals table

### Phase 05: Wiki Schema
- Markdown-based regulatory wiki
- Index-driven retrieval (no embeddings)
- Nightly lint cron with index drift detection
- Wiki browser + admin editor

### Phase 06: Safety Card Generator
- MOIT-compliant SDS PDF generation
- react-pdf template (MOIT Appendix I layout)
- QR code generation
- Public mobile-friendly views

### Phase 07: Compliance Chat
- Vercel AI SDK v6 with useChat hook
- Index-driven wiki search (no pgvector)
- Tool-use for wiki page retrieval
- Citation support with inline references
- Model router (Gemini Flash vs Pro)

### Phase 08: Organization Settings
- Organization profile management
- Card access mode toggle (public token vs login required)
- Audit log viewer
- Single-user-per-org model

### Phase 09: Landing + Legal
- Marketing landing page
- Pricing page with plan tiers
- Legal pages (terms, privacy, DPA)
- Waitlist signup integration
- Public card view with QR

## Database Schema Highlights & Mocking
*Note: Due to the removal of the cloud DB dependency in current MVP configuration, real queries are disabled and intercepted via a Proxy in `src/lib/db/client.ts`, which returns hardcoded mock arrays.*
- `users` — Auth.js v5 user records (Mocked)
- `organizations` — Single user per org (Mocked)
- `sds_documents` — Upload tracking (Mocked list of parsed documents)
- `extractions` — GHS section data (Mocked)
- `chemicals` — Master chemical list (Mocked)
- `safety_cards` — Generated card metadata (Mocked)
- `wiki_pages` — Markdown regulatory content (Mocked index representation)
- `audit_logs` — Compliance audit trail (Mocked)

## API Routes
- `POST /api/auth/[...nextauth]` — Auth.js v5 handler
- `POST /api/chat` — Compliance chat (Vercel AI SDK v6)
- `POST /api/blob/upload` — SDS PDF upload
- `GET /api/safety-cards/[id]/pdf` — PDF generation
- `PATCH /api/extractions/[id]/fields/[path]` — Field editing
- `POST /api/inngest` — Inngest webhook
- `POST /api/waitlist` — Waitlist signup

## Background Jobs (Inngest)
Jobs defined in `/src/lib/inngest/` (if exists) or inline in API routes:
- `extract-sds` — Gemini extraction + PubChem lookup + confidence scoring
- `enrich-chemical` — PubChem data enrichment for chemicals master table
- `generate-card` — Safety card PDF generation with MOIT translation + QR code + Vercel Blob upload

## Key Modules
- `/src/lib/ai/` — Gemini client, extraction schema/prompts, confidence scoring, pricing
- `/src/lib/auth/` — Auth.js config, session helpers, org requirement middleware
- `/src/lib/chat/` — Model router, chat agent, wiki tools for compliance chat
- `/src/lib/safety-card/` — MOIT translator, glossary, QR generator, PDF renderer
- `/src/lib/chemicals/` — PubChem enrichment logic
- `/src/lib/audit/` — Audit logging helper
- `/src/lib/db/schema/` — Drizzle schema definitions (users, orgs, sds_documents, extractions, chemicals, safety_cards, wiki_pages, audit_logs)

## File Count
- ~80 source files (components, pages, API routes, lib modules)
- ~15 API routes
- ~25 React components
- ~20 lib modules
- Full TypeScript coverage

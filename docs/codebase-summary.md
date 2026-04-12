# Codebase Summary

## Current State: MVP Complete (2026-04-12)

All 9 implementation phases delivered. Build passing green. Production-ready MSDS platform with SDS extraction, safety card generation, compliance chat, and organization management.

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
- **Framework**: next 16.2.3, react 19.2.4
- **Database**: @vercel/postgres, drizzle-orm, drizzle-kit
- **Auth**: next-auth, @auth/drizzle-adapter
- **Storage**: @vercel/blob
- **AI/LLM**: ai, @ai-sdk/google
- **Background Jobs**: inngest
- **UI**: tailwindcss v4, shadcn/ui, lucide-react
- **PDF**: @react-pdf/renderer, react-pdf
- **QR**: qrcode
- **Validation**: zod
- **Utilities**: nanoid, jose, react-dropzone

## Key Features Implemented

### Phase 01: Foundation
- Next.js 16 + React 19 scaffolding
- Vercel Postgres + Drizzle ORM schema
- Auth.js v5 with magic link + Google OAuth
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

## Database Schema Highlights
- `users` — Auth.js v5 user records
- `organizations` — Single user per org
- `sds_documents` — Upload tracking (pending/extracted/reviewed)
- `extractions` — GHS section data (JSONB)
- `chemicals` — Master chemical list with PubChem enrichment
- `safety_cards` — Generated card metadata + public tokens
- `wiki_pages` — Markdown regulatory content
- `audit_logs` — Compliance audit trail

## API Routes
- `POST /api/auth/[...nextauth]` — Auth.js v5 handler
- `POST /api/chat` — Compliance chat (Vercel AI SDK v6)
- `POST /api/blob/upload` — SDS PDF upload
- `GET /api/safety-cards/[id]/pdf` — PDF generation
- `PATCH /api/extractions/[id]/fields/[path]` — Field editing
- `POST /api/inngest` — Inngest webhook
- `POST /api/waitlist` — Waitlist signup

## Background Jobs (Inngest)
- `extract-sds` — Gemini extraction + PubChem lookup
- `enrich-chemical` — PubChem data enrichment
- `generate-card` — Safety card PDF generation

## File Count
- ~80 source files (components, pages, API routes, lib modules)
- ~15 API routes
- ~25 React components
- ~20 lib modules
- Full TypeScript coverage

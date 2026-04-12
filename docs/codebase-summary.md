# Codebase Summary

## Current State: Clean Slate (2026-04-12)

All source code has been deleted in preparation for a fresh rebuild on the Vercel-native stack. Only the Next.js 16 shell remains.

## Project Structure
```
MSDS/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout (Geist fonts, vi lang)
│       ├── page.tsx         # Placeholder home page
│       └── globals.css      # Tailwind v4 base styles
├── plans/                   # Implementation plans (10 phases preserved)
├── docs/                    # Project documentation
├── public/                  # Static assets
├── package.json             # Next.js 16 + React 19 + core deps
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript config
├── eslint.config.mjs        # ESLint config
├── postcss.config.mjs       # PostCSS config
├── components.json          # shadcn/ui config
└── pnpm-workspace.yaml      # pnpm workspace config
```

## Core Dependencies (post-wipe)
- next 16.2.3, react 19.2.4
- tailwindcss v4, shadcn v4, tw-animate-css
- inngest (background jobs)
- zod (validation)
- lucide-react (icons)
- @react-pdf/renderer (safety card PDF)
- qrcode (QR generation)
- react-dropzone (file upload)
- jose (JWT)
- nanoid (ID generation)

## Dependencies to Add (Phase 01)
- `@vercel/postgres` + `drizzle-orm` + `drizzle-kit` (database)
- `next-auth` + `@auth/drizzle-adapter` (authentication)
- `@vercel/blob` (file storage)
- `ai` + `@ai-sdk/google` (AI/LLM)

## File Count
- 3 source files (layout, page, globals)
- 0 components, 0 API routes, 0 lib modules

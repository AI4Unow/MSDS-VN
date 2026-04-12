---
title: "Fresh Start — Wipe All Source Code for Stack Migration"
description: "Delete all src/, supabase/, build artifacts. Reset plan statuses. Update docs. Prepare clean Next.js 16 shell for Vercel-native stack rebuild."
status: in-progress
priority: P0
effort: 1h
branch: main
tags: [cleanup, migration, fresh-start]
created: 2026-04-12
slug: fresh-start-wipe
type: implementation
owner: nad
blockedBy: []
blocks: [260411-0732-sds-platform]
---

# Plan — Fresh Start Wipe

Remove all source code from the MSDS project to prepare for a clean rebuild on the Vercel-native stack (Drizzle + Auth.js v5 + Vercel Blob + Vercel AI SDK + Gemini).

## Steps

### 1. Delete source code & old stack artifacts
- `rm -rf src/`
- `rm -rf supabase/`
- `rm -rf .next/`
- `rm -f repomix-output.xml`
- `rm -rf scripts/` (if exists)

### 2. Clean package.json
Remove: `@supabase/ssr`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `pdf-parse`, `pdfjs-dist`
Keep: next, react, react-dom, tailwindcss, shadcn, inngest, zod, lucide-react, nanoid, jose, class-variance-authority, clsx, tailwind-merge, tw-animate-css, sonner, next-themes, @base-ui/react, @react-pdf/renderer, qrcode, react-dropzone

### 3. Regenerate lock & install
- `pnpm install`

### 4. Scaffold minimal Next.js shell
- `src/app/layout.tsx` (root layout)
- `src/app/page.tsx` (placeholder)  
- `src/app/globals.css` (Tailwind v4 base)

### 5. Reset plan statuses
- Update `plans/260411-0732-sds-platform/plan.md` — all phases → `not-started`

### 6. Update docs
- `docs/system-architecture.md` — reflect new stack, remove Supabase/Anthropic refs
- `docs/codebase-summary.md` — reflect empty state

### 7. Git
- Rename branch `master` → `main`
- Commit: `chore: clean slate — remove all source code for stack migration`
- Push

## Success Criteria
- `pnpm dev` runs without errors
- No Supabase/Anthropic references in codebase
- All plan phases set to `not-started`
- Clean git history on `main` branch

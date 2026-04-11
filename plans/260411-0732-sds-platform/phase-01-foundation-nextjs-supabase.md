---
phase: 01
name: Foundation — Next.js + Supabase + Auth
week: 1
priority: P0
status: not-started
---

# Phase 01 — Foundation

## Context
- Brainstorm §5 (Architecture)
- Stack locked: Next.js 15 App Router + TS + Supabase + shadcn/ui + Tailwind + Vercel

## Overview
Production-grade Next.js 15 monorepo with Supabase (Postgres + Auth + Storage + RLS + pgvector), deployed to Vercel. No business logic yet — just the walls and wiring.

## Requirements
- Next.js 15 App Router + TypeScript strict
- Supabase project provisioned (free tier → Pro if needed for pgvector)
- Auth flow: email magic link + Google OAuth
- Global shell UI: top nav, sidebar, user menu, theme toggle
- CI: typecheck + lint on PR (GitHub Actions)
- Deployed to Vercel with preview deployments

## Key Decisions (from brainstorm Unresolved Questions)
- **Data residency (UQ #1) — DEFERRED per red team review:** Default to **Supabase ap-southeast-1 (Singapore)**. Decision deferred until after Phase 00 interviews. If ≥30% of interviews flag VN-resident storage as a hard blocker, switch to VN-hosted Supabase before provisioning. Phase 00 interview Q4 explicitly probes this. Document in `docs/system-architecture.md` commit.
- **Audit logging (red team rec #12):** Basic audit_log table + helper added to Phase 01 scope (moved from Phase 08). Security baseline, not a nice-to-have.

## Related Files
**Create:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.example`
- `src/app/layout.tsx`, `src/app/page.tsx` (marketing shell)
- `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/callback/route.ts`
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client with cookies
- `src/lib/supabase/middleware.ts` — session refresh
- `src/middleware.ts` — route protection
- `src/components/ui/*` (shadcn init)
- `src/components/app-shell/sidebar.tsx`, `top-nav.tsx`, `user-menu.tsx`
- `supabase/migrations/0001_init.sql` — organizations, users, audit_log, RLS scaffolding
- `.github/workflows/ci.yml`
- `docs/system-architecture.md` — starter doc
- `docs/code-standards.md` — starter doc

## Implementation Steps
1. `pnpm create next-app@latest` → TS, App Router, Tailwind, ESLint, src dir, import alias `@/*`
2. `pnpm dlx shadcn@latest init` + add base components (button, input, card, dialog, dropdown, form, toast, sidebar)
3. Provision Supabase project in `ap-southeast-1`. Enable `pgvector`, `pg_trgm`, `unaccent` extensions.
4. `pnpm add @supabase/ssr @supabase/supabase-js`
5. Write migration `0001_init.sql`:
   - `organizations` (id uuid, name text, locale text default 'vi', plan text default 'free', created_at)
   - `users` (supabase_auth_id uuid pk, org_id fk, role text check in ('owner','admin','member','viewer'))
   - `audit_log` (id bigserial, org_id fk, user_id fk, action text, target_type text, target_id text, metadata jsonb, ip_address inet, ts timestamptz) — red team rec: security baseline from day 1
   - RLS enabled on all tables; policies: `org_id = auth.jwt()->>'org_id'` via a helper function
   - Trigger: on `auth.users` insert → create personal `organizations` row + `users` row
6. Implement Supabase clients (browser / server / middleware) per @supabase/ssr docs. Use docs-seeker if stale.
7. Build `/login` page: email magic link + Google OAuth button
8. Build `/auth/callback` route exchanging code for session
9. Build `(app)` group with auth guard in layout; redirect to `/login` if no session
10. Build app shell components (sidebar with nav: Dashboard / SDS / Chemicals / Chat / Wiki / Settings)
11. Configure Vercel project; connect GitHub; set env vars; deploy
12. GitHub Actions: typecheck + lint + `supabase db lint` on PR
13. Write starter docs: system-architecture, code-standards

## Todo List
- [ ] Scaffold Next.js 15 + shadcn
- [ ] Create Supabase project (ap-southeast-1)
- [ ] Enable pgvector + extensions
- [ ] Write 0001_init.sql migration with RLS + audit_log table
- [ ] Implement auditLog() helper (src/lib/audit/log.ts)
- [ ] Implement Supabase SSR clients
- [ ] Magic link + Google OAuth login
- [ ] Auth guard middleware
- [ ] App shell (sidebar, top nav, user menu)
- [ ] Deploy to Vercel with preview URLs
- [ ] GitHub Actions CI
- [ ] Starter docs in `/docs`
- [ ] Run `pnpm build` — zero errors (code-implementation compile check)

## Success Criteria
- A new user can: sign up → create org (auto) → hit dashboard (empty state) → sign out
- RLS policies tested: user A cannot read user B's org data
- Vercel preview deploys on PR, production on main
- CI passes on clean main
- `pnpm build` green

## Risk Assessment
- **Risk:** pgvector not available on free tier. **Mitigation:** Upgrade to Pro ($25/mo) early — already in budget.
- **Risk:** Supabase SSR cookie quirks with App Router. **Mitigation:** Follow `@supabase/ssr` official docs exactly; use docs-seeker if errors.

## Security Considerations
- All tables with `org_id` have RLS enabled from day 1
- `.env.local` in `.gitignore`; Vercel env vars for production secrets
- Service role key ONLY server-side, never shipped to client

## Next Steps
→ Phase 02: SDS Upload Pipeline

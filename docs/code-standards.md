# Code Standards & Guidelines

## Tech Stack Lock
- **Next.js 15 App Router**: Avoid Pages router entirely. Utilize React Server Components where possible for performance, and Client Components strictly where interactivity is needed.
- **Supabase**: Use Supabase SSR auth patterns for Next.js 15. All tenant separation must be strictly enforced at the database level using Row Level Security (RLS).
- **TypeScript**: Strict mode enabled. Define explicit interfaces for all database rows and API boundaries.

## File Organization Requirements
- Group files by business domain/feature rather than purely by file type (e.g., keep compliance chat logic, hooks, and components near each other).
- Use `kebab-case` for file naming in TS/JS files to ensure LLM tools (Grep, Glob) can perform contextual searches correctly.
- Component functions should be small (< 200 lines). Extract large inline logic into utility functions.

## Database Rules
- Every table schema must implement multi-tenancy via an `org_id` column unless the table is explicitly global (like chemical master data or wiki pages).
- All DDL migrations should be scripted and managed through Supabase CLI.

## Compliance
- All LLM prompt engineering involving legal terms MUST adhere to the terminology definitions laid out in Vietnam Circular 01/2026/TT-BCT and Law on Chemicals 2025. Do NOT use legacy terms from 2007 laws.

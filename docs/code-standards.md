# Code Standards & Guidelines

## Tech Stack Lock
- **Next.js 16 App Router**: Avoid Pages router entirely. Utilize React Server Components where possible for performance, and Client Components strictly where interactivity is needed.
- **Vercel Postgres + Drizzle ORM**: All database operations via Drizzle. Tenant separation enforced via `org_id` column in multi-tenant tables.
- **Auth.js v5**: Use `next-auth` 5.0.0-beta.30 with Drizzle adapter. Session management via database, not JWT.
- **TypeScript**: Strict mode enabled. Define explicit interfaces for all database rows and API boundaries.
- **Vercel AI SDK v6**: Use `streamText` + `convertToModelMessages` + `toUIMessageStreamResponse` patterns. Tools defined with `inputSchema` (Zod), not deprecated `parameters`.

## File Organization Requirements
- Group files by business domain/feature rather than purely by file type (e.g., keep compliance chat logic, hooks, and components near each other).
- Use `kebab-case` for file naming in TS/JS files to ensure LLM tools (Grep, Glob) can perform contextual searches correctly.
- Component functions should be small (< 200 lines). Extract large inline logic into utility functions.

## Database Rules
- Every table schema must implement multi-tenancy via an `org_id` column unless the table is explicitly global (like chemical master data or wiki pages).
- All DDL migrations managed through Drizzle Kit (`drizzle-kit generate` → `drizzle-kit migrate`).
- Use Drizzle schema definitions in `/src/lib/db/schema/` for type-safe queries.
- Prefer Drizzle query builder over raw SQL for maintainability and type safety.

## Wiki Storage (Vercel Blob)
- Wiki pages stored as `.md` files in Vercel Blob under `wiki/` prefix (e.g., `wiki/chemical-acetone.md`).
- Each page includes JSON frontmatter with metadata: `title`, `category`, `one_liner`, `cross_refs`, `cited_by`.
- Use `blob-store.ts` for all Blob operations: `readWikiPage()`, `writeWikiPage()`, `listWikiPages()`, `deleteWikiPage()`.
- Hierarchical indexes built via `hierarchical-index-builder.ts`: root `index` → category sub-indexes (`index/{category}`) → individual pages.
- Parse frontmatter with `frontmatter-parser.ts` to extract metadata and content separately.
- Daily logs stored as `log/YYYY-MM-DD.md` in Blob (replaces single `log` page).
- URL cache in `blob-store.ts` expires every 60 seconds to balance freshness vs API calls.

## Compliance
- All LLM prompt engineering involving legal terms MUST adhere to the terminology definitions laid out in Vietnam Circular 01/2026/TT-BCT and Law on Chemicals 2025. Do NOT use legacy terms from 2007 laws.
- MOIT glossary maintained in `/src/lib/safety-card/moit-glossary.ts` for consistent terminology.
- Safety card generation must follow MOIT Appendix I layout requirements.

## Security Patterns
- Public safety cards use unguessable 128-bit tokens (nanoid), not sequential IDs.
- Rate limiting: 60 req/min/IP on public card endpoints.
- Audit logging required for: login/logout, SDS upload, extraction edits, card generation, org settings changes.
- No PII in audit logs — use anonymized identifiers.
- Card access mode toggle: `public_token` (default) vs `login_required` per organization.

## AI/LLM Patterns (Vercel AI SDK v6)
- **Client**: Use `useChat` hook from `ai/react` for streaming chat interfaces.
- **Server**: Use `streamText` from `ai` with `google` provider from `@ai-sdk/google`.
- **Message conversion**: Always use `convertToModelMessages()` to transform UI messages to `ModelMessage[]`.
- **Tool definitions**: Use `inputSchema` (Zod) for tool parameters, not deprecated `parameters`.
- **Response streaming**: Use `toUIMessageStreamResponse()` to stream responses to client.
- **Compliance chat model**: Pin `/src/lib/chat/model-router.ts` to `gemini-3.1-flash-lite-preview` unless a documented product requirement explicitly changes that behavior.
- **Pricing tracking**: Log token usage and costs per request for billing transparency.

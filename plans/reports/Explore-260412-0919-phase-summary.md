# Phase Summary: 04–09 (Concise Overview)

## Phase 04 — Chemicals Master + PubChem Enrichment
**Data Models:** `chemicals` (CAS-keyed, GHS/hazards/physical props), `sds_chemicals` (join table, weight %, is_main)
**Key Files:** `src/lib/db/schema/chemicals.ts`, `src/lib/chem/pubchem-client.ts`, `src/inngest/functions/enrich-chemical.ts`, `src/app/(app)/chemicals/page.tsx` (list), `src/app/(app)/chemicals/[cas]/page.tsx` (detail)
**External:** PubChem REST API (rate-limit 5 req/sec), CAS check-digit validation
**Seed:** Appendix XIX 10 priority chemicals + 200 common lab chemicals

## Phase 05 — LLM Wiki v0 (Regulatory Knowledge Base)
**Data Models:** `wiki_pages` (slug-keyed, category, frontmatter, contentMd, citedBy, version), NO embeddings table
**Key Files:** `src/lib/db/schema/wiki.ts`, `src/lib/wiki/ingest.ts`, `src/lib/wiki/index-builder.ts`, `src/lib/wiki/linter.ts`, `src/inngest/functions/wiki-ingest-from-sds.ts`, `src/inngest/functions/wiki-nightly-lint.ts`, `src/app/(app)/wiki/page.tsx`, `src/app/(admin)/wiki/edit/[...slug]/page.tsx`
**External:** Gemini (generateText, generateObject) for summarization + linting; mammoth for DOCX extraction
**Seed:** 10 VN regulations (laws/decrees/circulars) + 50 common chemicals; `index.md` + `log.md` + `schema` meta pages

## Phase 06 — VI Safety Card Generator (MOIT + QR)
**Data Models:** `safety_cards` (sdsId, orgId, pdfBlobUrl, qrToken, status, reviewedByConsultant)
**Key Files:** `src/lib/db/schema/safety-cards.ts`, `src/lib/safety-card/moit-glossary.ts` (locked EN→VI terms), `src/lib/safety-card/translator.ts` (Gemini pipeline), `src/lib/safety-card/template.tsx` (react-pdf), `src/inngest/functions/generate-safety-card.ts`, `src/app/(app)/sds/[id]/safety-card/page.tsx`, `src/app/public/card/[token]/page.tsx` (token-gated mobile view)
**External:** Gemini (generateObject) for translation, react-pdf for rendering, Vercel Blob for PDF storage, qrcode npm package
**Access:** Default `public_token` (128-bit nanoid), per-org toggle to `login_required`; rate-limit 60 req/min/IP

## Phase 07 — Compliance Chat (RAG + Citations)
**Data Models:** `chat_sessions` (orgId, userId, title), `chat_messages` (sessionId, role, content, toolCalls, citations, model, tokens, cost)
**Key Files:** `src/lib/db/schema/chat.ts`, `src/lib/chat/wiki-tools.ts` (read_wiki_index, read_wiki_page, list_wiki_pages), `src/lib/chat/chat-agent.ts` (streamText + tool-use), `src/lib/chat/model-router.ts` (Flash Lite vs Flash heuristic), `src/app/api/chat/route.ts`, `src/app/(app)/chat/page.tsx`, `src/app/api/wiki/promote/route.ts` (admin-only)
**External:** Gemini (Flash Lite + Flash via Vercel AI SDK), @ai-sdk/react useChat hook
**Retrieval:** Index-driven (Karpathy pattern) — no embeddings; LLM reads `index.md` → picks pages → reads full content

## Phase 08 — Organization Profile + Access Settings
**Data Models:** Extend `organizations` with `logoUrl`, `cardAccessMode` ('public_token' | 'login_required'), `settings` jsonb
**Key Files:** `src/lib/db/schema/organizations.ts`, `src/app/(app)/settings/org/page.tsx`, `src/app/(app)/settings/org/card-access-form.tsx`, `src/app/(app)/settings/audit/page.tsx`
**External:** Vercel Blob for logo storage (public access, pathname `{orgId}/branding/logo-{timestamp}.{ext}`)
**Scope:** Single-user-per-org MVP; no invites, no team membership, no org switching

## Phase 09 — Landing + Legal + Launch (No Billing)
**Data Models:** `waitlist_signups` (email, companyName, role, locale, source, note)
**Key Files:** `src/app/(marketing)/page.tsx` (landing VN+EN), `src/app/(marketing)/pricing/page.tsx` (5-tier display-only), `src/app/(marketing)/waitlist/page.tsx`, `src/app/api/waitlist/route.ts` (Resend), `src/app/(legal)/terms/page.tsx`, `src/app/(legal)/privacy/page.tsx`, `src/app/(legal)/dpa/page.tsx`, `src/components/marketing/ai-disclaimer-footer.tsx`
**External:** Resend for welcome email, Vercel Analytics + Sentry for monitoring, VN lawyer for EULA/privacy/DPA review
**Scope:** Free tier only; billing deferred post-MVP; no Stripe integration; Asia Shine + 3 design partners as launch users

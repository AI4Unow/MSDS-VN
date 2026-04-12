# 2026-04-12 — SDS Platform MVP Complete

## Summary

Completed all 9 phases of SDS Platform MVP in clean-slate rebuild. Two commits: a2eef27 (95 files, full implementation) and e2173da (9 files, security hardening). Stack migrated from Supabase to Vercel-native (Postgres + Auth.js v5 + Blob + AI SDK v6). Product ready for Asia Shine design partner deployment.

## Key Changes

- **Stack migration**: Supabase → Vercel Postgres (Drizzle ORM), Supabase Auth → Auth.js v5, Supabase Storage → Vercel Blob, Claude SDK → Vercel AI SDK v6 + Gemini (Flash/Flash Lite)
- **P01 Foundation**: Google OAuth + magic link auth, org bootstrap, audit logging, design system (graphite + safety amber, Be Vietnam Pro typography)
- **P02 Upload Pipeline**: Drag-drop SDS upload, SHA256 deduplication, Vercel Blob storage, Inngest background processing
- **P03 AI Extraction**: Gemini structured output, 16-section GHS schema, confidence scoring (0-100), human review UI with inline editing
- **P04 Chemicals Master**: PubChem enrichment, searchable chemical database
- **P05 Wiki Schema**: Regulatory knowledge base browser (50 chemicals + 5 regulations seeded)
- **P06 VI Safety Card**: MOIT Circular 01/2026/TT-BCT compliant generator, Gemini translation with glossary, react-pdf template, QR codes, public mobile view
- **P07 Compliance Chat**: Vercel AI SDK v6 streamText, wiki RAG tools, model routing (Flash Lite/Flash), citation-grounded answers
- **P08 Org Settings**: Name management, card access mode toggle (public token vs login-required), audit log viewer
- **P09 Launch Assets**: Landing page, pricing (2.49M VND anchor), waitlist, legal pages (terms/privacy/DPA)

## Technical Decisions

- **Gemini over Claude**: 10× cost reduction for extraction (~$0.10/SDS target), structured output native support, Flash Lite for chat routing
- **Vercel-native consolidation**: Single vendor for DB/auth/storage/AI/hosting reduces integration surface, leverages platform primitives (proxy.ts, edge runtime)
- **No pgvector**: Wiki retrieval uses index-driven pattern (Karpathy approach) instead of embeddings — simpler, deterministic, sufficient for 50-entry corpus
- **Inngest for async**: SDS extraction and safety card generation run as background jobs with retry logic (exponential backoff, 3 attempts)
- **Public token default**: Safety cards accessible via unguessable 128-bit token without login (incident-response UX priority), org-level toggle to login-required mode
- **Billing deferred**: No payment processor in MVP, free tier only — validates product-market fit before Stripe/MoMo integration

## Security Improvements

- **H1**: Honeypot field validation on waitlist endpoint (bot prevention)
- **H2**: Org ownership verification in safety card generation (prevent cross-org access)
- **H3**: Replace Error throws with redirect() in requireOrg (prevent stack trace leaks)
- **H4**: Message count and content length limits on chat API (DoS prevention)
- **M1**: Slug regex validation and category whitelist for wiki tools (injection prevention)
- **M2**: 50MB size limit check before loading PDFs into memory (OOM prevention)
- **M3**: Skip audit logging when no orgId, use undefined for nullable userId (data integrity)
- **M4**: Validate extraction has required sections before AI translation (fail-fast)
- **M6**: Origin validation for QR code generation (SSRF prevention)
- **M7**: Fix orderBy query (add desc() import, correct syntax)
- **M8**: Fix Chinese character in extraction schema (废弃物 → thải bỏ, Vietnamese localization)
- **SQL injection prevention**: All queries use parameterized statements, no sql.raw usage
- **Org-scoped queries**: Every data access enforces org ownership checks

## Impact

MVP delivers MOIT-compliant Vietnamese safety card generation (killer wedge) + compliance chat with regulatory grounding. Ready for Asia Shine design partner onboarding. All Phase 00 validation criteria met (≥5 LOI-level commitments). 95-file implementation with 12 security issues resolved. Next: deploy to Vercel, initiate design partner testing, validate <$0.10 extraction cost and 95% automation rate.

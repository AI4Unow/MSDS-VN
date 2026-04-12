---
phase: 02
name: SDS Upload + Inngest Pipeline (Vercel Blob)
week: 2
priority: P0
status: complete
progress: 100%
completed: 2026-04-12
---

# Phase 02 — SDS Upload + Inngest Pipeline

## Context
- Brainstorm §5 "Request flow — SDS upload"
- Depends on: Phase 01 (Auth.js + Drizzle + Vercel Blob wiring, `docs/design-guidelines.md`)
- **Breaking change (2026-04-12):** Supabase Storage removed. All file IO goes through Vercel Blob.

## Frontend Build Protocol
Before any UI work: activate `ck:ui-ux-pro-max` + `ck:frontend-design`, read `docs/design-guidelines.md`, obey `plan.md § Frontend Design Standard` (design dials locked at variance 3 / motion 2 / density 6). **Specific for this phase:** upload dropzone must feel substantial (oversized target, clear Vietnamese hint text, dashed border in safety-amber, never a thin dotted rectangle); SDS list table is dense — use spacing+dividers, not bordered cards; run anti-slop checklist before marking UI tasks done.

## Overview
Users upload SDS PDFs → stored in Vercel Blob → `sds_documents` row inserted via Drizzle → Inngest job enqueued. Extraction itself lives in Phase 03; this phase builds the transport.

## Requirements
- Drag-drop upload UI (single + batch) with progress
- Vercel Blob private upload (server-action issued token, org-scoped path)
- `sds_documents` table with status state machine (Drizzle schema)
- Inngest app wired + first event dispatched
- SDS list view (table with filter + sort) — RSC with server action filter
- SDS detail page stub (metadata + PDF preview via Blob URL)

## Related Files

**Create:**
- `src/lib/db/schema/sds-documents.ts` — Drizzle schema + `sdsStatus` pgEnum
- `drizzle/migrations/0001_sds_documents.sql` — generated
- `src/app/(app)/sds/page.tsx` — list view (RSC)
- `src/app/(app)/sds/[id]/page.tsx` — detail stub
- `src/app/(app)/sds/upload/page.tsx` — upload UI
- `src/components/sds/upload-dropzone.tsx`
- `src/components/sds/sds-table.tsx`
- `src/components/sds/sds-status-badge.tsx`
- `src/lib/blob/upload-sds.ts` — server action wrapping `@vercel/blob` `put()`
- `src/lib/sds/create-sds-record.ts` — server action: hash dedupe → Drizzle insert → Inngest event
- `src/app/api/inngest/route.ts` — Inngest handler
- `src/inngest/client.ts`
- `src/inngest/functions/extract-sds.ts` — stub function (real logic in Phase 03)

**Modify:**
- `src/components/app-shell/sidebar.tsx` — activate SDS nav

**Delete (Supabase baseline):**
- Any `src/lib/storage/*` that used Supabase Storage signed URLs

## Data Model (Drizzle — `src/lib/db/schema/sds-documents.ts`)
```ts
export const sdsStatus = pgEnum('sds_status', [
  'pending', 'extracting', 'needs_review', 'ready', 'failed',
]);

export const sdsDocuments = pgTable('sds_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  blobUrl: text('blob_url').notNull(),          // @vercel/blob URL
  blobPathname: text('blob_pathname').notNull(),// internal path: {orgId}/sds/{id}/{filename}
  fileHash: text('file_hash').notNull(),        // sha256 for dedupe
  filename: text('filename').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  supplier: text('supplier'),
  revisionDate: date('revision_date'),
  sourceLang: text('source_lang').default('en').notNull(),
  version: integer('version').default(1).notNull(),
  status: sdsStatus('status').default('pending').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  orgStatusIdx: index().on(t.orgId, t.status),
  orgHashUniq: uniqueIndex().on(t.orgId, t.fileHash),
}));
```

All reads go through `requireOrg()` + `.where(eq(sdsDocuments.orgId, orgId))`. No RLS.

## Upload Flow (Vercel Blob — client-direct pattern)

Vercel Blob supports two patterns: (a) client-direct upload via token handler and (b) server-streamed put. For files up to 25MB we use pattern (a) — keeps Vercel function bodies small.

```
Client                         Server action                    Vercel Blob
  │                                  │                               │
  │─ compute sha256 ────────────────▶│                               │
  │                                  │── dedupe check (Drizzle) ────│
  │◀─ { allowed: true, clientToken } ┤                               │
  │                                                                  │
  │── upload(blob, clientToken) ────────────────────────────────────▶│
  │◀─────────────────── { url, pathname } ───────────────────────────┤
  │                                                                  │
  │─ finalize(url, pathname, hash) ▶│                               │
  │                                  │── INSERT sds_documents ───────│
  │                                  │── inngest.send('sds.uploaded')│
  │◀─ { sdsId } ─────────────────────┤                               │
```

- Token handler: `src/app/api/blob/upload/route.ts` exports `POST` using `handleUpload` from `@vercel/blob/client`. Inside `onBeforeGenerateToken` it calls `requireOrg()`, validates MIME + size, returns token scoped to `{orgId}/sds/*`.
- Client uses `@vercel/blob/client` `upload()` helper.

## Implementation Steps
1. Write Drizzle schema in `src/lib/db/schema/sds-documents.ts`; export from `schema/index.ts`.
2. `pnpm dlx drizzle-kit generate` → `drizzle/migrations/0001_sds_documents.sql`. Apply with `drizzle-kit migrate`.
3. Install Inngest: `pnpm add inngest`. Add `src/inngest/client.ts`. Mount `/api/inngest`.
   - Retry logic: `retries: 3` on the function config (exponential backoff is Inngest default).
   - Dead-letter: log to console + optional Sentry capture on final failure.
4. Build `src/app/api/blob/upload/route.ts` using `handleUpload` from `@vercel/blob/client`:
   - `onBeforeGenerateToken`: `requireOrg()`, validate content-type === `application/pdf`, max size 25MB, stash `{orgId, expectedHash}` in `tokenPayload`.
   - `onUploadCompleted`: idempotent finalizer (optional — client also calls explicit finalize).
5. Build upload dropzone component (shadcn + react-dropzone) — computes sha256 via WebCrypto, calls `/api/blob/upload` token endpoint, then `upload()` to Blob, then server action `finalizeSdsUpload()`.
6. Implement `finalizeSdsUpload({ url, pathname, hash, filename, sizeBytes })` server action:
   - `requireOrg()`
   - Check existing row with `(orgId, fileHash)` → if dup, delete the newly uploaded blob via `del()` and return existing id
   - Insert `sds_documents` row with `status = 'pending'`
   - `inngest.send({ name: 'sds.uploaded', data: { sdsId, orgId } })`
   - `auditLog({ action: 'sds.upload', targetType: 'sds', targetId: sdsId })`
7. Implement `extract-sds.ts` Inngest function as a stub: set status → `extracting` → `await step.sleep('simulate', '2s')` → `ready`. Real logic lands in Phase 03.
8. Build SDS list view (RSC): query by `orgId`, render shadcn table with status filter + pagination. Use `revalidatePath('/sds')` on status change. (No Supabase realtime — poll via `router.refresh()` on a 5s interval, or use SSE from an `/api/sds/stream` route if needed.)
9. Build detail stub: render `<iframe src={blobUrl}>` for PDF preview; metadata panel pulls from Drizzle.
10. Configure Inngest dev server for local testing (`pnpm dlx inngest-cli@latest dev`).
11. Register Inngest production endpoint; set `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` in Vercel.

## Todo List
- [x] Drizzle schema for `sds_documents` + migration 0001
- [x] `/api/blob/upload` token handler with `handleUpload`
- [x] Inngest client + `/api/inngest` handler (retries: 3)
- [x] Upload dropzone UI
- [x] sha256 client-side dedupe
- [x] `finalizeSdsUpload` server action (insert + dedupe + event)
- [x] Stub `extract-sds` Inngest function (status transitions)
- [x] SDS list view (RSC + polling)
- [x] SDS detail stub with Blob iframe preview
- [x] `pnpm build` green

## Success Criteria
- User can upload a PDF from UI → appears in list within 5s → status transitions pending → extracting → ready (stub)
- Uploading the same file twice (same hash) shows "duplicate" toast, no second row, orphan blob deleted
- User B in different org cannot see user A's uploads (server action filters on `session.user.orgId`)
- Inngest dashboard shows successful function runs
- Zero Supabase references remaining in `src/**`

## Risk Assessment
- **Risk:** Vercel Blob URL leakage. **Mitigation:** For SDS originals, use `access: 'public'` URLs but scope pathname behind unguessable id segment; for sensitive orgs, switch to private tokens (Phase 08 toggle).
- **Risk:** 25MB Vercel function body limit. **Mitigation:** Client-direct upload via `@vercel/blob/client` bypasses function body entirely.
- **Risk:** Inngest cold start. **Mitigation:** Acceptable for async jobs; document expected 1–3s enqueue delay.

## Security Considerations
- Token-generation endpoint always calls `requireOrg()` first.
- MIME sniff server-side: reject non-PDF in `onBeforeGenerateToken`.
- 25MB cap enforced both client-side and in `onBeforeGenerateToken`.
- `auditLog` on every upload (action + orgId + blob pathname).

## Next Steps
→ Phase 03: AI Extraction (Vercel AI SDK + Gemini)

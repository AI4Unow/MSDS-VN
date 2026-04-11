---
phase: 02
name: SDS Upload + Inngest Pipeline
week: 2
priority: P0
status: not-started
---

# Phase 02 — SDS Upload + Inngest Pipeline

## Context
- Brainstorm §5 "Request flow — SDS upload"
- Depends on: Phase 01 (auth/RLS/storage)

## Overview
Users upload SDS PDFs → stored in Supabase Storage → `sds_documents` row inserted → Inngest job enqueued. Extraction itself lives in Phase 03; this phase builds the transport.

## Requirements
- Drag-drop upload UI (single + batch) with progress
- Supabase Storage bucket `sds-files` (org-scoped paths)
- `sds_documents` table with status state machine
- Inngest app wired + first event dispatched
- SDS list view (table with filter + sort)
- SDS detail page stub (just metadata + file preview)

## Related Files
**Create:**
- `supabase/migrations/0002_sds_documents.sql`
- `src/app/(app)/sds/page.tsx` — list view
- `src/app/(app)/sds/[id]/page.tsx` — detail stub
- `src/app/(app)/sds/upload/page.tsx` — upload UI
- `src/components/sds/upload-dropzone.tsx`
- `src/components/sds/sds-table.tsx`
- `src/components/sds/sds-status-badge.tsx`
- `src/lib/storage/upload-sds.ts` — client-side signed upload
- `src/app/api/inngest/route.ts` — Inngest handler
- `src/inngest/client.ts`
- `src/inngest/functions/extract-sds.ts` — stub function (real logic in Phase 03)

**Modify:**
- `src/components/app-shell/sidebar.tsx` — activate SDS nav

## Data Model (migration 0002)
```sql
create type sds_status as enum (
  'pending', 'extracting', 'needs_review', 'ready', 'failed'
);

create table sds_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  file_url text not null,
  file_hash text not null,              -- sha256 for dedupe
  filename text not null,
  supplier text,
  revision_date date,
  source_lang text default 'en',
  version int default 1,
  status sds_status default 'pending',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on sds_documents(org_id, status);
create unique index on sds_documents(org_id, file_hash);

alter table sds_documents enable row level security;
create policy "org members" on sds_documents
  using (org_id = (select org_id from users where supabase_auth_id = auth.uid()));
```

## Implementation Steps
1. Write + apply migration 0002
2. Create Storage bucket `sds-files`, path pattern `{org_id}/{sds_id}/{filename}`, RLS policies for bucket (org members only)
3. Install Inngest: `pnpm add inngest`, add `src/inngest/client.ts`, mount `/api/inngest`
4. Build upload dropzone component (shadcn + react-dropzone)
5. Upload flow:
   - Compute sha256 client-side → dedupe check
   - Get signed upload URL from server action
   - Upload directly to Storage
   - Server action inserts `sds_documents` row with status=`pending`
   - Send Inngest event `sds.uploaded` with `sds_id`
6. Implement `extract-sds` Inngest function as a stub: set status → `extracting` → 2s sleep → `ready` (real logic in Phase 03)
7. Build SDS list view with status filter, pagination, Supabase realtime subscription for status updates
8. Build detail stub: PDF preview (iframe), metadata panel
9. Configure Inngest dev server for local testing
10. Register Inngest production endpoint + set `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` in Vercel

## Todo List
- [ ] Migration 0002 applied
- [ ] Storage bucket + policies
- [ ] Inngest client + handler route
- [ ] Upload dropzone UI
- [ ] sha256 dedupe
- [ ] Signed URL upload flow
- [ ] Stub extract-sds function (status transitions only)
- [ ] SDS list view with realtime
- [ ] SDS detail stub with PDF preview
- [ ] `pnpm build` green

## Success Criteria
- User can upload a PDF from UI → appears in list within 5s → status transitions pending → extracting → ready
- Uploading the same file twice (same hash) shows "duplicate" toast, no second row
- User B in different org cannot see user A's uploads (RLS verified)
- Inngest dashboard shows successful function runs

## Risk Assessment
- **Risk:** Large PDF uploads (50MB+) fail on Vercel. **Mitigation:** Direct-to-Storage signed URL upload (bypasses Vercel body limit).
- **Risk:** Inngest cold start latency. **Mitigation:** Acceptable for async jobs; document expected 1–3s enqueue delay.

## Security Considerations
- Signed upload URLs expire in 5 minutes
- File hash dedupe before auth check rejected early (DoS protection)
- PDF max size: 25MB enforced server-side
- MIME sniff server-side: reject non-PDF

## Next Steps
→ Phase 03: AI Extraction

---
phase: 08
name: Organization Profile + Access Settings
weeks: 10
priority: P1
status: needs-rework
---

# Phase 08 — Organization Profile + Access Settings

## Context
- Brainstorm §4 (MVP feature #6)
- Depends on: Phase 01 (base org schema + `docs/design-guidelines.md`), Phase 06 (card access mode)

## Frontend Build Protocol
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before UI work. Specifics: settings pages = conservative editorial two-column (label left, input + helper text right); no card-stack layout (anti-slop at density 6); logo upload previewer shows real dimensions; `cardAccessMode` toggle uses a segmented control, not a checkbox, with a plain-Vietnamese explanation of the tradeoff inline (this is a security-meaningful choice — no jargon); audit log viewer = dense table with sticky header + keyboard scroll.

## Overview
Keep the MVP single-user-per-org. No invites, no org switching, no member management. Surface org branding and access settings only.

## Requirements
- Organization name and locale shown in settings
- Logo upload / display
- `card_access_mode` toggle: `public_token` or `login_required`
- Audit log viewer for the current org
- No team membership, invite flow, or seat management

## Related Files
**Modify:**
- `src/lib/db/schema/organizations.ts` — add `logoUrl`, `cardAccessMode`, `settings`
- `drizzle/migrations/0007_org_profile.sql` — generated
- `src/app/(app)/settings/org/page.tsx`
- `src/app/(app)/settings/org/actions.ts`
- `src/app/(app)/settings/org/card-access-form.tsx`
- `src/app/(app)/settings/audit/page.tsx`
- `src/app/(app)/dashboard/page.tsx`

**Delete:**
- `supabase/migrations/0008_orgs_and_invites.sql`
- `supabase/migrations/0011_remove_membership_roles.sql`

## Data Model (Drizzle — extend `src/lib/db/schema/organizations.ts`)
```ts
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locale: text('locale').default('vi').notNull(),
  plan: text('plan').default('free').notNull(),              // display-only at MVP
  logoBlobUrl: text('logo_blob_url'),                         // Vercel Blob URL
  cardAccessMode: text('card_access_mode')
    .default('public_token')
    .notNull()
    .$type<'public_token' | 'login_required'>(),
  settings: jsonb('settings').default({ defaultLocale: 'vi' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```
The `users.role` column introduced in earlier drafts stays deleted — single-org-per-user, no membership model.

## Implementation Notes
1. Render org profile settings from the current user org (server action reads via `requireOrg()`).
2. Allow the current authenticated user to change `cardAccessMode`; write via Drizzle `update` + `auditLog()`.
3. Keep audit browsing scoped to the current org.
4. Keep the public safety-card route capable of redirecting to login when the org requires it.
5. Logo upload flows through Vercel Blob (`access: 'public'`, pathname `{orgId}/branding/logo-{timestamp}.{ext}`); store URL on `organizations.logoBlobUrl`.

## Success Criteria
- Settings page shows org profile, logo, locale, and card access mode.
- Public safety cards can be public or login-gated per org.
- No invite, member, or org-switch UI remains in the app.

## Risks
- The single-org model is intentional. Do not reintroduce team membership or seat counts in later phases unless the product direction changes.

## Next Steps
→ Phase 09: Billing + Launch

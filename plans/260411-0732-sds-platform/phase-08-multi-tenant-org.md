---
phase: 08
name: Multi-Tenant Org + Invites + Roles
week: 10
priority: P1
status: not-started
---

# Phase 08 — Multi-Tenant Org + Invites + Roles

## Context
- Brainstorm §4 (MVP feature #6), §5 (`organizations`, `users`, `audit_log` tables)
- Depends on: Phase 01 (base org schema)

## Overview
Turn single-user orgs into real teams. Invites, roles, per-org settings. Foundation for contract expansion (brainstorm: "multi-seat = contract expansion"). **Note:** Basic audit_log table + helper already exist from Phase 01 (red team rec); this phase extends audit coverage to all mutations + adds audit log viewer UI.

## Requirements
- Org creation separate from personal auto-org
- Email invites with token links
- Roles: owner / admin / member / viewer (brainstorm §5)
- Per-org settings: default locale, `card_access_mode` (`public_token` default vs `login_required`), logo upload — UQ #7 resolved in Phase 06
- Audit log: all writes tracked (who / what / when)
- Org switcher in user menu

## Related Files
**Create:**
- `supabase/migrations/0008_orgs_and_audit.sql`
- `src/app/(app)/settings/org/page.tsx`
- `src/app/(app)/settings/members/page.tsx`
- `src/app/(app)/settings/billing/page.tsx` — stub for Phase 09
- `src/app/(app)/accept-invite/[token]/page.tsx`
- `src/lib/auth/invite.ts`
- `src/lib/auth/require-role.ts` — server-side role guard
- `src/lib/audit/log.ts`
- `src/components/org/member-table.tsx`
- `src/components/org/invite-dialog.tsx`
- `src/components/app-shell/org-switcher.tsx`

**Modify:**
- `src/components/app-shell/user-menu.tsx` — org switcher
- All mutating server actions — add `await auditLog(...)`

## Data Model (migration 0008)
```sql
-- extend organizations
alter table organizations add column logo_url text;
alter table organizations add column card_access_mode text not null default 'public_token' check (card_access_mode in ('public_token','login_required'));
alter table organizations add column settings jsonb default '{"default_locale": "vi"}'::jsonb;

create table org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','member','viewer')),
  token text unique not null,
  invited_by uuid not null references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
create index on org_invites(token);
create index on org_invites(email);

create table audit_log (
  id bigserial primary key,
  org_id uuid not null references organizations(id),
  user_id uuid references auth.users(id),
  action text not null,                 -- "sds.uploaded", "card.generated", "member.invited", ...
  target_type text,
  target_id text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  ts timestamptz default now()
);
create index on audit_log(org_id, ts desc);

alter table org_invites enable row level security;
alter table audit_log enable row level security;
create policy "org members read" on org_invites for select using (org_id = (select org_id from users where supabase_auth_id = auth.uid()));
create policy "org admins write" on org_invites for all using (
  exists(select 1 from users where supabase_auth_id = auth.uid() and org_id = org_invites.org_id and role in ('owner','admin'))
);
create policy "org members read audit" on audit_log for select using (org_id = (select org_id from users where supabase_auth_id = auth.uid()));
-- audit_log writes via service role only (no client write policy)
```

## Implementation Steps
1. Apply migration 0008
2. Implement `auditLog()` helper (org_id, user_id, action, target, metadata) → insert via service role
3. Add `auditLog` calls to: SDS upload, extraction complete, field edit, card generated, card viewed, member invited/removed, role changed, settings changed, login
4. Build org creation flow (separate from auto-personal-org)
5. Build invite system:
   - Admin invites email + role → insert `org_invites` with token + 7d expiry → send email via Resend
   - Invitee receives email → clicks `/accept-invite/{token}` → if logged in: add to `users` table, redirect to new org; if not: sign up first, then accept
6. Build members page: table of users with role select (owner can change), remove button (with confirmation)
7. Build org settings page: name, logo upload, default locale, `card_access_mode` radio (`public_token` | `login_required`) with inline copy explaining the tradeoff + token-rotation button per card
8. Build org switcher in user menu: list orgs user belongs to, current highlighted, click → update active org
9. Implement `requireRole()` server helper + apply to admin-only routes (wiki editor, settings, billing)
10. Audit log viewer page: `/settings/audit` — filterable by action/user/date, export CSV
11. RLS audit: re-test all tables with multi-org user; user in org A+B cannot leak data between them

## Todo List
- [ ] Migration 0008
- [ ] auditLog helper + apply across all mutations
- [ ] Invite flow (email via Resend)
- [ ] Accept invite page
- [ ] Members management UI
- [ ] Org settings page
- [ ] Org switcher
- [ ] requireRole guard
- [ ] Audit log viewer + CSV export
- [ ] RLS multi-org test
- [ ] `pnpm build` green

## Success Criteria
- Owner invites a member → email arrives → member accepts → sees SDS list
- Member (non-admin) cannot access wiki editor or org settings
- Audit log captures every state-changing action
- Org switcher works for user in 2+ orgs without data leakage
- Removing a user revokes access immediately

## Risk Assessment
- **Risk:** Role escalation bug leaks data. **Mitigation:** RLS policies use `users.role` lookup, not JWT claims (harder to forge); manual multi-user test matrix.
- **Risk:** Email deliverability. **Mitigation:** Resend with verified domain; fallback copy-invite-link UX.

## Security Considerations
- Invite tokens: nanoid 32 chars, 7-day expiry, single-use
- Audit log is append-only (no update/delete policies)
- Owner cannot be demoted (last-owner check)
- Email on invite signup uses double opt-in

## Next Steps
→ Phase 09: Billing + Launch

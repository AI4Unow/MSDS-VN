---
phase: 06
name: VI Safety Card Generator (MOIT + QR)
weeks: 7-8
priority: P0-killer
status: not-started
---

# Phase 06 — VI Safety Card Generator ⭐

## Context
- Brainstorm §4 (killer feature #3), §5 "Request flow — Safety Card generation"
- Regulatory basis: **Circular 01/2026/TT-BCT Appendix I — Mẫu Phiếu an toàn hóa chất** (SDS template, 16 sections with explanation column)
- Appendix XIX: 10 priority hazardous chemicals in products requiring mandatory disclosure (flag on safety cards)
- Depends on: Phase 03 (extraction), Phase 05 (MOIT template wiki page)
- Asia Shine sample card (from Phase 00 Todo) — **MUST OBTAIN BEFORE STARTING**

## Overview
**This is the feature people pay for.** Translate extracted English SDS into MOIT-compliant Vietnamese safety card (Phiếu an toàn hóa chất). Render as PDF + mobile QR view. Must be legally-aligned — review by EHS consultant on retainer.

## Requirements
- MOIT-compliant VI safety card template (from **Circular 01/2026/TT-BCT Appendix I**)
- Claude Sonnet translation pipeline with locked MOIT terminology glossary
- PDF rendering (react-pdf or Puppeteer on Vercel)
- QR code → public mobile-friendly view (no login, token-gated)
- Versioning: regenerate on extraction edit
- EHS consultant reviews first 50 cards (brainstorm risk mitigation)

## MOIT Terminology Glossary (must-lock before translation)
- SDS = "Phiếu an toàn hóa chất"
- Hazard identification = "Nhận biết nguy hại"
- First aid = "Biện pháp sơ cứu"
- PPE = "Phương tiện bảo vệ cá nhân"
- H-codes: keep H-code + VN translation per GHS VN official glossary
- Pictogram names: standard VN translations from Decree 42/2020/ND-CP
- Store glossary in `src/lib/safety-card/moit-glossary.ts` (single source of truth)

## Related Files
**Create:**
- `supabase/migrations/0006_safety_cards.sql`
- `src/lib/safety-card/moit-glossary.ts` — EN→VI terminology lock
- `src/lib/safety-card/translator.ts` — Claude pipeline
- `src/lib/safety-card/template.tsx` — react-pdf template matching MOIT Appendix 9
- `src/lib/safety-card/qr-generator.ts` — signed token QR
- `src/lib/safety-card/render-pdf.ts`
- `src/inngest/functions/generate-safety-card.ts`
- `src/app/(app)/sds/[id]/safety-card/page.tsx` — generate/preview UI
- `src/app/public/card/[token]/page.tsx` — public mobile view (no auth)
- `src/app/api/safety-cards/[id]/pdf/route.ts` — signed PDF download
- `wiki/templates/moit-safety-card-template.md` — reference doc (created in Phase 05)

**Modify:**
- `src/components/sds/section-tabs.tsx` — add "Generate VI Card" button
- `src/components/sds/sds-table.tsx` — add card status column

## Data Model (migration 0006)
```sql
create table safety_cards (
  id uuid primary key default gen_random_uuid(),
  sds_id uuid not null references sds_documents(id) on delete cascade,
  org_id uuid not null references organizations(id),
  locale text not null default 'vi',
  pdf_url text,
  qr_token text unique not null,        -- url-safe random 32-char
  template_version text not null,       -- "moit-v1-2026-04"
  source_extraction_id uuid references sds_extractions(id),
  status text default 'pending' check (status in ('pending','generating','ready','failed','superseded')),
  reviewed_by_consultant boolean default false,
  generated_at timestamptz default now(),
  superseded_at timestamptz
);
create index on safety_cards(org_id, status);
create index on safety_cards(sds_id) where status = 'ready';

alter table safety_cards enable row level security;
create policy "org members" on safety_cards
  using (org_id = (select org_id from users where supabase_auth_id = auth.uid()));
-- public mobile view uses service-role bypass via /public/card/[token] route (token is the auth)
```

## Implementation Steps
1. **Prep (blocking):** Obtain sample compliant VI safety card from Asia Shine (Phase 00 deliverable). Study exact layout + sections.
2. Apply migration 0006
3. Author `moit-glossary.ts` — locked EN→VI mappings for all MOIT-required terms. **Review with EHS consultant.**
4. Build `template.tsx` with react-pdf matching **MOIT Appendix I layout (Circular 01/2026)**:
   - Header: company name + logo slot + doc ID + version
   - Sections 1–16 mapped per Appendix I table (all 16 sections defined; safety card may show subset: 1,2,4,5,6,7,8 per operational needs)
   - Pictograms (GHS)
   - Signal word in Vietnamese
   - Footer: generation date + QR code + disclaimer
5. Implement `translator.ts`:
   - Input: `sds_extractions.sections` (subset)
   - Pass glossary + target section to Claude Sonnet
   - System prompt: "You translate chemical safety information from English to Vietnamese using EXCLUSIVELY the provided MOIT glossary. If a term is not in the glossary, keep English with note. Do not paraphrase hazard statements."
   - Cache system prompt + glossary
6. Implement `generate-safety-card.ts` Inngest function:
   - Fetch extraction → translate sections 1,2,4,5,6,7,8 → render PDF → upload to Storage → insert row
   - Generate QR token (nanoid 32)
   - Update status → `ready`
7. Build `/public/card/[token]/page.tsx`:
   - Server component, no auth
   - Fetch card by token only (token = capability)
   - Mobile-first layout, print-friendly
   - Brainstorm UQ #7: default to public-by-token (warehouse worker UX wins), but make it a per-org setting (default ON, settings toggle in Phase 08)
8. QR code generation: use `qrcode` npm package, encode `{origin}/public/card/{token}`
9. SDS detail page: "Generate VI Card" button → shows progress → download PDF + share QR image
10. Versioning: when `sds_extractions` updates (user edits in review), mark existing cards `superseded`, trigger regenerate
11. Asia Shine dry run: generate 20 cards from 20 real SDSs, print, physically hang in warehouse, collect feedback
12. EHS consultant reviews first 50 cards for legal compliance before public beta

## Todo List
- [ ] Obtain Asia Shine sample card (blocker)
- [ ] Migration 0006
- [ ] MOIT glossary (consultant-reviewed)
- [ ] react-pdf template matching Appendix I (Circular 01/2026)
- [ ] Translator pipeline with glossary enforcement
- [ ] Inngest generate function
- [ ] Public mobile view (token-gated)
- [ ] QR code generation
- [ ] SDS page "Generate VI Card" UX
- [ ] Versioning on extraction edit
- [ ] Generate 20 Asia Shine cards
- [ ] EHS consultant review of first 50 cards
- [ ] `pnpm build` green

## Success Criteria
- Generate VI safety card in <30 seconds per SDS
- 20 real Asia Shine cards generated, printed, physically hung
- EHS consultant approves first 50 cards as MOIT-compliant (≤5% error rate)
- Mobile QR view loads <2s on 3G (tested via Chrome throttling)
- Regenerating after an edit marks old card `superseded` and keeps audit trail

## Risk Assessment
- **Risk (high):** Mistranslation of hazard statements → legal liability. **Mitigation:** Locked glossary + consultant review gate + EULA disclaimer + E&O insurance before beta.
- **Risk:** react-pdf layout doesn't match MOIT Appendix I exactly. **Mitigation:** Appendix I is a content specification (table format), not a fixed PDF layout — flexible rendering is compliant; still verify with EHS consultant.
- **Risk:** Public QR leaks chemical inventory. **Mitigation:** Per-org toggle, token rotation on demand, optional login gate.

## Security Considerations
- QR tokens are capabilities — rotate on org demand
- PDF storage: public read via signed URL only (5-minute expiry for download; separate long-lived URL for mobile view)
- Audit log every card generation + view (brainstorm `audit_log` table)

## Next Steps
→ Phase 07: Compliance Chat (consumes same wiki + extractions)

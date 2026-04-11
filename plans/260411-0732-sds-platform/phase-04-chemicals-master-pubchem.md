---
phase: 04
name: Chemicals Master (PubChem) + Search
week: 5
priority: P0
status: not-started
---

# Phase 04 — Chemicals Master + PubChem Enrichment + Search

## Context
- Brainstorm §5 (data model `chemicals`, `sds_chemicals`), MVP feature #5
- Depends on: Phase 03 (extraction produces CAS list)

## Overview
Global `chemicals` master table keyed by CAS. PubChem REST API enrichment. Link extracted SDS components to chemical master. Full-text search across SDSs and chemicals.

> **2026 regulatory hook:** Circular 01/2026/TT-BCT **Appendix XIX** lists 10 priority hazardous chemicals in products requiring mandatory disclosure: Acetone, Cadmium, Chromium(VI), Formaldehyde, Hydrogen chloride, Lead, Mercury, Methanol, Sulfuric acid, Toluene. These MUST be seeded first with `vn_restricted=true` (or more specifically `vn_appendix_xix=true`) and shown as priority in UI.

## Requirements
- `chemicals` table (global, read-only for users)
- `sds_chemicals` join table (weight %, is_main)
- PubChem enrichment: auto-fetch for unknown CAS on extraction
- CAS number validation (check-digit algorithm)
- Full-text search: SDS name + supplier + chemical name + CAS across user's org
- Chemical detail page (global, like Wikipedia for chemicals)

## Related Files
**Create:**
- `supabase/migrations/0004_chemicals.sql`
- `src/lib/chem/cas-validator.ts` — check-digit algorithm
- `src/lib/chem/pubchem-client.ts` — REST wrapper
- `src/lib/chem/enrich-chemical.ts` — orchestrates PubChem fetch + insert
- `src/inngest/functions/enrich-chemical.ts` — async enrichment
- `src/app/(app)/chemicals/page.tsx` — search + list
- `src/app/(app)/chemicals/[cas]/page.tsx` — detail
- `src/components/chem/cas-lookup.tsx` — type-ahead
- `src/components/search/global-search.tsx` — cmd-k search dialog
- `src/app/api/search/route.ts` — unified search endpoint

**Modify:**
- `src/inngest/functions/extract-sds.ts` — after extraction, enqueue enrichment per new CAS

## Data Model (migration 0004)
```sql
create table chemicals (
  cas_number text primary key,          -- "108-88-3"
  ec_number text,
  pubchem_cid int,
  iupac_name text,
  common_name text,
  synonyms text[],
  molecular_formula text,
  molecular_weight numeric,
  ghs jsonb,                            -- {pictograms: [], h_codes: [], p_codes: []}
  hazards jsonb,                        -- physical, health, environmental arrays
  physical jsonb,                       -- boiling_point, flash_point, etc.
  reach_svhc boolean default false,
  vn_restricted boolean default false,  -- Decree 24/2026/ND-CP restricted chemicals
  vn_appendix_xix boolean default false, -- Circular 01/2026 Appendix XIX priority disclosure
  vn_special_control_group int,         -- Decree 24/2026 Group 1 or 2, null if not listed
  source text default 'pubchem',
  updated_at timestamptz default now()
);
create index on chemicals using gin (synonyms);
create index on chemicals using gin (to_tsvector('simple', coalesce(iupac_name,'') || ' ' || coalesce(common_name,'')));

create table sds_chemicals (
  sds_id uuid not null references sds_documents(id) on delete cascade,
  cas_number text not null references chemicals(cas_number),
  weight_percent numeric,
  is_main boolean default false,
  primary key (sds_id, cas_number)
);

-- chemicals table: public read, no write from client
alter table chemicals enable row level security;
create policy "public read" on chemicals for select using (true);
-- sds_chemicals: org-scoped via sds_documents join
alter table sds_chemicals enable row level security;
create policy "org members" on sds_chemicals
  using (exists(select 1 from sds_documents where id = sds_id and org_id = (select org_id from users where supabase_auth_id = auth.uid())));
```

## Implementation Steps
1. Apply migration 0004
2. Implement CAS check-digit validator (well-known algorithm: sum of digits * position mod 10)
3. Implement PubChem client: `/rest/pug/compound/name/{name}/JSON`, `/rest/pug/compound/cid/{cid}/JSON`, rate-limit to 5 req/sec (PubChem policy)
4. Implement `enrich-chemical.ts`:
   - Input: CAS
   - Check if chemicals row exists → return if fresh (<30d)
   - Fetch PubChem by CAS → CID → compound properties
   - Merge GHS data from PubChem classification
   - Upsert chemicals row
5. Modify `extract-sds.ts`: after inserting `sds_extractions`, parse section_3 components → validate CAS → enqueue `chemical.enrich` event for each unknown
6. Build Inngest `enrich-chemical` function
7. Build chemicals list page: search by CAS / name, paginated
8. Build chemical detail page: identification, GHS, hazards, physical props, list of SDSs containing it (filtered by org)
9. Build global search (cmd-k): fuzzy across SDSs (filename + supplier) + chemicals (CAS + name) + (Phase 05) wiki pages
10. Unified search API: Postgres `to_tsvector` + `ts_rank` + `unaccent` extension (handles VN diacritics)
11. **Seed Appendix XIX priority list first** (10 chemicals): Acetone (67-64-1), Cadmium (7440-43-9), Chromium(VI) (18540-29-9), Formaldehyde (50-00-0), HCl (7647-01-0), Lead (7439-92-1), Mercury (7439-97-6), Methanol (67-56-1), H₂SO₄ (7664-93-9), Toluene (108-88-3) — all flagged `vn_appendix_xix=true`
12. Seed 200 common lab chemicals via PubChem batch to prime cache

## Todo List
- [ ] Migration 0004
- [ ] CAS validator
- [ ] PubChem client with rate limit
- [ ] Enrichment Inngest function
- [ ] Extraction → enqueue enrichment hook
- [ ] Chemicals list page
- [ ] Chemical detail page
- [ ] Global cmd-k search
- [ ] Unified search API with ts_rank
- [ ] Seed Appendix XIX 10 priority chemicals (flagged)
- [ ] Seed 200 common chemicals
- [ ] `pnpm build` green

## Success Criteria
- Uploading a new SDS with 5 chemicals auto-enriches all 5 from PubChem within 60s
- Searching "toluene" or "108-88-3" finds the chemical + all SDSs containing it
- CAS validator rejects invalid numbers (test vector: 108-88-3 valid, 108-88-4 invalid)
- Chemical detail page shows GHS pictograms + H-codes

## Risk Assessment
- **Risk:** PubChem API downtime or rate limit. **Mitigation:** Retry with backoff; mark chemical as `source='unknown'` and allow manual override.
- **Risk:** CAS extracted by Claude doesn't exist in PubChem (obscure chemicals). **Mitigation:** Still create chemicals row from SDS data, flag `source='sds-only'`.
- **Risk:** VN regulatory flag (`vn_restricted`) cannot be set from PubChem. **Mitigation:** Populated manually from wiki pages in Phase 05.

## Next Steps
→ Phase 05: LLM Wiki (populates VN regulatory data)

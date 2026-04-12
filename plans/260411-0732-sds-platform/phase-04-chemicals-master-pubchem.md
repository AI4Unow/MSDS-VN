---
phase: 04
name: Chemicals Master (PubChem) + Search
week: 5
priority: P0
status: needs-rework
---

# Phase 04 — Chemicals Master + PubChem Enrichment + Search

## Context
- Brainstorm §5 (data model `chemicals`, `sds_chemicals`), MVP feature #5
- Depends on: Phase 03 (extraction produces CAS list), Phase 01 `docs/design-guidelines.md`
- **Stack migration (2026-04-12):** Schema now defined via Drizzle; RLS removed (app-level `requireOrg()` guards); all references to `auth.uid()` / `supabase_auth_id` deleted.

## Frontend Build Protocol
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before UI work. Specifics: chemicals list = dense sortable table (no card grid — anti-slop); chemical detail page = editorial long-form layout, GHS pictograms as official SVGs with visible hazard labels (never color-only — a11y rule); Appendix XIX priority chemicals get a subtle amber left-border stripe + `aria-label`, never a "⚠️" emoji (anti-slop: no emoji as icon); cmd-k search must open <100 ms, use Phosphor icons, and return results grouped by type (SDS / Chemicals / Wiki) with Vietnamese diacritic-insensitive matching.

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
- `src/lib/db/schema/chemicals.ts` — Drizzle schema
- `drizzle/migrations/0003_chemicals.sql` — generated
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

## Data Model (Drizzle — `src/lib/db/schema/chemicals.ts`)
```ts
export const chemicals = pgTable('chemicals', {
  casNumber: text('cas_number').primaryKey(),         // "108-88-3"
  ecNumber: text('ec_number'),
  pubchemCid: integer('pubchem_cid'),
  iupacName: text('iupac_name'),
  commonName: text('common_name'),
  synonyms: text('synonyms').array(),
  molecularFormula: text('molecular_formula'),
  molecularWeight: numeric('molecular_weight'),
  ghs: jsonb('ghs'),                                   // {pictograms, h_codes, p_codes}
  hazards: jsonb('hazards'),                           // physical, health, environmental
  physical: jsonb('physical'),                         // boiling_point, flash_point, ...
  reachSvhc: boolean('reach_svhc').default(false).notNull(),
  vnRestricted: boolean('vn_restricted').default(false).notNull(),      // Decree 24/2026
  vnAppendixXix: boolean('vn_appendix_xix').default(false).notNull(),    // Circular 01/2026 App. XIX
  vnSpecialControlGroup: integer('vn_special_control_group'),            // Decree 24/2026 group 1/2
  source: text('source').default('pubchem').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  synonymsIdx: index('chemicals_synonyms_gin').using('gin', t.synonyms),
  searchIdx: index('chemicals_search_gin').using(
    'gin',
    sql`to_tsvector('simple', coalesce(${t.iupacName},'') || ' ' || coalesce(${t.commonName},''))`,
  ),
}));

export const sdsChemicals = pgTable('sds_chemicals', {
  sdsId: uuid('sds_id').notNull().references(() => sdsDocuments.id, { onDelete: 'cascade' }),
  casNumber: text('cas_number').notNull().references(() => chemicals.casNumber),
  weightPercent: numeric('weight_percent'),
  isMain: boolean('is_main').default(false).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.sdsId, t.casNumber] }) }));
```

**Access pattern (no RLS):**
- `chemicals` is a globally-readable master table — all server actions may read without org filtering.
- `sds_chemicals` is read via a join against `sds_documents`; the caller must first load the parent `sds_documents` row with `requireOrg()` filtering (`.where(eq(sdsDocuments.orgId, orgId))`), so access to `sds_chemicals` flows through that check.
- No writes to `chemicals` from client — enrichment runs only in the `enrich-chemical` Inngest function (server-side, service-level).

## Implementation Steps
1. Add Drizzle schema in `src/lib/db/schema/chemicals.ts`; `drizzle-kit generate` → migration 0003; apply.
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
- [ ] Drizzle schema + migration 0003 (`chemicals`, `sds_chemicals`)
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
- **Risk:** CAS extracted by Gemini doesn't exist in PubChem (obscure chemicals). **Mitigation:** Still create chemicals row from SDS data, flag `source='sds-only'`.
- **Risk:** VN regulatory flag (`vn_restricted`) cannot be set from PubChem. **Mitigation:** Populated manually from wiki pages in Phase 05.

## Next Steps
→ Phase 05: LLM Wiki (populates VN regulatory data)

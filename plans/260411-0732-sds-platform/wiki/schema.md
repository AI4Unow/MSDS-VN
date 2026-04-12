---
type: wiki-schema
date: 2026-04-11
role: meta
version: 0.1
---

# LLM Wiki Schema — Regulatory Knowledge Base

This file defines the format, conventions, and workflows for the regulatory LLM Wiki that powers the compliance Q&A chat feature. It is the `CLAUDE.md` equivalent for the wiki — every ingest/query/maintenance operation reads this file first.

Based on Karpathy's LLM Wiki pattern: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

---

## 1. Purpose

A compounding, LLM-maintained knowledge base of chemical regulatory information. Three goals:

1. **Ground the compliance chat** with citation-backed answers instead of hallucinated ones
2. **Accumulate knowledge** — every user SDS upload enriches the wiki for all future queries
3. **Create defensible moat** — versioned, auditable, jurisdiction-aware knowledge that competitors cannot easily replicate

---

## 2. Three-Layer Architecture

### Layer 1 — Raw Sources (immutable)
Stored at `raw-sources/` (git-tracked during MVP, moved to Vercel Blob post-MVP).
Examples: `raw-sources/vn-circular-01-2026-tt-bct.docx`, `raw-sources/ghs-rev10-purple-book.pdf`, `raw-sources/echa-svhc-list-2026-01.csv`, `raw-sources/pubchem-compound-108-88-3.json`.
**LLM never modifies these.** They are the ground truth.

### Layer 2 — Wiki Pages (LLM-maintained)
Stored at `wiki/**/*.md` and mirrored in Postgres `wiki_pages` table.
Categories:
- `regulations/` — one file per regulation (REACH, CLP, GHS, VN Circular 01/2026, etc.)
- `chemicals/` — one file per CAS number
- `hazards/` — one file per H-statement / hazard class
- `countries/` — per-country regulatory overview (VN, TH, ID, EU, US)
- `topics/` — cross-cutting topics (storage compatibility, first aid, transport modes)
- `templates/` — official templates (MOIT safety card, ADR transport doc)

### Layer 3 — Schema & Index (this + related files)
- `schema.md` — this file
- `index.md` — content-oriented catalog (LLM reads first during queries)
- `log.md` — append-only ingest/query/maintenance log

---

## 3. Directory Layout

```
wiki/
├── schema.md                                       # this file
├── index.md                                        # content catalog
├── log.md                                          # append-only log
├── regulations/
│   ├── vn-circular-01-2026-tt-bct.md
│   ├── vn-law-on-chemicals-2025.md
│   ├── vn-decree-26-2026-nd-cp.md
│   ├── eu-reach-main.md
│   ├── eu-reach-svhc-list.md
│   ├── eu-reach-annex-xiv-authorization.md
│   ├── eu-reach-annex-xvii-restriction.md
│   ├── eu-clp-regulation.md
│   ├── ghs-rev-10.md
│   └── ...
├── chemicals/
│   ├── 108-88-3-toluene.md
│   ├── 7647-01-0-hydrochloric-acid.md
│   └── ...
├── hazards/
│   ├── h225-flammable-liquid-category-2.md
│   ├── h315-skin-irritation-category-2.md
│   ├── h350-carcinogenicity-category-1a.md
│   └── ...
├── countries/
│   ├── vietnam-overview.md
│   ├── thailand-overview.md
│   └── indonesia-overview.md
├── topics/
│   ├── storage-incompatibility-matrix.md
│   ├── vn-import-chemical-workflow.md
│   ├── transport-dangerous-goods-modes.md
│   └── ghs-16-sections-structure.md
└── templates/
    ├── moit-safety-card-template.md   # Appendix I of Circular 01/2026/TT-BCT
    └── adr-transport-declaration-template.md
```

---

## 4. Page Format Spec

Every wiki page is a Markdown file with YAML frontmatter.

### Common frontmatter fields (all pages)

```yaml
---
type: chemical | regulation | hazard | country | topic | template
slug: <kebab-case-identifier>
title: <human-readable title>
category: <parent category>
created: <ISO date>
updated: <ISO date>
sources: [<list of raw-sources paths or URLs>]
cross_refs: [<list of related wiki slugs>]
confidence: high | medium | low
locale: en | vi | multi
---
```

### Additional fields by `type`

#### `type: chemical`
```yaml
cas_number: "108-88-3"
ec_number: "203-625-9"
un_number: "1294"
pubchem_cid: 1140
molecular_formula: "C7H8"
synonyms: ["Methylbenzene", "Phenylmethane", "Toluol"]
ghs_classifications: ["H225", "H304", "H315", "H336", "H361d", "H373", "H412"]
signal_word: "Danger"
pictograms: ["GHS02", "GHS07", "GHS08"]
reach_svhc: false
vn_restricted: false
```

#### `type: regulation`
```yaml
jurisdiction: vn | eu | us | global
regulation_id: "Circular 01/2026/TT-BCT"
issuing_body: "Ministry of Industry and Trade (MOIT)"
effective_date: 2026-01-17
supersedes: ["Circular 32/2017/TT-BCT", "Circular 17/2022/TT-BCT"]
scope: "Chemical activity management, SDS template, classification, hazardous chemicals in products"
```

#### `type: hazard`
```yaml
h_code: "H225"
category: "Flammable liquid, Category 2"
ghs_class: "Physical"
signal_word: "Danger"
pictogram: "GHS02"
p_codes: ["P210", "P233", "P240", "P241", "P242", "P243", "P280", "P303+P361+P353", "P370+P378", "P403+P235", "P501"]
```

---

## 5. Page Body Structure

Every page body follows a consistent template per type.

### Chemical page body template
```markdown
# {Chemical name} ({CAS})

## Summary
{2–3 sentence overview: what it is, primary uses, key hazards}

## Identification
- CAS: ...
- EC: ...
- UN: ...
- Synonyms: ...

## Physical properties
{boiling point, flash point, solubility — if known}

## Hazards (GHS)
{list H-statements with links to hazard pages}

## Regulatory status
- **EU REACH**: {SVHC? Annex XIV? Annex XVII? None?}
- **EU CLP**: {harmonized classification? notified?}
- **VN Circular 01/2026/TT-BCT**: {listed in Appendix XIX? subject to disclosure? restricted under Decree 24?}
- **VN Law on Chemicals 2025**: {covered category? special control Group 1/2?}
- **OSHA HazCom 2012 (US)**: {notes}

## Safe handling
{storage, ventilation, PPE — neutral recommendations}

## First aid
{per GHS section 4 conventions}

## Incompatibilities
{what it can't be stored near, per GHS section 10}

## VN language notes
{VN translation of common terms, MOIT-specific terminology}

## Sources
- {list with confidence per source}

## Cross-references
- Related chemicals: [[chemicals/...]]
- Hazards: [[hazards/h225-...]]
- Regulations: [[regulations/...]]
```

### Regulation page body template
```markdown
# {Regulation title}

## Scope
{what + who + where + when}

## Key obligations (for chemical handlers)
{numbered list of duties}

## Key definitions
{term + definition + source article}

## Penalties
{non-compliance consequences if stated}

## How it applies to SDS management
{practical application — this is the most important section for our product}

## Interactions with other regulations
{cross-references}

## Common misinterpretations
{things people get wrong — flagged by LLM during ingest}

## Sources
- Official text: {raw-sources/...}
- Guidance notes: {URLs}

## Cross-references
- [[chemicals/...]] for examples
- [[topics/vn-import-chemical-workflow]] for practical workflow
```

### Hazard page body template
```markdown
# {H-code} — {category name}

## Classification criteria
{per GHS Purple Book}

## Signal word
{Danger / Warning}

## Pictogram
{GHS01–09}

## P-codes (precautionary)
{list}

## Example chemicals
- [[chemicals/...]]

## VN language equivalents
{official MOIT translation}

## Sources
- [[regulations/ghs-rev-10]]
```

---

## 6. Cross-Reference Conventions

- Use `[[category/slug]]` for internal wiki links
- Use `[text](URL)` for external sources
- Every page must list cross-refs in `cross_refs:` frontmatter AND in body `## Cross-references` section
- Orphan pages (no incoming links) are flagged during maintenance lint

---

## 7. Ingest Workflow (when a new SDS is uploaded)

```
1. User uploads PDF
2. AI extracts 16 GHS sections → sections jsonb in sds_extractions table
3. For each chemical (CAS) found in section 3:
   a. Check wiki_pages for chemicals/<cas>-<slug>.md
   b. If missing:
      - Fetch PubChem data (CID, GHS, synonyms)
      - Generate new chemical page using template
      - Insert into wiki_pages
   c. If present:
      - Compare new SDS data vs wiki page data
      - If wiki is more confident: no change
      - If new SDS adds info: LLM merges + updates wiki page
      - If contradiction: flag to review_queue
4. Revise related pages (Karpathy compounding step): for each new/updated cross-ref, append to the target hazard/regulation/country page's "Common chemicals" / "Referenced by" section. Bound ≤15 page revisions per ingest.
5. Update index.md if new chemical added
6. Prepend to log.md with consistent prefix: `INGEST {iso-date} sds=<id> cas=<cas> pages-touched=<n>` (newest on top, no truncation — full history retained; lint/query prompts slice `contentMd[0:8000]`)
```

### LLM ingest prompt skeleton
```
You are maintaining a regulatory wiki.

New source: SDS for <chemical>, CAS <cas>, from <supplier>.
Extracted data:
<sections jsonb>

Current wiki page (if exists):
<current page content>

Task:
1. If no page exists, create one using the chemical page template in schema.md
2. If page exists, merge new info. Preserve higher-confidence claims.
3. Flag any contradictions in a ## Contradictions section
4. Update cross_refs: to include any new hazards or regulations mentioned
5. Output the full updated markdown.

Schema: <contents of schema.md>
```

---

## 8. Query Workflow (Karpathy Pattern — Index-Driven)

```
1. User: "Is toluene restricted under Vietnam law?"
2. LLM reads wiki index.md via tool-use
3. LLM identifies relevant pages from index
4. LLM reads top 3-5 wiki pages in full via tool-use
5. LLM answers with citations linking to source wiki pages
6. Store message + citations in chat_messages
7. Prepend to log.md with consistent prefix: `QUERY {iso-date} session=<id> topic=<slug> pages-cited=<n>`
8. (Optional) Admin may promote a valuable answer → creates `topics/<slug>.md` and prepends `PROMOTE {iso-date} topic=<slug> from-message=<id>` to log.md
```

### LLM query prompt skeleton
```
You are a chemical regulatory assistant for Vietnamese EHS managers.

User question: <question>

Relevant wiki pages (verbatim):
<page 1>
---
<page 2>
---
...

Rules:
1. Answer in the language of the user's question (VN or EN)
2. Cite specific wiki pages using [[category/slug]] syntax
3. If information is not in the provided pages, say so explicitly — do not hallucinate
4. If there are contradictions across pages, surface them
5. For regulatory questions, always state the jurisdiction explicitly
6. Add a disclaimer: "This is advisory, not legal advice."
```

---

## 9. Maintenance Workflow (nightly cron)

Runs via Inngest scheduled function.

```
1. Read log.md for last 24h of changes
2. For each changed page:
   a. Check cross_refs validity (any dangling links?)
   b. Check frontmatter completeness (missing required fields?)
   c. Check for contradictions with related pages
3. Scan for orphan pages (no incoming refs)
4. Scan for stale pages (not updated in N months, source may be outdated)
5. Prepend to log.md: `LINT {iso-date} dangling=<n> orphans=<n> stale=<n> contradictions=<n>`
6. If high-severity issues: email nad@... for review
```

### LLM maintenance prompt skeleton
```
You are auditing a regulatory wiki for quality.

Changed pages in last 24h:
<list>

Tasks:
1. For each page, verify cross_refs exist in wiki_pages
2. Compare contradictory claims across related pages
3. Flag stale: if source is dated and regulation has been updated
4. Output a lint report in markdown
```

---

## 10. Storage Decision

**MVP:** Postgres `wiki_pages` table (content_md TEXT, frontmatter JSONB). No embeddings table. Nightly dump to git repo for version history + audit trail.

**Why not pure git:** app reads need transactional integrity + full-text search. Git can't do this efficiently.

**Why not pure Postgres:** git provides free change history, diff reviews, and backup. Dual-write keeps both benefits.

**Dual-write mechanics:**
- Writes always go to Postgres first (source of truth)
- Nightly Inngest job serializes all wiki_pages to markdown files in a git repo
- Commits with a bot user
- No branches — append to main

---

## 11. Quality Standards

Every page must meet these minimums before being used in chat:

- [ ] Has `type`, `slug`, `title`, `created`, `updated`, `confidence` frontmatter
- [ ] Has at least 1 source (raw-sources path or URL)
- [ ] For `type: chemical`: has CAS + at least 1 GHS classification
- [ ] For `type: regulation`: has jurisdiction + effective_date
- [ ] For `type: hazard`: has H-code + signal_word + pictogram
- [ ] Has at least 1 cross-reference
- [ ] `confidence: low` pages are not used in chat answers (they're marked "needs review")

---

## 12. Locale Handling

- Primary locale for wiki is `en` (source of truth)
- Vietnamese content stored in dedicated section `## VN language notes` within English pages
- NOT translating the whole wiki to VN — use Gemini runtime translation (Vercel AI SDK, `gemini-3-flash-preview`) for user-facing safety card output
- Post-MVP: consider bilingual pages with `locale: multi` and parallel sections

---

## 13. Confidence Scoring

Three levels:

- **high**: sourced from official regulatory text or peer-reviewed data; verified by EHS consultant
- **medium**: sourced from user SDS + PubChem + ECHA public data; no human review
- **low**: auto-extracted with contradictions or partial data; needs review

Chat answers draw only from `high` and `medium` pages. `low` pages are flagged in review_queue.

---

## 14. Version History

Every page has a `version` field incremented on each LLM edit. Store previous versions in a `wiki_page_history` table (append-only). Post-MVP: git is the audit trail.

---

## 15. Seed Scope for MVP (Week 6 deliverable)

Initial seed pages to hand-author or LLM-generate before AI ingest is live:

**Regulations (6)**
- vn-circular-01-2026-tt-bct (main MOIT implementing rules — SDS template, classification, priority chemicals)
- vn-law-on-chemicals-2025 (parent law)
- vn-decree-26-2026-nd-cp (management of chemical activities)
- ghs-rev-10
- eu-reach-svhc-list (simplified, latest CSV only)
- eu-clp-regulation (classification criteria summary)

**Countries (1)**
- vietnam-overview

**Hazards (16)** — top GHS physical + health hazards
- h200 series (explosives) — skip, rare
- h220–h228 flammables
- h290 corrosive to metals
- h300 series acute toxicity
- h314–h315 skin corrosion/irritation
- h317 sensitization
- h318–h319 eye damage/irritation
- h334 respiratory sensitization
- h335 respiratory irritation
- h340 mutagenicity
- h350 carcinogenicity
- h360 reproductive toxicity
- h372 STOT repeated exposure
- h400 aquatic toxicity

**Chemicals (50)** — most common in SEA manufacturing
- Solvents: toluene, xylene, acetone, ethanol, methanol, isopropanol, dichloromethane, ethyl acetate, hexane, heptane
- Acids/bases: HCl, H2SO4, HNO3, NaOH, KOH, acetic acid, citric acid, ammonia
- Oxidizers: H2O2, NaClO, KMnO4
- Pharma raw materials: paracetamol, caffeine, lactose, magnesium stearate
- Cosmetic ingredients: glycerin, propylene glycol, benzyl alcohol, phenoxyethanol
- Food additives: sodium benzoate, citric acid, MSG
- Silica (respirable): Asia Shine-specific
- ... (final list determined with Asia Shine's actual inventory)

**Topics (3)**
- ghs-16-sections-structure
- vn-import-chemical-workflow
- storage-incompatibility-matrix

**Templates (1)**
- moit-safety-card-template (from Circular 01/2026 Appendix I — 16-section table with explanation column)

---

## Unresolved Questions
1. ~~Exact MOIT safety card template structure~~ **RESOLVED**: Circular 01/2026/TT-BCT Appendix I defines a 16-section table with explanation column. Source: `plans/260411-0732-sds-platform/wiki/regulations/raw-sources/Thông-tư-01-2026-TT-BCT.docx`
2. Whether to store frontmatter as YAML (readable, git-friendly) or JSONB (DB-native, queryable) — recommend YAML in markdown body + JSONB mirror in Postgres for indexing
3. ~~Embedding model choice~~ **RESOLVED (2026-04-12)**: MVP uses NO embeddings — index-driven retrieval via curated `index.md` page read by Gemini at query time (Karpathy pattern). Reassess post-MVP if wiki exceeds ~500 pages or `index.md` exceeds ~8k tokens.
4. Licensing: can we redistribute PubChem/ECHA data within our wiki? PubChem is public domain; ECHA bulk data has specific reuse terms — verify before launch

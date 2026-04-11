---
type: brainstorm
date: 2026-04-11
slug: sds-platform-sea
status: design-approved
author: nad
first_design_partner: asia-shine.com.vn
---

# MSDS Platform — SEA-First Brainstorm Report

## Executive Summary

Solo-built SEA-first SDS management web app. Wedge: **MOIT-compliant Vietnamese safety card generator + compliance Q&A chat** grounded on an **LLM Wiki** of regulatory knowledge. First design partner: Asia Shine (VN chemical distributor, pharma/cosmetic/food/agri, GSP/GDP-certified, founded 2007). KISS stack: Next.js + Supabase + Claude + Inngest + Vercel. 90-day MVP, $99/mo pricing, VN-regulation moat.

---

## 1. Problem Statement

Vietnamese chemical handlers (factories, labs, distributors, universities) are legally required by **Circular 01/2026/TT-BCT** (implementing the **Law on Chemicals 2025**, 69/2025/QH15) to maintain Vietnamese-language safety information at every workplace. Reality today:

- Imported chemicals arrive with English SDSs
- Factories pay EHS consultants $30–200 per SDS for VN-language safety cards
- Backlogs of 100+ unconverted SDSs are normal
- Paper files + SharePoint + email = non-searchable, non-versioned, non-compliant
- Enterprise tools (VelocityEHS, Sphera, ChemWatch) are too expensive + English-centric
- NextSDS (EU, AI-first) doesn't localize for VN regulations

**The gap:** no AI-native, VN-language, legally-aligned SDS tool built for SEA SMBs.

---

## 2. Market Reality — Brutal Honesty

### Competitive landscape
- **VelocityEHS** — US/EU enterprise. Dominant. Too expensive for SMB VN.
- **ChemWatch** — AU-based, multi-lingual, global. Closest to SEA but legacy UX.
- **Sphera** — Fortune 500. Not competing for SMBs.
- **NextSDS** (https://nextsds.com) — EU, AI-first, freemium, Astro stack. Our closest *technical* analog; zero localization for VN.
- **Verisk 3E, SiteHawk, KHA Online-SDS** — EN-market incumbents.

### What each has vs. what we can beat them on
| Competitor | Their moat | Our counter |
|---|---|---|
| VelocityEHS / Sphera | Licensed chem DBs, enterprise sales | SMB pricing + local language |
| NextSDS | AI extraction + EU compliance depth | VN regulation + MOIT compliance + Asia Shine-like design partners |
| ChemWatch | Global SDS sourcing DB | Hyper-local safety card generator |

### Why we can win the SEA-SMB slice
1. **Legal mandate** creates guaranteed demand (compliance-forced purchase)
2. **No authoritative VN player** today
3. **LLMs made extraction/translation cheap enough** for solo-builder economics
4. **Global players won't localize** for VN in ≥2 years

---

## 3. Target ICP & First Design Partner

### ICP profile
Vietnamese SMBs handling 20–500 chemicals, must maintain compliance, pay consultants today for VN safety docs.

- **Verticals (priority order):** chemical distributors → pharma/cosmetic raw material importers → food ingredient traders → university labs → SMB manufacturers
- **Persona buyer:** EHS manager / QA manager / owner
- **Persona user:** warehouse worker (via QR → mobile safety card)
- **Size:** 10–300 employees
- **Budget proxy:** currently spends 5–30M VND/month on EHS consulting

### First design partner — Asia Shine (confirmed)
- **URL:** https://www.asia-shine.com.vn
- **Profile:** Pharma APIs, cosmetic ingredients, food additives, agri chemicals, silica specialties. GSP/GDP certified. 800m² warehouse. HCMC.
- **Why perfect:**
  - Multiple regulated verticals (pharma + food + chemicals)
  - Imports raw materials → many foreign SDSs
  - GSP/GDP = proven compliance willingness-to-pay
  - Established 2007 = can afford SaaS
- **Use as:** Weekly feedback loop, real SDS corpus, case study, reference customer

### Next 9 design partners
- 3 more VN chemical distributors (via Asia Shine referral)
- 2 university chemistry labs (VNU, HCMUS)
- 2 SMB factories (cosmetic + food)
- 2 pharma/API importers

---

## 4. Strategic Lane & Killer Wedge

### Lane chosen: **SEA-First EHS Vertical**

### MVP scope (final)
1. **SDS vault** — upload, OCR-free via Claude vision, versioning, full-text + semantic search
2. **AI extraction** — 16 GHS sections → JSONB, confidence scoring
3. **VI Safety Card Generator** ⭐ killer feature — MOIT-compliant PDF + mobile QR
4. **Compliance Q&A chat** ⭐ differentiator — LLM Wiki-grounded answers with citations
5. **CAS lookup** — PubChem integration, basic chemical master
6. **Multi-tenant org** — auth, RLS, team invites

### Why these 6 features (and nothing else for 90 days)
- (1) + (2) = table stakes, everyone has this
- (3) = the feature you charge for. Legal mandate = non-negotiable = willingness to pay.
- (4) = the feature that creates session frequency + makes you feel "smart". Differentiates from NextSDS.
- (5) = data gravity starter
- (6) = multi-seat = contract expansion

### Explicitly deferred (post-MVP)
Expiry alerts, Magic Mailbox email ingest, risk assessment, inventory/waste mgmt, transport docs, multi-country (TH/ID), procurement validation, review queue UX, Stripe billing → MoMo/VNPay.

---

## 5. Architecture

### Stack (locked)

```
Frontend + Backend: Next.js 15 App Router + TypeScript + shadcn/ui + Tailwind
Database: Supabase Postgres + RLS + pgvector
Auth: Supabase Auth
Storage: Supabase Storage (S3-compatible)
AI extraction: Claude Sonnet 4.6 (structured outputs)
AI chat/light ops: Claude Haiku 4.5
AI vision: Claude vision for scanned PDFs (no Tesseract)
Async jobs: Inngest (retries, observability, dashboards)
Email ingest: Resend inbound webhook (post-MVP)
Search: Postgres full-text (tsvector) + pgvector semantic
Hosting: Vercel (app) + Supabase (backend) — zero DevOps
Payments: Stripe (intl) + MoMo/VNPay (VN) — post-MVP
Monitoring: Sentry + Vercel Analytics
```

### Data model (core tables)

```sql
organizations          (id, name, locale, plan, created_at)
users                  (supabase_auth_id, org_id, role)
sds_documents          (id, org_id, file_url, filename, version, supplier, revision_date, status)
sds_extractions        (id, sds_id, sections jsonb, confidence jsonb, model_version, extracted_at)
chemicals              (cas_number pk, ec_number, pubchem_cid, ghs jsonb, hazards jsonb, updated_at)
sds_chemicals          (sds_id, cas_number, weight_percent, is_main)
safety_cards           (id, sds_id, locale, pdf_url, qr_token, template_version, generated_at)
review_queue           (id, sds_id, field_path, low_conf_value, human_value, status)
audit_log              (id, org_id, user_id, action, target, ts)
wiki_pages             (slug pk, title, content_md, category, cited_by jsonb, updated_at)
wiki_embeddings        (page_slug, chunk_idx, embedding vector(1536), chunk_text)
chat_sessions          (id, org_id, user_id, started_at)
chat_messages          (id, session_id, role, content, citations jsonb, ts)
```

RLS on all `org_id` tables. `chemicals` + `wiki_*` are global, read-only.

### Request flow — SDS upload

```
User uploads PDF
  → Supabase Storage
  → Insert sds_documents (status=pending)
  → Inngest trigger: extract-sds
    → Claude vision+structured extraction → sections jsonb
    → Parse chemicals → link to chemicals table (enrich via PubChem if missing)
    → Compute confidence scores → if low: insert review_queue rows
    → Update sds_documents (status=ready)
  → Notify UI (Supabase realtime)
```

### Request flow — Safety Card generation

```
User clicks "Generate VI Safety Card"
  → Check sds_extractions has required fields
  → Claude Sonnet: translate + localize sections 1,2,4,5,6,7,8 to VI using MOIT template
  → Render PDF (react-pdf or Puppeteer on Vercel) with QR code
  → Upload to Storage, insert safety_cards row
  → QR token → public mobile view (no auth) showing cached card
```

### Request flow — Compliance Chat

```
User asks: "Is CAS 108-88-3 restricted under Vietnam law?"
  → Embed query (Voyage/OpenAI embeddings or Claude-native)
  → Hybrid search: pgvector (semantic) + tsvector (keyword) over wiki_embeddings
  → Pull top-5 wiki pages
  → Claude Sonnet with pages in context → answer + citations
  → Store message + citations, show UI with clickable source links
```

---

## 6. LLM Wiki for Regulatory Knowledge ⭐

This is the most important architectural bet in the project. Credit: Karpathy's LLM Wiki gist (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

### The idea
Build a **compounding, LLM-maintained knowledge base** of regulatory information stored as versioned markdown files in a git repo (or `wiki_pages` table). Three layers:

1. **Raw sources (immutable)** — REACH PDFs, GHS Rev 10 tables, VN Circular 01/2026/TT-BCT text, Decree 26/2026/ND-CP, ECHA SVHC lists, PubChem dumps, MOIT publications
2. **Wiki layer (LLM-maintained)** — synthesized markdown pages: per-chemical, per-regulation, per-hazard-class, per-country
3. **Schema layer** — CLAUDE.md-style spec defining file format, conventions, maintenance rules

### Why this beats vanilla RAG over SDSs
| Vanilla RAG | LLM Wiki |
|---|---|
| LLM re-discovers knowledge every query | Knowledge accumulates |
| Noisy (full SDS text chunks) | Curated synthesis |
| No cross-references | Explicit wiki links |
| No contradictions detected | Lint pass flags them |
| Static corpus | Compounds as users upload more |

### Example wiki structure
```
wiki/
├── index.md                        # content-oriented catalog
├── log.md                          # append-only ingest/query log
├── schema.md                       # format spec (our CLAUDE.md equivalent)
├── chemicals/
│   ├── 108-88-3-toluene.md         # per-CAS pages
│   ├── 7647-01-0-hcl.md
│   └── ...
├── regulations/
│   ├── vn-circular-01-2026-tt-bct.md
│   ├── eu-reach-svhc.md
│   ├── ghs-rev-10.md
│   └── moit-safety-card-template.md   # Appendix I of Circular 01/2026
├── hazards/
│   ├── h225-flammable-liquid.md
│   └── h350-carcinogen.md
└── topics/
    ├── storage-incompatibility-matrix.md
    └── vn-import-chemical-workflow.md
```

### Workflows
- **Ingest workflow:** user uploads SDS → LLM extracts → writes/updates `chemicals/<cas>.md` → updates `index.md` → appends `log.md`
- **Query workflow:** user asks question → LLM reads `index.md` → fetches relevant pages → answers with citations
- **Maintenance workflow:** nightly Inngest cron → LLM lints wiki (contradictions, stale claims, orphans)

### Why this is a moat
- Every user upload improves it for every user (network effect)
- Regulatory expertise compounds without hiring chemists
- Citations = auditability = legal defensibility
- Git-versioned = full change history = compliance gold
- Competitors (NextSDS, VelocityEHS) don't have this pattern

### Storage decision: git repo OR Postgres?
**Recommendation:** Postgres `wiki_pages` table (easier app integration, single backup, simpler RLS if ever needed). Back up nightly to git for version history + auditability. Best of both.

---

## 7. 90-Day MVP Cut

Ruthless. Weekly deliverables:

| Weeks | Deliverable |
|---|---|
| 0 (pre-code) | **Interviews with 10 VN EHS people** incl. Asia Shine. Kill/pivot if <3 enthusiastic. |
| 1 | Next.js scaffold, Supabase setup, auth, RLS, storage bucket, basic shell UI |
| 2 | Upload flow + sds_documents schema + Inngest pipeline scaffold |
| 3 | Claude extraction prompt (16 GHS sections) → sections jsonb + confidence scoring |
| 4 | SDS detail view: sections, confidence badges, inline edit-to-correct |
| 5 | PubChem integration + chemicals master table + basic search (tsvector) |
| 6 | **LLM Wiki v0**: schema, seed pages for VN Circular 01/2026/TT-BCT + Law on Chemicals 2025, GHS Rev 10, 50 common chemicals |
| 7 | **VI Safety Card v0**: MOIT template → PDF render → QR → mobile public view |
| 8 | Polish card generator; Asia Shine ingests 20 real SDSs → generate 20 cards → feedback |
| 9 | **Compliance Chat v0**: embeddings over wiki, RAG flow, citations UI |
| 10 | Multi-tenant org + invites + role-based access |
| 11 | Billing scaffold (Stripe + MoMo stub), landing page, waitlist |
| 12 | Asia Shine paid conversion, 3 more design partners onboarded, public beta announce |

### Non-goals for 90 days
Expiry alerts, Magic Mailbox, risk assessment, inventory, waste, transport docs, TH/ID, mobile app, offline mode, Stripe+MoMo fully, teams >10, file sharing outside org, SSO.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Regulatory misclassification → user harm | Med | Critical | EULA disclaimer; EHS consultant on retainer ($200–500/mo); manual review gate for high-hazard chemicals; audit log |
| Solo burnout over 6–12 months | High | Critical | Weekly accountability (Asia Shine check-in); ruthless scope cuts; KISS stack |
| VN payment rails friction | High | High | Design schema for multi-provider from day 1; ship Stripe first, add MoMo Q2 |
| Claude API cost per SDS | Low | Med | Batch extractions; cache by file hash; Haiku for non-critical ops; target <$0.20/SDS |
| Scanned PDFs / non-standard layouts | High | Med | Claude vision handles most; human review queue for fallback; reject low-confidence with clear UX |
| Data privacy concerns (chemical formulations = IP) | Med | High | EU-hosted Supabase region OR VN-hosted alternative; BAA-style DPA with customers; clear retention policy |
| NextSDS expands to VN | Low (2yr) | High | Build Asia Shine case study + 20 reference customers before they arrive; LLM Wiki moat |
| Mis-translated VI safety phrases | Med | High | Lock Claude prompts with MOIT terminology glossary per Circular 01/2026 Appendix I; EHS consultant reviews first 50 cards |
| LLM Wiki drift/contradictions | Med | Med | Nightly lint job; human review of changes >N; git snapshot |
| Liability lawsuit | Low | Catastrophic | VN lawyer-reviewed EULA + disclaimer + E&O insurance after first paying customer |

---

## 9. Validation Protocol — Do Before Week 1

### Interview script (10 people, 30 min each)
1. How many SDSs do you handle? How often new ones arrive?
2. Walk me through your current process from receiving an English SDS to putting info in front of a warehouse worker.
3. How much do you spend monthly on EHS consulting for SDS/safety documentation?
4. What happens during a MOIT audit if a VN safety card is missing?
5. Show me your current SDS filing system (screenshot/photo).
6. If I could give you MOIT-compliant VI safety cards in 30 seconds per SDS for $99/mo, would you pay? What's the objection?
7. Who approves this purchase? What's their decision process?
8. What would make this a 10/10 for you vs. a 7/10?
9. Would you be a design partner — weekly feedback calls for 3 months in exchange for lifetime discount?
10. Who else should I talk to?

### Kill criteria
- **<3 enthusiastic "yes I'd pay" responses** → kill project, pivot
- **Only consultants as prospects (not end buyers)** → wrong ICP, pivot
- **Current consulting spend <5M VND/mo average** → price point too high, rethink

### Pass criteria
- **≥5 enthusiastic prospects** → green light week 1
- **≥2 willing design partners** (incl. Asia Shine)
- **≥1 commits to trial on day of launch**

---

## 10. Success Metrics

### 30-day milestones
- Extraction pipeline handles 95% of test SDSs without human intervention
- First 10 real SDSs from Asia Shine ingested and verified
- Wiki seeded with 50 chemicals + 5 regulations

### 60-day milestones
- First VI safety card generated, printed, hung in Asia Shine warehouse
- Chat answers 80% of test compliance questions correctly (measured against EHS consultant)

### 90-day milestones
- **1 paying customer (target: Asia Shine)**
- 3 design partners actively using
- <$0.30 Claude API cost per SDS average
- Public beta signup page live with waitlist

### 180-day milestones (post-MVP)
- 10 paying orgs
- MRR ≥ 15M VND (~$600)
- Expiry alerts + Magic Mailbox shipped
- TH localization started

---

## 11. Pricing Model (Proposal)

| Plan | Price | Limits | Target |
|---|---|---|---|
| Free | 0 | 5 SDSs, no VI cards, community support | Acquisition |
| Starter | 499k VND/mo (~$20) | 50 SDSs, 20 VI cards/mo, email support | Solo EHS / labs |
| Pro | 2.49M VND/mo (~$99) | Unlimited SDSs, unlimited VI cards, chat, QR cards | SMB factories (Asia Shine tier) |
| Business | 7.9M VND/mo (~$320) | Pro + 10 seats + audit export + API | Distributors / mid-market |
| Enterprise | Contact | SSO, SLA, on-prem wiki, dedicated consultant | Post-MVP |

### Pricing rationale
- Pro at 2.49M VND = less than 1 consultant invoice for a single SDS translation
- Starter lets small labs buy on personal card
- Business unlocks referral (distributor → factories)

---

## 12. Next Steps (immediate)

1. **This week:** schedule 10 interviews (start with Asia Shine). Don't write code yet.
2. **Week of interviews:** build landing page + waitlist form (1 day of work, not part of 90-day budget)
3. **After interviews pass kill criteria:** run `/ck:plan` to decompose this report into phased implementation plan
4. **Before any customer billing:** VN lawyer EULA review (~5–10M VND)
5. **Ongoing:** cultivate relationship with 1 VN EHS consultant for regulatory sanity checks

---

## 13. Unresolved Questions

1. **Data residency** — do VN pharma importers require data in VN (not EU-hosted Supabase)? If yes, Supabase EU region may not satisfy; evaluate Supabase self-hosted on VN VPS vs. alternative backends.
2. ~~**MOIT safety card exact template**~~ — **RESOLVED**: Circular 01/2026/TT-BCT **Appendix I** defines the official SDS template ("Mẫu Phiếu an toàn hóa chất") as a 16-section table with explanation column. No separate PDF template — it's a content specification. Source: `Thông-tư-01-2026-TT-BCT.docx` in repo root.
3. **EHS consultant retainer** — who? Asia Shine may know one; alternatively VN chemistry-society contacts or LinkedIn outreach. ~$200–500/mo budget.
4. **Chemical master data licensing** — stick with free PubChem+ECHA forever, or consider commercial DB post-Series-A? Flag decision point at 100 customers.
5. **Wiki storage format** — Postgres `wiki_pages` confirmed, but decide: nightly git snapshot (recommended) vs. dual-write (more complex).
6. **Embedding model** — Voyage, OpenAI, or Claude-native embeddings? Depends on cost + latency benchmarks. Decide before week 9.
7. **QR card security** — should QR-scanned mobile cards be public-by-token (anyone with URL), or require login? Public-by-token is better UX for warehouse workers but leaks chemical inventory to outsiders.
8. **Liability insurance** — when to buy E&O? Before or after first paying customer? Consult VN insurance broker.
9. **Competitive response** — if NextSDS launches VN support in 12 months, what's the defense? LLM Wiki + reference customers, but specific response plan TBD.
10. **Team expansion trigger** — at what MRR/customer count do you stop being solo and hire #1 (EHS domain expert vs. full-stack dev vs. ops)?

---

## Appendix A — Competitive Feature Matrix

| Feature | NextSDS | VelocityEHS | ChemWatch | **Us (MVP)** |
|---|---|---|---|---|
| SDS vault | ✅ | ✅ | ✅ | ✅ |
| AI extraction | ✅ | Partial | ❌ | ✅ |
| REACH/CLP compliance | ✅ | ✅ | ✅ | Deferred |
| VN MOIT compliance | ❌ | ❌ | ❌ | ✅ |
| VI safety card gen | ❌ | ❌ | Partial | ✅ ⭐ |
| Compliance chat (Q&A) | ❌ | ❌ | ❌ | ✅ ⭐ |
| LLM Wiki knowledge base | ❌ | ❌ | ❌ | ✅ ⭐ |
| Inventory mgmt | ✅ | ✅ | ✅ | Deferred |
| Risk assessment | ✅ | ✅ | ✅ | Deferred |
| ADR transport docs | ✅ | ✅ | ✅ | Deferred |
| Licensed commercial DB | ✅ | ✅ | ✅ | ❌ (free sources + wiki) |
| SMB pricing for VN | ❌ | ❌ | ❌ | ✅ |

---

## Appendix B — References

- NextSDS (competitor): https://nextsds.com
- Karpathy LLM Wiki pattern: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- First design partner: https://www.asia-shine.com.vn
- **Law on Chemicals 2025** (69/2025/QH15) — effective Jan 1, 2026
- **Decree 24/2026/ND-CP** — regulated chemical lists
- **Decree 25/2026/ND-CP** — green chemical industry + safety/security
- **Decree 26/2026/ND-CP** — management of chemical activities + hazardous chemicals in products: https://vanban.chinhphu.vn/?pageid=27160&docid=216673
- **Circular 01/2026/TT-BCT** — MOIT implementing rules (SDS template in Appendix I, classification in Appendix XV, 10 priority disclosure chemicals in Appendix XIX): https://vanban.chinhphu.vn/?pageid=27160&docid=216719
- **Circular 02/2026/TT-BCT** — chemical consultancy certificates + incident prevention
- ~~Circular 32/2017/TT-BCT~~ (repealed by Circular 01/2026, effective Jan 17, 2026)
- ~~Circular 17/2022/TT-BCT~~ (repealed by Circular 01/2026, effective Jan 17, 2026)
- GHS Rev 10 — UN ECE
- ECHA SVHC list — https://echa.europa.eu
- PubChem REST API — https://pubchem.ncbi.nlm.nih.gov/rest/pug
- SDS management market analysis 2026: https://cloudsds.com/safety-data-sheet-management/top-25-sds-management-software-in-2026-detailed-feature-analysis/
- UL Solutions analysis of VN 2026 chemical regulations: https://www.ul.com/news/vietnam-issues-new-subsidiary-regulations-chemicals-law
- REACH24H analysis: https://en.reach24h.com/news/insights/chemical/vietnam-new-chemical-law-no-69-2025-qh15

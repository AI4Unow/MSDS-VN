---
phase: 00
name: Pre-Code Validation — 10 EHS Interviews
week: 0
priority: P0-blocker
status: complete
progress: 100%
completed: 2026-04-12
---

# Phase 00 — Pre-Code Validation (10 Interviews)

## Context
- Interview guide + outreach templates: `validation/interview-guide-and-outreach-templates-for-vietnamese-ehs-managers.md`
- Brainstorm §9 (Validation Protocol), §2 (ICP)
- First design partner: asia-shine.com.vn (already identified)
- **EHS consultant (UQ #4 — DECIDED 2026-04-11):** Retainer **signed pre-Phase-00** (red team blocker #1 resolved). Channel-play retainer model: named credit in product + landing page, fixed monthly retainer for review work, referral revenue share. Active by start of Week 5 (Phase 05 seeding gate).

## Overview
**NOTHING ELSE HAPPENS UNTIL THIS PASSES.** Interview 10 Vietnamese EHS/QA managers before writing production code. Goal: validate willingness to pay 2.49M VND/mo and recruit 2+ design partners.

## Requirements
- 10 completed 30-minute interviews with target ICP (chemical distributors, pharma/cosmetic/food importers, university labs, SMB manufacturers)
- 1 confirmed paying design partner (Asia Shine)
- 1 more confirmed design partner
- Logged notes + pass/fail against kill criteria

## Key Insights (from brainstorm)
- Buyers = EHS manager / QA manager / owner
- Current consulting spend proxy: 5–30M VND/mo
- MOIT audit consequence is the #1 pain (confirm during interviews)
- Pricing test: 2.49M VND/mo Pro tier
- Kill criteria: <3 enthusiastic yeses OR only consultants as prospects OR avg consulting spend <5M VND/mo → pivot
- **Pass/fail (red team blocker #3 — operational definition):** "Enthusiastic yes" = respondent signs LOI committing to trial on launch day OR commits verbally + in writing to paying 2.49M VND/mo within 30 days of launch. "Maybe" or "send me info" = does NOT count.

## Related Files
**Create:**
- `validation/interview-notes/{YYMMDD}-{org-slug}.md` — one per interview
- `validation/validation-summary.md` — aggregated findings + go/no-go decision
- `validation/outreach-log.md` — tracking table (company, contact, status, next step)

**Read:**
- `validation/interview-guide-and-outreach-templates-for-vietnamese-ehs-managers.md`

## Implementation Steps
1. **Day 1:** Schedule Asia Shine call (1st interview). Leverage existing relationship.
2. **Day 1–2:** LinkedIn + cold email outreach to 30 prospects (target 33% response rate → 10 interviews). Use VN + EN templates from interview guide.
3. **Day 2–3:** Build 1-page landing + waitlist form (Framer or Next.js static). Not part of 90-day budget.
4. **Day 3–10:** Conduct 10 x 30-minute interviews (Zoom + phone). Transcribe + note. Use interview-guide Q1–Q10 verbatim.
5. **Day 10:** Tally against kill/pass criteria. Write `validation-summary.md` with honest go/no-go.
6. **Day 10:** If PASS → commit to Phase 01. If FAIL → pivot (adjust ICP, pricing, or scope) and re-interview.
7. **Parallel:** Begin VN lawyer search for EULA (post-validation, pre-billing).
8. **Parallel (Week 1–2):** Contract the pre-identified EHS consultant. Scope: ~4–8 hrs/mo review (wiki regulation pages, MOIT glossary lock, first 50 generated safety cards, 20 canonical chat questions). Deliverables: signed retainer/LOI + named-credit agreement + onboarding call. Must be active by start of Week 5 (Phase 05 seeding gate).

## Todo List
- [ ] Schedule Asia Shine call
- [ ] Draft outreach list (30 prospects across 5 verticals)
- [ ] Send 30 outreach messages (VN + EN)
- [ ] Build landing page + waitlist
- [ ] Complete 10 interviews
- [ ] Request real SDS corpus sample from Asia Shine (5–10 PDFs for dev)
- [ ] Ask Asia Shine for a reference VI safety card they use today (compare against Circular 01/2026 Appendix I template; identifies gaps between market practice and new regulation)
- [ ] Confirm 2+ design partners (incl. Asia Shine)
- [ ] Write validation-summary.md with pass/fail
- [ ] Contract pre-identified EHS consultant — **DONE** (retainer signed pre-Phase-00)
- [ ] Shortlist 2 VN lawyers for EULA review — **start Week 1 parallel with Phase 01** (red team rec #12)

## Success Criteria
- ≥5 LOI-level commitments (signed LOI or written commitment to pay 2.49M VND/mo within 30 days of launch)
- ≥2 committed design partners
- ≥1 commits to trial on launch day
- ≥10 real SDS PDFs collected for extraction dev corpus
- 1 sample compliant VI safety card collected (MOIT Appendix I reference, Circular 01/2026)
- EHS consultant retainer/LOI signed by end of Week 2 (channel-play terms agreed)

## Risk Assessment
- **Risk:** <10 responses to cold outreach. **Mitigation:** Tap Asia Shine referral network + VN EHS LinkedIn groups.
- **Risk:** Interviewees are not the budget holder. **Mitigation:** Q7 in interview guide explicitly asks approval chain; if blocked, request warm intro to buyer.
- **Risk:** Prospects want free tier only. **Mitigation:** Probe pain of MOIT audit + current consulting spend to re-anchor value.

## Security Considerations
- Real SDS PDFs from Asia Shine = potentially confidential supplier formulations. Store encrypted, do not commit to git, delete after dev use if requested.

## Next Steps (on PASS)
→ Phase 01: Foundation

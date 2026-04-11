---
type: red-team-review
date: 2026-04-11
reviewer: red-team
status: complete
resolution: all-critical-blockers-resolved
resolution_date: 2026-04-11
---

# Red Team Review — SDS Platform (Vietnam MOIT Compliance)

**Verdict:** Plan is ambitious but has **critical path vulnerabilities** and **regulatory liability exposure** that could derail the 90-day timeline. ~~Recommend addressing blockers before Phase 01 kickoff.~~ **UPDATE 2026-04-11: All 3 critical blockers resolved. Plan updated to incorporate accepted mitigations. Proceed.**

---

## 🔴 CRITICAL BLOCKERS (Must Resolve Before Code)

### 1. **EHS Consultant Retainer Not Signed** (Phase 00 → Phase 05 blocker)
- **The Problem:** Phase 05 (wiki seeding) and Phase 06 (safety card generation) require EHS consultant review. Plan says consultant is "already identified" but retainer must be "signed by end of Week 2; active by Week 5."
- **Why This Fails:** Week 0 is interviews. Week 1 is foundation. Week 2 is upload pipeline. Finding, negotiating, and onboarding a consultant in parallel is optimistic. If this slips by 1 week, Phase 05 is blocked.
- **Red Team Challenge:** What happens if the consultant is unavailable or demands higher fees than budgeted? What's the fallback?
- **Recommendation:** Sign consultant retainer **before Phase 00 starts**, not during. De-risk this immediately.

### 2. **Regulatory Source Documents Are "Pending"** (Phase 05 blocker)
- **The Problem:** Phase 05 wiki seeding requires Decree 24/2026, Decree 25/2026, Circular 02/2026. Plan lists these as "to be acquired during Phase 00/05."
- **Why This Fails:** If these documents aren't available by Week 6, wiki seeding is incomplete. Chat (Phase 07) depends on a complete wiki. If wiki is incomplete, chat accuracy benchmark fails.
- **Red Team Challenge:** What if these decrees are not yet published? What if they contradict Circular 01/2026? What if they require product changes?
- **Recommendation:** Acquire all source documents **before Phase 00 starts**. Verify they're final, not draft.

### 3. **Phase 00 Kill Criteria Are Subjective** (Entire project gate)
- **The Problem:** Success = "≥5 enthusiastic yeses" and "≥2 committed design partners." What does "enthusiastic" mean? How is commitment measured?
- **Why This Fails:** If 5 people say "maybe" vs. "definitely," the decision is ambiguous. This is the gate for the entire 90-day project.
- **Red Team Challenge:** Who decides pass/fail? What if the founder and the EHS consultant disagree?
- **Recommendation:** Define pass/fail operationally before interviews start. E.g., "≥5 respondents who sign a LOI committing to trial on launch day" or "≥5 respondents who commit to paying 2.49M VND/mo within 30 days of launch."

---

## 🔴 HIGH-RISK ASSUMPTIONS

### 4. **$0.30 Per-SDS Extraction Cost Is Fragile**
- **The Problem:** Target cost assumes:
  - Claude Sonnet 4.6 pricing (3x text tokens for vision)
  - 30-page cap per SDS
  - No retries or fallbacks
  - Prompt caching hits 90% of tokens
- **Why This Fails:** Real-world SDSs vary wildly. Scanned PDFs with poor OCR may require vision mode on all pages. Retries on rate-limit or API errors add cost. If cost exceeds $0.30, unit economics break.
- **Red Team Challenge:** What if average SDS is 40 pages? What if vision mode is needed for 50% of SDSs? What if Claude pricing changes?
- **Recommendation:** Run cost analysis on 50 real SDSs from Asia Shine before Phase 03 starts. Build 50% cost buffer into pricing model.

### 5. **95% Extraction Accuracy on 10 Test SDSs Is Not Validation**
- **The Problem:** Phase 03 success criteria: "95% of structured fields (CAS, H-codes, PPE list) match ground truth" on 10 real SDSs.
- **Why This Fails:** 10 SDSs is a tiny sample. Real-world SDSs have:
  - Inconsistent formatting (tables, free text, mixed languages)
  - Hallucinated CAS numbers (Claude can invent plausible-looking CAS)
  - Ambiguous H-codes (multiple valid codes for same hazard)
  - Missing sections (some SDSs are incomplete)
- **Red Team Challenge:** What if accuracy is 95% on Asia Shine's SDSs but 70% on a competitor's? What if hallucinated CAS numbers pass the PubChem check?
- **Recommendation:** Test on 100+ diverse SDSs from multiple suppliers. Define "accuracy" operationally (e.g., "CAS number matches PubChem within 1 edit distance").

### 6. **Chat Accuracy Benchmark (80% on 20 Questions) Is Underspecified**
- **The Problem:** Phase 07 success criteria: "20 canonical test questions scored by EHS consultant: ≥80% correct."
- **Why This Fails:** 
  - 20 questions is a tiny benchmark set
  - "Correct" is subjective (EHS consultant may disagree with another consultant)
  - No definition of what "regulatory claim" means (does every answer need citations?)
  - No plan for what happens if accuracy is 75%
- **Red Team Challenge:** What if the EHS consultant is lenient? What if a customer asks a question not in the benchmark set and gets a wrong answer?
- **Recommendation:** Expand benchmark to 100+ questions. Define scoring rubric (e.g., "answer must cite a wiki page; citation must be relevant; no hallucinated regulations").

### 7. **Asia Shine Commitment Is Assumed, Not Confirmed**
- **The Problem:** Plan assumes Asia Shine will:
  - Provide 5-10 real SDS PDFs for dev
  - Provide a reference VI safety card
  - Do a dry run with 20 generated cards
  - Provide feedback
  - Commit to trial on launch day
- **Why This Fails:** Asia Shine is also the first paying customer. If they're busy or skeptical, they may not commit this much time. If they don't provide SDSs, extraction testing is blocked.
- **Red Team Challenge:** What if Asia Shine says "we'll try it when it's ready" instead of "we'll help you build it"?
- **Recommendation:** Get written commitment from Asia Shine before Phase 00 starts. Define deliverables and timeline in writing.

---

## 🟠 MEDIUM-RISK ISSUES

### 8. **Timeline Compression: 90 Days for Solo Founder**
- **The Problem:** 
  - Week 0: Interviews (validation gate)
  - Weeks 1–10: Implementation (10 phases, some parallel)
  - Weeks 11–12: Hardening + launch
- **Why This Fails:** 
  - No buffer for bugs, integration issues, or regulatory review
  - If Phase 00 fails, re-interview eats into timeline
  - If any phase slips by 1 week, launch is at risk
  - Solo founder has no backup if sick or blocked
- **Red Team Challenge:** What if Phase 03 (extraction) takes 3 weeks instead of 2? What if Phase 06 (safety card) needs EHS consultant review that takes 2 weeks?
- **Recommendation:** Add 2-week buffer. Aim for Week 10 launch, not Week 12. Identify which phases can be cut if timeline slips.

### 9. **Data Residency Decision Made Too Early**
- **The Problem:** Phase 01 decided on Supabase ap-southeast-1 (Singapore). Plan says "if ≥30% of Phase 00 interviews flag VN-resident storage as a blocker, re-evaluate."
- **Why This Fails:** By the time Phase 00 interviews are done, Phase 01 is already in progress. Migrating from Singapore to VN-hosted Supabase is expensive and risky.
- **Red Team Challenge:** What if 40% of interviews flag data residency as a blocker? What if a customer demands VN-resident storage as a contract requirement?
- **Recommendation:** Defer data residency decision until after Phase 00 interviews. If ≥30% flag it, use VN-hosted Supabase from the start.

### 10. **Regulatory Framework Uncertainty**
- **The Problem:** Plan is built on Circular 01/2026/TT-BCT (effective 2026). But Decree 24/2026, Decree 25/2026, Circular 02/2026 are "pending."
- **Why This Fails:** If these decrees change the SDS template or classification rules, the entire product could be invalidated. If they're not published by Week 6, wiki seeding is incomplete.
- **Red Team Challenge:** What if Circular 02/2026 requires additional fields on the safety card? What if Decree 25/2026 restricts who can generate safety cards?
- **Recommendation:** Get written confirmation from MOIT that Circular 01/2026 is final and won't be superseded by other decrees. Verify with EHS consultant.

### 11. **Public QR Token Leak Risk (Default Insecure)**
- **The Problem:** Phase 06 defaults to `public_token` (unguessable token, no login). Mitigations are optional (per-org toggle, token rotation, rate-limit).
- **Why This Fails:** 
  - Default is insecure. Customers must opt-in to security.
  - QR code on a sticker can be photographed and shared.
  - Rate-limit (60 req/min/IP) is weak against distributed attacks.
  - Disclaimer doesn't prevent liability if a competitor's chemical inventory is leaked.
- **Red Team Challenge:** What if a customer's safety card is leaked and a competitor uses it to identify their suppliers? What if a customer is sued for not protecting their chemical inventory?
- **Recommendation:** Default to `login_required`. Make `public_token` an opt-in feature for customers who understand the risk. Add E&O insurance or liability cap in EULA.

### 12. **No Audit Log Until Week 10**
- **The Problem:** Phase 08 (Week 10) adds audit logging. Phases 1–9 have no audit trail.
- **Why This Fails:** If there's a security incident in Weeks 1–9 (e.g., unauthorized SDS access, data leak), there's no audit log to investigate.
- **Red Team Challenge:** What if a user's account is compromised in Week 3? How do you know what data was accessed?
- **Recommendation:** Add audit logging in Phase 01, not Phase 08. It's a security baseline, not a nice-to-have.

### 13. **Inngest Dependency With No Fallback**
- **The Problem:** Entire extraction pipeline depends on Inngest. No mention of retry logic, dead-letter queues, or observability.
- **Why This Fails:** If Inngest is down, all SDS extractions fail. If a job fails silently, users don't know their SDS wasn't processed.
- **Red Team Challenge:** What if Inngest has a 1-hour outage during a customer's peak usage? What if a job fails and is never retried?
- **Recommendation:** Implement retry logic (exponential backoff, max 3 retries). Add dead-letter queue for failed jobs. Add observability (Sentry, Datadog) to alert on failures.

### 14. **PDF Rendering on Vercel Is Risky**
- **The Problem:** Phase 06 uses react-pdf or Puppeteer for PDF rendering. Puppeteer on Vercel has cold-start latency and memory limits.
- **Why This Fails:** 
  - Cold start can take 5–10 seconds
  - Memory limit (3GB on Pro) may be exceeded for large PDFs
  - Layout may not match MOIT Appendix I exactly
- **Red Team Challenge:** What if a customer tries to generate 100 safety cards at once? What if Puppeteer runs out of memory?
- **Recommendation:** Test PDF rendering with 100+ real SDSs before Phase 06 starts. Consider using a dedicated PDF service (e.g., Chromium on AWS Lambda) instead of Vercel.

### 15. **Chat Tool-Use Pattern Has Token Overhead**
- **The Problem:** Phase 07 uses Anthropic tool-use for wiki retrieval. Tool-use adds latency and token overhead.
- **Why This Fails:** 
  - Tool-use loop can take 3–5 turns (read index → pick pages → read pages → answer)
  - Each turn costs tokens (system prompt, index, page content)
  - Latency to first token may exceed 2s target
  - Cost per query may exceed budget
- **Red Team Challenge:** What if a user asks a complex question that requires reading 5 wiki pages? What if the tool-use loop hits the max 5 rounds and still doesn't have an answer?
- **Recommendation:** Benchmark tool-use latency and cost on 100 test questions before Phase 07 launch. Consider caching wiki index and frequently-accessed pages.

---

## 🟡 LOWER-RISK CONCERNS

### 16. **Multi-Tenant Org (Phase 08) Timing**
- **The Problem:** Phase 08 (Week 10) is marked P1, not P0. But billing (Phase 09) depends on it.
- **Why This Fails:** If Phase 08 slips, billing can't be implemented. But Phase 08 is not critical for MVP (single-user orgs work fine).
- **Recommendation:** Move Phase 08 to post-MVP. Launch with single-user orgs. Add multi-tenant in v1.1.

### 17. **Scope Creep in Phase 09**
- **The Problem:** Phase 09 is "Billing Scaffold + Landing + Launch" in 2 weeks. This includes:
  - Stripe integration
  - Billing UI
  - Landing page
  - Legal review (EULA, privacy policy)
  - Launch prep
- **Why This Fails:** 2 weeks is extremely tight. If legal review takes 1 week, only 1 week for everything else.
- **Recommendation:** Start legal review in Week 1 (parallel with Phase 01). Have landing page draft by Week 8. Aim for Week 11 launch, not Week 12.

### 18. **No Contingency for Phase 00 Failure**
- **The Problem:** If interviews fail, plan says "pivot and re-interview." But this eats into the 90-day window.
- **Why This Fails:** Re-interviewing takes 1–2 weeks. If Phase 00 fails, launch slips to Week 13–14.
- **Recommendation:** Define pivot criteria before Phase 00 starts. E.g., "If <3 yeses, pivot to B2B2C model (sell through consultants instead of direct)." Have a backup ICP ready.

### 19. **No A/B Testing or Experimentation**
- **The Problem:** MVP is locked in before validation. No mention of testing different card layouts, pricing tiers, or feature sets.
- **Why This Fails:** If customers want a different card layout or pricing model, product is already built.
- **Recommendation:** Build feature flags for card layout and pricing. A/B test with early customers.

### 20. **Wiki Maintenance Burden**
- **The Problem:** Phase 05 seeds 50 chemicals + 10 regulations. Phase 07 chat depends on wiki being accurate and up-to-date.
- **Why This Fails:** Wiki will drift over time. Regulations change. Chemicals are added. Nightly lint job (Phase 05) may not catch all issues.
- **Recommendation:** Define wiki maintenance SLA (e.g., "all regulations updated within 1 week of new decree"). Assign owner (founder or EHS consultant).

---

## 🟢 WHAT'S WORKING

- **Regulatory alignment is solid.** Plan correctly identifies Circular 01/2026 as the authoritative source and builds the product around it.
- **Karpathy wiki pattern is smart.** Avoiding embeddings at MVP scale is the right call. Index-driven retrieval is simpler and cheaper.
- **EHS consultant retainer model is clever.** Channel-play (named credit + referral revenue) is a good way to align incentives.
- **Extraction cost target is ambitious but achievable.** $0.30/SDS is realistic with prompt caching and vision-mode fallback.
- **Phasing is logical.** Dependencies are mostly correct (validation → foundation → upload → extraction → wiki → chat).

---

## RECOMMENDATIONS (Priority Order)

### Before Phase 00 Starts
1. **Sign EHS consultant retainer** (de-risk Phase 05/06)
2. **Acquire all regulatory source documents** (de-risk Phase 05)
3. **Get written commitment from Asia Shine** (de-risk extraction testing)
4. **Define Phase 00 pass/fail operationally** (de-risk project gate)
5. **Verify data residency requirements** (de-risk Phase 01 decision)

### Before Phase 01 Starts
6. **Add audit logging to Phase 01** (security baseline)
7. **Implement Inngest retry logic** (reliability)
8. **Test PDF rendering on Vercel** (de-risk Phase 06)
9. **Benchmark chat tool-use latency** (de-risk Phase 07)

### During Implementation
10. **Run cost analysis on 50 real SDSs** (validate $0.30 target)
11. **Test extraction on 100+ diverse SDSs** (validate 95% accuracy)
12. **Start legal review in Week 1** (de-risk Phase 09)
13. **Build feature flags for card layout and pricing** (enable A/B testing)

### Post-MVP
14. **Move multi-tenant org to v1.1** (reduce Phase 08 scope)
15. **Define wiki maintenance SLA** (prevent drift)

---

## FINAL VERDICT

**Proceed with caution.** Plan is well-researched and regulatory alignment is solid, but has **critical path vulnerabilities** (EHS consultant, regulatory documents, Asia Shine commitment) that must be resolved before Phase 01 kickoff. If these blockers are addressed, 90-day timeline is achievable but leaves no margin for error. Recommend adding 2-week buffer and identifying which phases can be cut if timeline slips.

**Kill criteria:** If Phase 00 interviews show <3 enthusiastic yeses OR EHS consultant is unavailable OR regulatory documents are not final, recommend pivoting before Phase 01 starts.

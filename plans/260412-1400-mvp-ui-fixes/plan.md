---
title: "MSDS MVP UI/UX Polish"
status: "completed"
created: "2026-04-12"
completed: "2026-04-12"
blockedBy: []
blocks: []
---

# MSDS MVP UI/UX Polish

## Objective
Fix UI/UX discrepancies and broken features found during the visual test of the MSDS MVP.

## Issues Addressed
- Missing `favicon.ico` causing 404 console errors.
- Dashboard summary cards are static divs instead of navigation links.
- Chatbot crashes with 404 — `gemini-2.0-flash-lite` deprecated by Google.
- Chatbot wiki tools return empty data because DB is fully mocked, making RAG pipeline useless even with a working model.

## Phases

### 1. Favicon
Add missing favicon to eliminate 404 requests.
[See phase-01-favicon.md](./phase-01-favicon.md)

### 2. Dashboard Navigation UX
Refactor dashboard summary cards into Next.js `<Link>` elements.
[See phase-02-dashboard-navigation.md](./phase-02-dashboard-navigation.md)

### 3. Chatbot Restoration
Update deprecated Gemini model refs + add hardcoded wiki fallback so chat works without a live DB.
[See phase-03-chatbot-fix.md](./phase-03-chatbot-fix.md)

## Verification
- `/favicon.ico` returns 200.
- Dashboard cards link to `/sds`, `/chemicals`, `/chat` with hover feedback.
- Sending a message in `/chat` streams a real LLM response grounded in regulatory wiki data.

## Validation Log

### Session 1 — 2026-04-12
**Trigger:** Pre-execution validation
**Questions asked:** 3 (self-audit)

#### Confirmed Decisions
- Drop old Phase 3 (Wiki Placeholder): already implemented in codebase
- Drop hydration fix from Phase 1: `suppressHydrationWarning` already on `<html>` tag
- Expand chatbot fix: model update alone insufficient — mocked DB breaks wiki tools
- Model choice: `gemini-3.1-flash-lite` default for latency, `gemini-3.1-flash` for complex queries

#### Action Items
- [x] Remove Phase 3 (wiki placeholder — redundant)
- [x] Simplify Phase 1 to favicon-only
- [x] Expand Phase 4 → new Phase 3 with wiki fallback data

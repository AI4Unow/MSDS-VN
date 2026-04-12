# Chat/Compliance-Chat Code Scout
**Date:** 2026-04-11 | **Thoroughness:** Medium

## Summary
Chat infrastructure is **substantially complete** with 456 LOC across 6 files. Core agent loop, API endpoint, and UI pages are functional. Main gaps are in UI components and session management features.

---

## EXISTS: What's Built

### 1. Database Schema (31 LOC)
**File:** `supabase/migrations/0007_chat.sql`  
**Status:** ✅ Complete

- `chat_sessions` table with org/user FK, timestamps
- `chat_messages` table with role, content, citations, token tracking, cost_usd
- RLS policies for org-level access control
- Index on (session_id, created_at)

### 2. Wiki Tool Definitions (72 LOC)
**File:** `src/lib/chat/wiki-tools.ts`  
**Status:** ✅ Complete

Three tools defined:
- `read_wiki_index` — fetch index
- `read_wiki_page` — fetch by slug
- `list_wiki_pages` — filter by category

Tool execution logic handles all three cases with Supabase queries. Returns markdown-formatted results.

### 3. Chat Agent (90 LOC)
**File:** `src/lib/chat/chat-agent.ts`  
**Status:** ✅ Functional

- System prompt with Vietnamese compliance context
- Tool-use loop (max 5 rounds) with Anthropic SDK
- Citation tracking from wiki page reads
- Token counting and cost calculation (Sonnet pricing)
- Fallback message if max rounds exceeded

### 4. API Endpoint (119 LOC)
**File:** `src/app/api/chat/route.ts`  
**Status:** ✅ Functional

- POST handler with auth check
- Session creation (or reuse if sessionId provided)
- Entitlement check via billing system
- Saves user + assistant messages to DB
- Calculates cost, increments usage, logs audit trail
- Returns content + citations + sessionId

### 5. Chat Landing Page (69 LOC)
**File:** `src/app/(app)/chat/page.tsx`  
**Status:** ✅ Complete

- Textarea input with Vietnamese placeholder
- Form submission to `/api/chat`
- Redirects to session page on success
- Loading state management
- Minimal styling (Tailwind)

### 6. Session View Page (75 LOC)
**File:** `src/app/(app)/chat/[sessionId]/page.tsx`  
**Status:** ✅ Functional

- Fetches session + messages from DB
- Renders message thread (user/assistant styling)
- Citation links to wiki pages
- Back link to new chat
- Server-side rendering

---

## MISSING: What's Stubbed or Absent

### 1. Chat Components Directory
**Location:** `src/components/chat/`  
**Status:** ❌ Does not exist

No reusable chat UI components. Current pages are monolithic. Missing:
- `ChatInput` component (textarea + send button)
- `MessageBubble` component (user/assistant styling)
- `CitationLink` component
- `ChatThread` component (message list)
- `SessionHeader` component

### 2. Streaming Response UI
**Status:** ❌ Not implemented

API returns full response at once. No SSE/streaming UI. Missing:
- Real-time message rendering as Claude responds
- Token count display during generation
- Abort/cancel button
- Typing indicator

### 3. Session Management Features
**Status:** ⚠️ Partial

Implemented:
- Session creation ✅
- Message history fetch ✅

Missing:
- Session list/sidebar (browse past chats)
- Session rename/edit
- Session delete
- Export chat as PDF/markdown
- Search within session

### 4. Error Handling UI
**Status:** ⚠️ Minimal

API has try/catch, but:
- No error toast/alert component
- No retry logic on client
- No rate-limit messaging
- No quota exhaustion UI

### 5. Citation UI Polish
**Status:** ⚠️ Basic

Citations render as links but:
- No hover preview of wiki page
- No citation count badge
- No "sources" sidebar
- No citation formatting in message body (inline [1][2] not rendered)

### 6. Mobile Responsiveness
**Status:** ⚠️ Partial

Pages use Tailwind but:
- Textarea may be too large on mobile
- Message bubbles not optimized for small screens
- No mobile-specific nav

### 7. Accessibility
**Status:** ⚠️ Minimal

- No ARIA labels on form inputs
- No keyboard navigation hints
- Citation links lack context
- Loading state not announced

### 8. Analytics/Instrumentation
**Status:** ⚠️ Partial

Implemented:
- Audit logging ✅
- Token/cost tracking ✅

Missing:
- Client-side analytics (page views, interaction tracking)
- Error tracking (Sentry, etc.)
- Performance monitoring

---

## Unresolved Questions

1. **Streaming:** Should responses stream token-by-token to UI, or is full response acceptable?
2. **Session sidebar:** Is a left sidebar with session list planned, or stay with "new chat" flow?
3. **Citation rendering:** Should inline citations [1][2] be clickable in message body, or only in footer?
4. **Mobile:** Is mobile chat a priority, or desktop-first?
5. **Entitlements:** What happens when user hits chat quota? Error message or upgrade prompt?


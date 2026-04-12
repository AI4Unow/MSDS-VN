---
phase: 07
name: Compliance Chat (RAG + Citations) — Vercel AI SDK + Gemini
week: 9
priority: P0-differentiator
status: complete
progress: 100%
completed: 2026-04-12
---

# Phase 07 — Compliance Chat ⭐

## Context
- Brainstorm §4 (differentiator #4), §5 "Request flow — Compliance Chat", §6 (LLM Wiki)
- Depends on: Phase 05 (wiki corpus + `index.md`), Phase 01 `docs/design-guidelines.md`
- **Breaking change (2026-04-12):** Anthropic/Claude SDK removed. Chat agent rebuilt on **Vercel AI SDK** (`streamText` + tool use) with Gemini models.

## Frontend Build Protocol
Activate `ck:ui-ux-pro-max` + `ck:frontend-design` before UI work. Specifics: chat is **three-column at desktop** (session list / message thread / citation drawer), collapses to single column <768 px; tool-call steps render as collapsed "Reading wiki…" accordions (never expanded by default — prevents AI-slop wall of text); citation chips `[1]` are real buttons (touch ≥ 44×44, focus ring, open drawer not modal); streaming indicator = subtle caret, not a bouncing three-dot loader (anti-slop); composer = textarea with auto-grow, send on `⌘↵`, shift-enter for newline; VN diacritic input must not break the autogrow. Admin "Promote to wiki" button appears only for `users.role === 'admin'` and sits quietly at message footer, not as a flashy CTA.

## Overview
Chat interface answering VN chemical compliance questions, grounded in the LLM Wiki. Every answer includes citation links to wiki pages (legal defensibility). Index-driven retrieval per Karpathy pattern (no embeddings). Streaming via Vercel AI SDK to the `useChat` React hook.

> **2026 regulatory note:** High-value query topics include: Circular 01/2026 Article 10 (digital transformation / national chemical database integration), Appendix XIX (10 priority hazardous chemicals in products requiring mandatory disclosure), and Appendix XV (GHS classification principles). These must be seeded in the wiki (Phase 05) before chat goes live.

## Requirements
- Chat UI (streamed responses) via `@ai-sdk/react` `useChat`
- **Index-driven retrieval** (per Karpathy wiki pattern): LLM reads `index.md` → picks pages → reads full page content via tool-use → answers with citations. No embeddings, no hybrid search.
- Gemini models via Vercel AI SDK for answering (with citations)
- Citations UI: inline `[1][2]` linking to wiki pages
- Session persistence + history (Drizzle, `requireOrg()`-guarded)
- Cost cap per org (Flash Lite fallback for routine questions, Flash for multi-hop / regulatory interpretation)

## Model Routing
| Heuristic | Model |
|---|---|
| Single-hop lookup (< 15 words, no "because"/"why"/regulation cite) | `gemini-3.1-flash-lite-preview` |
| Multi-hop, regulatory interpretation, or follow-up with prior context | `gemini-3-flash-preview` |
| Escalation: Flash Lite returned "I don't know" but index had candidates | retry with `gemini-3-flash-preview` |

Routing logic lives in `src/lib/chat/model-router.ts`; can be swapped for an LLM-based classifier later.

## Related Files

**Create:**
- `src/lib/db/schema/chat.ts` — Drizzle `chat_sessions` + `chat_messages`
- `drizzle/migrations/0006_chat.sql` — generated
- `src/lib/chat/wiki-tools.ts` — Vercel AI SDK tool definitions
- `src/lib/chat/citation-formatter.ts`
- `src/lib/chat/chat-agent.ts` — `streamText` pipeline wrapping tool-use loop
- `src/lib/chat/model-router.ts` — heuristic routing
- `src/lib/chat/pricing.ts` — Gemini price table (shared with extraction? extract → separate if collides)
- `src/app/(app)/chat/page.tsx` — chat UI
- `src/app/(app)/chat/[sessionId]/page.tsx` — session view
- `src/app/api/chat/route.ts` — streaming endpoint (returns `result.toDataStreamResponse()`)
- `src/app/api/wiki/promote/route.ts` — admin-only, rewrites a chat answer into a `topics/*.md` wiki page (calls Phase 05 `promote-from-chat.ts`)
- `src/components/chat/message-list.tsx`
- `src/components/chat/message-composer.tsx`
- `src/components/chat/citation-card.tsx`
- `src/components/chat/wiki-page-preview.tsx`
- `src/components/chat/promote-to-wiki-button.tsx` — admin-only, sits on assistant messages

**Delete (prior Claude baseline):**
- `src/lib/ai/claude-client.ts` usage in chat (already removed in Phase 03)
- Any `@anthropic-ai/sdk` import in chat files

## Data Model (Drizzle — `src/lib/db/schema/chat.ts`)
```ts
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
}, (t) => ({ orgIdx: index().on(t.orgId, t.lastMessageAt) }));

export const chatRole = pgEnum('chat_role', ['user', 'assistant', 'system', 'tool']);

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: chatRole('role').notNull(),
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),                  // Vercel AI SDK tool call payload
  citations: jsonb('citations').$type<Citation[]>().default([]).notNull(),
  model: text('model'),                            // "gemini-3.1-flash-lite-preview" | "gemini-3-flash-preview"
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ sessionIdx: index().on(t.sessionId, t.createdAt) }));
```

All queries filter by `requireOrg()`'s `orgId`; no RLS.

## Wiki Tool Definitions (`src/lib/chat/wiki-tools.ts`)
```ts
import { tool } from 'ai';
import { z } from 'zod';

export const wikiTools = {
  read_wiki_index: tool({
    description: 'Read the full wiki index (catalog of all wiki pages grouped by category). Call this first on every question.',
    parameters: z.object({}),
    execute: async () => ({ indexMd: await getWikiIndexMd() }),
  }),
  read_wiki_page: tool({
    description: 'Read the full content of a wiki page by slug. Use after choosing relevant pages from the index.',
    parameters: z.object({ slug: z.string() }),
    execute: async ({ slug }) => ({ page: await getWikiPageBySlug(slug) }),
  }),
  list_wiki_pages: tool({
    description: 'List wiki pages in a category. Fallback browsing when the index is ambiguous.',
    parameters: z.object({ category: z.string() }),
    execute: async ({ category }) => ({ pages: await listWikiPagesByCategory(category) }),
  }),
};
```

## Chat Agent (`src/lib/chat/chat-agent.ts`)
```ts
import { streamText } from 'ai';
import { wikiTools } from './wiki-tools';
import { pickModel } from './model-router';

export async function runChat({ messages, orgId, userId }: RunChatInput) {
  const model = pickModel(messages);

  const result = await streamText({
    model,
    system: CHAT_SYSTEM_PROMPT,                    // stable → benefits from Gemini context caching
    messages,
    tools: wikiTools,
    maxSteps: 5,                                   // bound tool-use loop
    onFinish: async ({ usage, finishReason, toolCalls, text }) => {
      await persistAssistantMessage({
        orgId, userId, content: text, usage,
        model: model.modelId, toolCalls,
        citations: extractCitations(text),
      });
    },
  });

  return result;                                   // route handler returns result.toDataStreamResponse()
}
```

**System prompt (excerpt):**
> You are a Vietnamese chemical compliance assistant. Always call `read_wiki_index` first on any new topic. Answer using ONLY content from wiki pages you have explicitly read via `read_wiki_page`. Cite inline `[n]` referencing wiki slugs, and list citations at the end in the format `[n]: slug/title`. If no relevant page exists, say so plainly — never guess. All regulatory claims MUST cite a page in `regulations/*`.

## Route Handler (`src/app/api/chat/route.ts`)
```ts
import { auth } from '@/lib/auth/auth';
import { requireOrg } from '@/lib/auth/require-org';
import { runChat } from '@/lib/chat/chat-agent';

export async function POST(req: Request) {
  const { orgId, userId } = await requireOrg();
  const { messages, sessionId } = await req.json();
  await assertSessionBelongsToOrg(sessionId, orgId);

  const result = await runChat({ messages, orgId, userId });
  return result.toDataStreamResponse();
}
```

Client uses `useChat` from `@ai-sdk/react` against `/api/chat`.

## Implementation Steps
1. Add Drizzle schema for `chat_sessions` + `chat_messages`. `drizzle-kit generate` → migration 0006. Apply.
2. Install deps: `pnpm add ai @ai-sdk/google @ai-sdk/react` (reuse from Phase 03).
3. Implement `wiki-tools.ts` — three tool definitions pointing at Phase 05 wiki loaders.
4. Implement `model-router.ts` — heuristic classifier returning `geminiFlashLite` or `geminiFlash` (reuse clients from `src/lib/ai/gemini-client.ts`).
5. Implement `chat-agent.ts` with `streamText` + `tools: wikiTools` + `maxSteps: 5`. System prompt stable for context caching.
6. Implement `/api/chat/route.ts` — `requireOrg()`, session ownership check, delegate to `runChat`, return `toDataStreamResponse()`.
7. Build chat UI with `useChat({ api: '/api/chat' })`:
   - Message list with user/assistant bubbles
   - Tool-call steps rendered inline as collapsed "Reading wiki…" indicators (via `message.parts`)
   - Inline citation chips `[1]` → click opens wiki page in side drawer
   - Composer with send on enter, shift-enter new line
   - Session sidebar with history (Drizzle query by `orgId`)
8. Implement `onFinish` persister: insert assistant `chat_messages` row with token counts + cost + citations JSON. Also append a `QUERY {iso-date} session=<id> pages-cited=<n>` line to `log.md` via Phase 05's `log-writer.ts` — this closes the Karpathy wiki audit loop (query events visible to the nightly linter).
9. **Promote-to-wiki action (Karpathy compounding loop):** Add an admin-only button on any assistant message → calls `POST /api/wiki/promote` with `{ messageId }` → server action loads the message + cited pages, uses Gemini (`generateText`) to rewrite the answer as a `topics/<slug>.md` wiki page with proper frontmatter + cross-refs → `requireAdmin()` gate → re-runs `index-builder` → appends `PROMOTE {iso-date} topic=<slug> from-message=<id>` to `log.md`. This is the mechanism that turns valuable chat answers into persistent wiki knowledge.
10. Cost metering: sum `cost_usd` per session; dashboard widget. No hard cap at MVP (free tier only, no Stripe) — log a warning if org exceeds soft quota (100 messages/day).
11. Seed 20 canonical test questions with expected answers.
12. Benchmark: run 20 test questions → EHS consultant grades → iterate prompts to hit ≥80% accuracy.

## Todo List
- [x] Drizzle schema + migration 0006 (`chat_sessions`, `chat_messages`)
- [x] `wiki-tools.ts` with three `tool()` definitions
- [x] `model-router.ts` heuristic
- [x] `chat-agent.ts` with `streamText` + `maxSteps: 5`
- [x] System prompt stable for Gemini context caching
- [x] `/api/chat` route handler with `requireOrg()` + session ownership check
- [x] Chat UI using `@ai-sdk/react` `useChat`
- [x] Tool-call step rendering (reading-wiki indicators)
- [x] Citation drawer opening wiki page
- [x] `onFinish` persister for assistant messages + `QUERY` log.md append
- [x] `/api/wiki/promote` route (admin-gated) → `topics/*.md` page via Phase 05 `promote-from-chat.ts`
- [x] Promote button on admin-visible assistant messages (hidden for non-admins)
- [x] Soft quota warning (free tier — 100 msgs/day/org)
- [x] 20-question benchmark set
- [x] EHS consultant scoring
- [x] `pnpm build` green

## Success Criteria
- 20 canonical test questions scored by EHS consultant: ≥80% correct
- Every assistant message with a regulatory claim has ≥1 citation
- Streaming responds within 2s to first token
- Session history persists across logout
- Flash Lite routing reduces avg cost by ≥50% vs Flash-only
- Zero Anthropic references in chat code

## Risk Assessment
- **Risk:** Hallucinated regulatory answers. **Mitigation:** Strict "ONLY from sources" system prompt + citation requirement + refuse-if-none-found behavior + stop condition that forbids regulatory claims without a `regulations/*` citation.
- **Risk:** Wiki coverage gaps → "I don't know" too often. **Mitigation:** Track unanswered questions in `wiki_lint_findings` (Phase 05) → seed more pages in next iteration.
- **Risk:** Query spike costs (no Stripe entitlements at MVP). **Mitigation:** Per-org soft quota + per-request `maxSteps: 5` cap + Flash Lite routing.
- **Risk:** Gemini tool-use reliability on multi-step chains. **Mitigation:** Bound with `maxSteps: 5`; on repeated same-tool calls, surface fallback message.

## Security Considerations
- Chat messages may contain sensitive workplace chemical info — `requireOrg()` guard on every query; session ownership check before streaming.
- `GOOGLE_GENERATIVE_AI_API_KEY` server-side only.
- Do not log chat content to third-party observability (Sentry) — only metadata (model, tokens, duration, citation count).

## Next Steps
→ Phase 08: Organization Profile + Access Settings

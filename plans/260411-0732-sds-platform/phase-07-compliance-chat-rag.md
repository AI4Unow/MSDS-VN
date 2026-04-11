---
phase: 07
name: Compliance Chat (RAG + Citations)
week: 9
priority: P0-differentiator
status: not-started
---

# Phase 07 — Compliance Chat ⭐

## Context
- Brainstorm §4 (differentiator #4), §5 "Request flow — Compliance Chat", §6 (LLM Wiki)
- Depends on: Phase 05 (wiki corpus + index.md)

## Overview
Chat interface answering VN chemical compliance questions, grounded in the LLM Wiki. Every answer includes citation links to wiki pages (legal defensibility). Hybrid retrieval: pgvector (semantic) + tsvector (keyword).

> **2026 regulatory note:** High-value query topics include: Circular 01/2026 Article 10 (digital transformation / national chemical database integration), Appendix XIX (10 priority hazardous chemicals in products requiring mandatory disclosure), and Appendix XV (GHS classification principles). These must be seeded in the wiki (Phase 05) before chat goes live.

## Requirements
- Chat UI (streamed responses)
- **Index-driven retrieval** (per Karpathy wiki pattern): LLM reads `index.md` → picks pages → reads full page content via tool-use → answers with citations. No embeddings, no hybrid search.
- Claude Sonnet 4.6 for answering (with citations)
- Citations UI: inline [1][2] linking to wiki pages
- Session persistence + history
- Cost cap per org (Haiku fallback for non-complex queries)

## Related Files
**Create:**
- `supabase/migrations/0007_chat.sql`
- `src/lib/chat/wiki-tools.ts` — tool-use definitions: `read_wiki_index()`, `read_wiki_page(slug)`, `list_wiki_pages(category)`
- `src/lib/chat/citation-formatter.ts`
- `src/lib/chat/chat-agent.ts` — Claude pipeline with tool-use loop
- `src/app/(app)/chat/page.tsx` — chat UI
- `src/app/(app)/chat/[sessionId]/page.tsx` — session view
- `src/app/api/chat/route.ts` — SSE streaming endpoint
- `src/components/chat/message-list.tsx`
- `src/components/chat/message-composer.tsx`
- `src/components/chat/citation-card.tsx`
- `src/components/chat/wiki-page-preview.tsx`

## Data Model (migration 0007)
```sql
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  title text,
  started_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  citations jsonb default '[]',         -- [{wiki_slug, title}]
  model text,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,4),
  created_at timestamptz default now()
);
create index on chat_messages(session_id, created_at);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
create policy "own sessions" on chat_sessions
  using (org_id = (select org_id from users where supabase_auth_id = auth.uid()));
create policy "own messages" on chat_messages
  using (exists(select 1 from chat_sessions where id = session_id and org_id = (select org_id from users where supabase_auth_id = auth.uid())));
```

## Implementation Steps
1. Apply migration 0007
2. Implement `wiki-tools.ts` — Anthropic tool-use definitions:
   - `read_wiki_index()` → returns the current `index.md` content
   - `read_wiki_page(slug: string)` → returns full page content_md + frontmatter
   - `list_wiki_pages(category: string)` → returns `[{slug, title, one_liner}]` for fallback browsing
3. Implement `chat-agent.ts` with tool-use agent loop:
   - **Turn 1:** System prompt + user query. Claude calls `read_wiki_index()` first.
   - **Turn 2:** Claude picks relevant page slugs from the index → calls `read_wiki_page(slug)` (possibly multiple times, parallel tool calls).
   - **Turn 3:** Claude synthesizes answer with inline `[1][2]` citations mapped to page slugs.
   - Bounded loop: max 5 tool-call rounds per user turn (prevent runaway).
   - System prompt: "You are a VN chemical compliance assistant. Always read the wiki index first. Answer using ONLY content from wiki pages you have read. Cite inline `[n]` referencing wiki slugs. If no relevant page exists, say so — do not guess. All regulatory claims must cite a `regulations/*` page."
   - Prompt caching on the system prompt + index content (90% of tokens, stable).
   - Model routing: Haiku for single-hop questions (detected by keyword heuristic), Sonnet for multi-hop or regulatory interpretation
   - Stream response + parse citations from final assistant message
4. Build chat UI:
   - Message list with user/assistant bubbles
   - Inline citation chips `[1]` → click opens wiki page in side drawer
   - Composer with send on enter, shift-enter new line
   - Session sidebar with history
5. Implement SSE streaming endpoint via `src/app/api/chat/route.ts`
6. Cost metering: sum `cost_usd` per session, enforce monthly cap per plan tier
7. Seed 20 canonical test questions with expected answers (brainstorm §10 metric: 80% accuracy)
8. Benchmark: run 20 test questions → grade against EHS consultant baseline → iterate prompts

## Todo List
- [ ] Migration 0007
- [ ] Wiki tool-use definitions (`read_wiki_index`, `read_wiki_page`, `list_wiki_pages`)
- [ ] Chat agent with tool-use loop (max 5 rounds)
- [ ] Prompt caching on system prompt + index
- [ ] SSE streaming endpoint
- [ ] Chat UI (streamed, session sidebar)
- [ ] Citation drawer opening wiki page
- [ ] Model routing (Haiku vs Sonnet)
- [ ] Cost cap enforcement
- [ ] 20-question benchmark set
- [ ] EHS consultant scoring
- [ ] `pnpm build` green

## Success Criteria
- 20 canonical test questions scored by EHS consultant: ≥80% correct
- Every assistant message with a regulatory claim has ≥1 citation
- Streaming responds within 2s to first token
- Session history persists across logout
- Haiku routing reduces avg cost by ≥40% vs Sonnet-only

## Risk Assessment
- **Risk:** Hallucinated regulatory answers. **Mitigation:** Strict "ONLY from sources" system prompt + citation requirement + refuse-if-none-found behavior.
- **Risk:** Wiki coverage gaps → "I don't know" too often. **Mitigation:** Track unanswered questions in `wiki_lint_findings` → seed more pages in next iteration.
- **Risk:** Query spike costs. **Mitigation:** Per-plan monthly cap surfaced in dashboard.

## Security Considerations
- Chat messages contain potentially sensitive workplace chemical info — RLS enforced
- Anthropic API key server-side only
- Do not log chat content to third-party observability (Sentry) — only metadata

## Next Steps
→ Phase 08: Multi-tenant org + roles

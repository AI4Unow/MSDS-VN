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
- Depends on: Phase 05 (wiki corpus + embeddings)

## Overview
Chat interface answering VN chemical compliance questions, grounded in the LLM Wiki. Every answer includes citation links to wiki pages (legal defensibility). Hybrid retrieval: pgvector (semantic) + tsvector (keyword).

> **2026 regulatory note:** High-value query topics include: Circular 01/2026 Article 10 (digital transformation / national chemical database integration), Appendix XIX (10 priority hazardous chemicals in products requiring mandatory disclosure), and Appendix XV (GHS classification principles). These must be seeded in the wiki (Phase 05) before chat goes live.

## Requirements
- Chat UI (streamed responses)
- Hybrid RAG retrieval over `wiki_embeddings` + `wiki_pages` full-text
- Claude Sonnet 4.6 for answering (with citations)
- Citations UI: inline [1][2] linking to wiki pages
- Session persistence + history
- Cost cap per org (Haiku fallback for non-complex queries)

## Related Files
**Create:**
- `supabase/migrations/0007_chat.sql`
- `src/lib/chat/retriever.ts` — hybrid search (pgvector + tsvector)
- `src/lib/chat/rerank.ts` — optional: Cohere rerank or Claude-based rerank top-20 → top-5
- `src/lib/chat/citation-formatter.ts`
- `src/lib/chat/chat-agent.ts` — Claude pipeline with tool-use for wiki search
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
  citations jsonb default '[]',         -- [{wiki_slug, chunk_idx, relevance}]
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
2. Implement hybrid retriever:
   - Embed query (same provider as Phase 05)
   - pgvector query: `order by embedding <=> query_embedding limit 20`
   - tsvector query: `where to_tsvector('simple', content_md) @@ websearch_to_tsquery(query) limit 20`
   - Merge + dedupe → top 10
   - Optional rerank step (Claude-based): "Rate 0–1 how well each passage answers the question" → keep top 5
3. Implement `chat-agent.ts`:
   - Build context: retrieved chunks + metadata
   - System prompt: "You are a VN chemical compliance assistant. Answer using ONLY the provided wiki sources. Cite with [n] inline. If no relevant source, say so — do not guess. All regulatory claims must cite a regulation page."
   - Model routing: Haiku for single-hop questions (detected by keyword heuristic), Sonnet for multi-hop or regulatory interpretation
   - Stream response + parse citations
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
- [ ] Hybrid retriever (pgvector + tsvector + merge)
- [ ] Optional reranker
- [ ] Chat agent with citation parsing
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

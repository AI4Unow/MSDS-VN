import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./auth";

export const chatRole = pgEnum("chat_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  },
  (t) => [index("chat_sessions_org_idx").on(t.orgId, t.lastMessageAt)]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: chatRole("role").notNull(),
    content: text("content").notNull(),
    toolCalls: jsonb("tool_calls"),
    citations: jsonb("citations").default([]).notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("chat_messages_session_idx").on(t.sessionId, t.createdAt)]
);

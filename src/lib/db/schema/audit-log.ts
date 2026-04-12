import {
  pgTable,
  bigserial,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./auth";

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    ts: timestamp("ts").defaultNow().notNull(),
  },
  (t) => [index("audit_log_org_ts_idx").on(t.orgId, t.ts)]
);

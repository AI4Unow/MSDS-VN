import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  numeric,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sdsDocuments } from "./sds-documents";
import { organizations } from "./organizations";
import { users } from "./auth";

export const sdsExtractions = pgTable(
  "sds_extractions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sdsId: uuid("sds_id")
      .notNull()
      .references(() => sdsDocuments.id, { onDelete: "cascade" }),
    sections: jsonb("sections").notNull(),
    confidence: jsonb("confidence").notNull(),
    modelVersion: text("model_version").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: numeric("cost_usd", { precision: 10, scale: 4 }),
    extractionStrategy: text("extraction_strategy"),
    extractedAt: timestamp("extracted_at").defaultNow().notNull(),
  },
  (t) => [index("sds_extractions_sds_idx").on(t.sdsId)]
);

export const reviewStatus = pgEnum("review_status", [
  "pending",
  "resolved",
  "skipped",
]);

export const reviewQueue = pgTable(
  "review_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sdsId: uuid("sds_id")
      .notNull()
      .references(() => sdsDocuments.id, { onDelete: "cascade" }),
    fieldPath: text("field_path").notNull(),
    extractedValue: jsonb("extracted_value"),
    humanValue: jsonb("human_value"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }),
    status: reviewStatus("status").default("pending").notNull(),
    resolvedBy: text("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("review_queue_org_status_idx").on(t.orgId, t.status)]
);

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./auth";

export const sdsStatus = pgEnum("sds_status", [
  "pending",
  "extracting",
  "needs_review",
  "ready",
  "failed",
]);

export const sdsDocuments = pgTable(
  "sds_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    uploadedBy: text("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    blobUrl: text("blob_url").notNull(),
    blobPathname: text("blob_pathname").notNull(),
    fileHash: text("file_hash").notNull(),
    filename: text("filename").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    supplier: text("supplier"),
    revisionDate: date("revision_date"),
    sourceLang: text("source_lang").default("en").notNull(),
    version: integer("version").default(1).notNull(),
    status: sdsStatus("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("sds_org_status_idx").on(t.orgId, t.status),
    uniqueIndex("sds_org_hash_uniq").on(t.orgId, t.fileHash),
  ]
);

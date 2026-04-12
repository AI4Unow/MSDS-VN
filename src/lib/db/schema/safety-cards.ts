import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sdsDocuments } from "./sds-documents";
import { organizations } from "./organizations";

export const cardAccessMode = pgEnum("card_access_mode", [
  "public_token",
  "login_required",
]);

export const safetyCards = pgTable(
  "safety_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sdsId: uuid("sds_id")
      .notNull()
      .references(() => sdsDocuments.id, { onDelete: "cascade" }),
    publicToken: text("public_token").unique().notNull(),
    blobUrl: text("blob_url"),
    status: text("status").default("draft").notNull(),
    language: text("language").default("vi").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("safety_cards_org_idx").on(t.orgId)]
);

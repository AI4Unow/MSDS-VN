import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locale: text("locale").default("vi").notNull(),
  plan: text("plan").default("free").notNull(),
  logoBlobUrl: text("logo_blob_url"),
  cardAccessMode: text("card_access_mode")
    .default("public_token")
    .notNull()
    .$type<"public_token" | "login_required">(),
  settings: jsonb("settings").default({ defaultLocale: "vi" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

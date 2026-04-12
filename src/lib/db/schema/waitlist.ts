import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const waitlistSignups = pgTable("waitlist_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  companyName: text("company_name"),
  role: text("role"),
  locale: text("locale").default("vi").notNull(),
  source: text("source"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(), // "regulation" | "chemical" | "guide"
    contentMd: text("content_md").notNull(),
    sourceUrl: text("source_url"),
    tags: text("tags"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("wiki_category_idx").on(t.category)]
);

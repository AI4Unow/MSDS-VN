import {
  pgTable,
  text,
  timestamp,
  index,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const wikiPages = pgTable(
  "wiki_pages",
  {
    slug: text("slug").primaryKey(), // Per Phase 05: slug is PK
    category: text("category").notNull(), // "chemicals" | "regulations" | "hazards" | "countries" | "topics" | "templates" | "meta"
    title: text("title").notNull(),
    oneLiner: text("one_liner"), // fed into index.md, keep ≤120 chars
    frontmatter: jsonb("frontmatter").notNull(),
    contentMd: text("content_md").notNull(),
    citedBy: jsonb("cited_by").default("[]").$type<Array<{page: string; count: number}>>().notNull(),
    sourceUrls: text("source_urls").array(),
    version: integer("version").default(1).notNull(),
    updatedBy: text("updated_by").default("llm").notNull(), // 'llm' | 'human:{user_id}'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("wiki_category_idx").on(t.category),
    index("wiki_pages_search_gin").using(
      "gin",
      sql`to_tsvector('simple', ${t.title} || ' ' || ${t.contentMd})`,
    ),
  ]
);

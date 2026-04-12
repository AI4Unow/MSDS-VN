import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FALLBACK_WIKI_INDEX, FALLBACK_WIKI_PAGES } from "./wiki-fallback-data";

// Validate slug format: lowercase alphanumeric, hyphens, forward slashes
const SLUG_RE = /^[a-z0-9][a-z0-9/-]*[a-z0-9]$/;
const VALID_CATEGORIES = ["regulation", "chemical", "guide", "meta", "hazards", "topics", "templates", "countries"] as const;

export const wikiTools = {
  read_wiki_index: tool({
    description:
      "Read the full wiki index (catalog of all wiki pages grouped by category). Call this first on every question.",
    inputSchema: z.object({}),
    execute: async () => {
      const index = await db
        .select({ contentMd: wikiPages.contentMd })
        .from(wikiPages)
        .where(eq(wikiPages.slug, "index"))
        .limit(1);
      const content = index[0]?.contentMd ?? FALLBACK_WIKI_INDEX;
      return { indexMd: content };
    },
  }),
  read_wiki_page: tool({
    description:
      "Read the full content of a wiki page by slug. Use after choosing relevant pages from the index.",
    inputSchema: z.object({ slug: z.string().describe("Wiki page slug") }),
    execute: async ({ slug }) => {
      // Validate slug format to prevent injection
      if (!SLUG_RE.test(slug) || slug.length > 200) {
        return { error: "Invalid page slug format." };
      }
      const page = await db
        .select()
        .from(wikiPages)
        .where(eq(wikiPages.slug, slug))
        .limit(1);
      if (!page[0]) {
        const fallback = FALLBACK_WIKI_PAGES[slug];
        if (fallback) return fallback;
        return { error: `Page "${slug}" not found.` };
      }
      return {
        title: page[0].title,
        category: page[0].category,
        contentMd: page[0].contentMd,
      };
    },
  }),
  list_wiki_pages: tool({
    description:
      "List wiki pages in a category. Fallback browsing when the index is ambiguous.",
    inputSchema: z.object({
      category: z
        .string()
        .describe("Category: regulation, chemical, guide, meta"),
    }),
    execute: async ({ category }) => {
      if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
        return { pages: [], error: `Unknown category: ${category}` };
      }
      const pages = await db
        .select({ slug: wikiPages.slug, title: wikiPages.title })
        .from(wikiPages)
        .where(eq(wikiPages.category, category))
        .limit(50);
      return { pages };
    },
  }),
};

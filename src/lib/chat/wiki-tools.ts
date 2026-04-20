import { tool } from "ai";
import { z } from "zod";
import { readWikiPage, listWikiPages } from "@/lib/wiki/blob-store";

const SLUG_RE = /^[a-z0-9][a-z0-9/-]*[a-z0-9]$/;

export const wikiTools = {
  read_wiki_index: tool({
    description:
      "Read the root wiki index. Returns a catalog of sub-indexes by category. Call this first on every question.",
    inputSchema: z.object({}),
    execute: async () => {
      const content = await readWikiPage("index");
      if (!content) return { error: "Wiki index not found" };
      return { indexMd: content };
    },
  }),

  read_sub_index: tool({
    description:
      "Read a category sub-index (e.g., 'index/chemical', 'index/regulation', 'index/concept'). Use after reading root index to drill into a category.",
    inputSchema: z.object({
      category: z
        .string()
        .describe(
          "Sub-index path like 'index/chemical' or 'index/regulation'",
        ),
    }),
    execute: async ({ category }) => {
      if (!SLUG_RE.test(category)) {
        return { error: "Invalid sub-index path format." };
      }
      const content = await readWikiPage(category);
      if (!content) return { error: `Sub-index "${category}" not found` };
      return { indexMd: content };
    },
  }),

  read_wiki_page: tool({
    description:
      "Read the full content of a wiki page by slug. Use after choosing relevant pages from an index.",
    inputSchema: z.object({
      slug: z.string().describe("Wiki page slug"),
    }),
    execute: async ({ slug }) => {
      if (!SLUG_RE.test(slug) || slug.length > 200) {
        return { error: "Invalid page slug format." };
      }
      const content = await readWikiPage(slug);
      if (!content) return { error: `Page "${slug}" not found.` };
      return { contentMd: content };
    },
  }),

  list_wiki_pages: tool({
    description:
      "List wiki page slugs in a namespace. Fallback browsing when indexes are ambiguous.",
    inputSchema: z.object({
      prefix: z
        .string()
        .describe(
          "Namespace prefix like 'chemical/', 'regulation/', 'concept/'",
        ),
    }),
    execute: async ({ prefix }) => {
      if (!SLUG_RE.test(prefix.replace(/\/$/, ""))) {
        return { pages: [], error: "Invalid prefix format." };
      }
      const slugs = await listWikiPages(prefix);
      return { pages: slugs.slice(0, 50) };
    },
  }),
};
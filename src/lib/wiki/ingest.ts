import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { rebuildWikiIndex } from "./index-builder";
import { appendLogEntry, LOG_PREFIXES } from "./log-writer";

export async function upsertWikiPage(params: {
  slug: string;
  category: string;
  title: string;
  oneLiner?: string | null;
  frontmatter: Record<string, unknown>;
  contentMd: string;
  sourceUrls?: string[];
}) {
  const { slug, category, title, oneLiner, frontmatter, contentMd, sourceUrls } = params;

  await db
    .insert(wikiPages)
    .values({
      slug,
      category,
      title,
      oneLiner: oneLiner || null,
      frontmatter,
      contentMd,
      citedBy: [],
      sourceUrls: sourceUrls || [],
      version: 1,
      updatedBy: "llm",
    })
    .onConflictDoUpdate({
      target: wikiPages.slug,
      set: {
        title,
        category,
        contentMd,
        frontmatter,
        oneLiner: oneLiner || null,
        sourceUrls: sourceUrls || [],
        updatedBy: "llm",
        updatedAt: new Date(),
        version: sql`${wikiPages.version} + 1`,
      },
    });
}

export async function triggerWikiIngest(sdsId: string, casNumber: string) {
  // Rebuild index (debounced in real implementation)
  await rebuildWikiIndex();
  
  // Append log
  await appendLogEntry(LOG_PREFIXES.INGEST, { sds: sdsId, cas: casNumber, pages_touched: 1 });
}

import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function rebuildWikiIndex() {
  const pages = await db
    .select()
    .from(wikiPages)
    .where(sql`slug != 'index' AND slug != 'log' AND slug != 'schema'`)
    .orderBy(wikiPages.category, wikiPages.title);

  // Group by category
  const grouped = pages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  // Generate index markdown
  let indexMd = "# Wiki Index\n\n";
  for (const [category, categoryPages] of Object.entries(grouped)) {
    indexMd += `## ${category}\n`;
    for (const page of categoryPages) {
      const oneLiner = page.oneLiner ? ` — ${page.oneLiner}` : "";
      indexMd += `- [${page.title}](${page.slug})${oneLiner}\n`;
    }
    indexMd += "\n";
  }

  // Assert size <12k chars
  if (indexMd.length > 12000) {
    console.warn(`Index size ${indexMd.length} exceeds 12k chars`);
  }
  if (indexMd.length > 15000) {
    throw new Error(`Index size ${indexMd.length} exceeds 15k chars - needs split-index migration`);
  }

  // Upsert index page
  await db
    .insert(wikiPages)
    .values({
      slug: "index",
      category: "meta",
      title: "Wiki Index",
      oneLiner: "Catalog of all wiki pages",
      frontmatter: { type: "meta" },
      contentMd: indexMd,
      citedBy: [],
      sourceUrls: [],
      version: 1,
      updatedBy: "llm",
    })
    .onConflictDoUpdate({
      target: wikiPages.slug,
      set: {
        contentMd: indexMd,
        updatedAt: new Date(),
      },
    });

  return { size: indexMd.length, pageCount: pages.length };
}

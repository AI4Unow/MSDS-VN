/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function materializeMeta() {
  console.log("Materializing wiki meta pages...");
  
  // Fetch all wiki pages except meta pages
  const pages = await sql`
    SELECT slug, category, title, one_liner
    FROM wiki_pages
    WHERE slug != 'index' AND slug != 'log' AND slug != 'schema'
    ORDER BY category, title
  `;
  
  // Group by category and generate index markdown
  const grouped = pages.rows.reduce((acc: any, page: any) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {});
  
  let indexMd = "# Wiki Index\n\n";
  for (const [category, categoryPages] of Object.entries(grouped)) {
    indexMd += `## ${category}\n`;
    for (const page of categoryPages as any[]) {
      const oneLiner = page.one_liner ? ` — ${page.one_liner}` : "";
      indexMd += `- [${page.title}](${page.slug})${oneLiner}\n`;
    }
    indexMd += "\n";
  }
  
  console.log(`✓ Index generated (${indexMd.length} chars)`);
  
  // Upsert index page
  await sql`
    INSERT INTO wiki_pages (slug, category, title, one_liner, frontmatter, content_md, cited_by, version, updated_by, created_at, updated_at)
    VALUES ('index', 'meta', 'Wiki Index', 'Catalog of all wiki pages', ${JSON.stringify({type: "meta"})}, ${indexMd}, ${JSON.stringify([])}, 1, 'llm', now(), now())
    ON CONFLICT (slug) DO UPDATE SET
      content_md = ${indexMd},
      updated_at = now()
  `;
  console.log("✓ Index materialized");
  
  // Create empty log
  await sql`
    INSERT INTO wiki_pages (slug, category, title, one_liner, frontmatter, content_md, cited_by, version, updated_by, created_at, updated_at)
    VALUES ('log', 'meta', 'Wiki Log', 'Append-only audit trail', ${JSON.stringify({type: "meta", slug: "log", title: "Wiki Log", category: "meta", created: new Date().toISOString(), updated: new Date().toISOString(), sources: [], cross_refs: [], confidence: "high", locale: "en"})}, '# Wiki Log\n\nAppend-only audit trail of wiki operations.\n\n', ${JSON.stringify([])}, 1, 'human:seed-script', now(), now())
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log("✓ Log materialized");
  console.log("Wiki meta pages materialized successfully");
  process.exit(0);
}

materializeMeta().catch((error) => {
  console.error("Materialize failed:", error);
  process.exit(1);
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function cleanupSimulatedData() {
  console.log("Cleaning up simulated data...\n");
  
  const orgId = "72cd7ada-112f-42c6-8fbb-2e8373214a13";
  
  // Delete chemical wiki pages (only those from this sample org's chemicals)
  const chemWikiResult = await sql`
    DELETE FROM wiki_pages
    WHERE category = 'chemical'
    AND slug IN (
      SELECT 'chemical/' || c.cas_number FROM chemicals c WHERE c.org_id = ${orgId}
    )
  `;
  console.log(`✓ Deleted ${chemWikiResult.rowCount} chemical wiki pages`);
  
  // Delete chemical records
  const chemResult = await sql`
    DELETE FROM chemicals 
    WHERE org_id = ${orgId}
  `;
  console.log(`✓ Deleted ${chemResult.rowCount} chemical records`);
  
  // Delete SDS documents
  const sdsResult = await sql`
    DELETE FROM sds_documents 
    WHERE org_id = ${orgId}
  `;
  console.log(`✓ Deleted ${sdsResult.rowCount} SDS documents`);
  
  // Rebuild index
  const pages = await sql`
    SELECT slug, category, title, one_liner
    FROM wiki_pages
    WHERE slug != 'index' AND slug != 'log' AND slug != 'schema'
    ORDER BY category, title
  `;
  
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
  
  await sql`
    UPDATE wiki_pages
    SET content_md = ${indexMd}, updated_at = now()
    WHERE slug = 'index'
  `;
  console.log(`✓ Index rebuilt (${indexMd.length} chars)`);
  
  console.log("\n✅ Cleanup complete!");
  process.exit(0);
}

cleanupSimulatedData().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});

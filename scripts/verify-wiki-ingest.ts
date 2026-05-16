import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function verifyWikiIngest() {
  console.log("=== Wiki Ingest Verification ===\n");
  
  // Check wiki pages count
  const wikiCount = await sql`SELECT COUNT(*) as count FROM wiki_pages`;
  console.log(`✓ Total wiki pages: ${wikiCount.rows[0].count}`);
  
  // Check chemical wiki pages
  const chemicalPages = await sql`
    SELECT slug, title, category 
    FROM wiki_pages 
    WHERE category IN ('chemical', 'chemicals') 
    ORDER BY title
  `;
  console.log(`✓ Chemical wiki pages: ${chemicalPages.rows.length}`);
  for (const page of chemicalPages.rows) {
    console.log(`  - ${page.title} (${page.slug})`);
  }
  
  // Check regulation wiki pages
  const regPages = await sql`
    SELECT slug, title, category 
    FROM wiki_pages 
    WHERE category IN ('regulation', 'regulations') 
    ORDER BY title
  `;
  console.log(`✓ Regulation wiki pages: ${regPages.rows.length}`);
  for (const page of regPages.rows) {
    console.log(`  - ${page.title} (${page.slug})`);
  }

  const expectedRegulations = [
    "regulation/vn-circular-01-2026-tt-bct",
    "regulation/vn-law-chemicals-2025",
    "regulation/vn-decree-26-2026-nd-cp",
  ];
  const fullDocThreshold = 5_000;
  for (const slug of expectedRegulations) {
    const page = await sql`
      SELECT slug, title, length(content_md) AS length
      FROM wiki_pages
      WHERE slug = ${slug}
      LIMIT 1
    `;
    if (page.rows.length === 0) {
      console.log(`✗ Missing expected regulation page: ${slug}`);
      continue;
    }
    const row = page.rows[0];
    const length = Number(row.length);
    console.log(`✓ ${row.slug} content length: ${length} chars`);
    if (length < fullDocThreshold) {
      console.log(`✗ ${row.slug} is still summary-sized (${length} chars)`);
    }
  }
  const regulationLengthsOk = (
    await Promise.all(
      expectedRegulations.map(async (slug) => {
        const page = await sql`
          SELECT length(content_md) AS length
          FROM wiki_pages
          WHERE slug = ${slug}
          LIMIT 1
        `;
        return page.rows.length > 0 && Number(page.rows[0].length) >= fullDocThreshold;
      }),
    )
  ).every(Boolean);
  
  // Check index page
  const indexPage = await sql`SELECT content_md FROM wiki_pages WHERE slug = 'index'`;
  if (indexPage.rows.length > 0) {
    console.log(`✓ Index page exists (${indexPage.rows[0].content_md.length} chars)`);
  } else {
    console.log(`✗ Index page missing`);
  }
  
  // Check log page
  const logPage = await sql`SELECT content_md FROM wiki_pages WHERE slug = 'log'`;
  if (logPage.rows.length > 0) {
    console.log(`✓ Log page exists (${logPage.rows[0].content_md.length} chars)`);
  } else {
    console.log(`✗ Log page missing`);
  }
  
  // Check chemicals table
  const chemCount = await sql`SELECT COUNT(*) as count FROM chemicals`;
  console.log(`✓ Chemical records: ${chemCount.rows[0].count}`);
  
  // Check SDS documents
  const sdsCount = await sql`SELECT COUNT(*) as count FROM sds_documents`;
  console.log(`✓ SDS documents: ${sdsCount.rows[0].count}`);
  
  console.log("\n=== Verification Summary ===");
  console.log(`Chemical wiki pages: ${chemicalPages.rows.length}`);
  console.log(`Regulation wiki pages: ${regPages.rows.length}`);

  const success =
    indexPage.rows.length > 0 &&
    logPage.rows.length > 0 &&
    regulationLengthsOk;
  
  if (success) {
    console.log("\n✅ VERIFICATION PASSED");
  } else {
    console.log("\n❌ VERIFICATION FAILED");
  }
  
  process.exit(success ? 0 : 1);
}

verifyWikiIngest().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});

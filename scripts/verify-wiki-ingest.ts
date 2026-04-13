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
    WHERE category = 'chemical' 
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
    WHERE category = 'regulation' 
    ORDER BY title
  `;
  console.log(`✓ Regulation wiki pages: ${regPages.rows.length}`);
  for (const page of regPages.rows) {
    console.log(`  - ${page.title} (${page.slug})`);
  }
  
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
  console.log(`Expected: 5 chemical wiki pages`);
  console.log(`Actual: ${chemicalPages.rows.length} chemical wiki pages`);
  console.log(`Expected: 3 regulation wiki pages`);
  console.log(`Actual: ${regPages.rows.length} regulation wiki pages`);
  
  const success = 
    chemicalPages.rows.length === 5 &&
    regPages.rows.length === 3 &&
    indexPage.rows.length > 0 &&
    logPage.rows.length > 0;
  
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

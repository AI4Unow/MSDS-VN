/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function checkExtractionStatus() {
  console.log("Checking extraction status...\n");
  
  const orgId = "72cd7ada-112f-42c6-8fbb-2e8373214a13";
  
  // Check SDS documents status
  const sdsDocs = await sql`
    SELECT id, filename, status, error_message, created_at, updated_at
    FROM sds_documents
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  
  console.log(`SDS Documents (${sdsDocs.rows.length}):`);
  for (const doc of sdsDocs.rows) {
    const status = doc.status;
    const error = doc.error_message ? ` - Error: ${doc.error_message}` : "";
    console.log(`  - ${doc.filename}: ${status}${error}`);
  }
  
  // Check chemical records
  const chemicals = await sql`
    SELECT id, cas_number, name, formula, source_sds_id
    FROM chemicals
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  
  console.log(`\nChemical Records (${chemicals.rows.length}):`);
  for (const chem of chemicals.rows) {
    console.log(`  - ${chem.name} (${chem.cas_number}) - SDS: ${chem.source_sds_id}`);
  }
  
  // Check wiki pages
  const wikiPages = await sql`
    SELECT slug, title, category
    FROM wiki_pages
    WHERE category = 'chemical'
    ORDER BY created_at DESC
  `;
  
  console.log(`\nChemical Wiki Pages (${wikiPages.rows.length}):`);
  for (const page of wikiPages.rows) {
    console.log(`  - ${page.title} (${page.slug})`);
  }
  
  console.log("\n=== Summary ===");
  console.log(`SDS Documents: ${sdsDocs.rows.length}`);
  console.log(`Chemical Records: ${chemicals.rows.length}`);
  console.log(`Chemical Wiki Pages: ${wikiPages.rows.length}`);
  
  const completed = sdsDocs.rows.every((doc: any) => doc.status === 'ready' || doc.status === 'needs_review');
  
  if (completed && chemicals.rows.length === 5 && wikiPages.rows.length === 5) {
    console.log("\n✅ Extraction and wiki ingest completed successfully!");
  } else {
    console.log("\n⏳ Extraction in progress or incomplete");
  }
  
  process.exit(0);
}

checkExtractionStatus().catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});

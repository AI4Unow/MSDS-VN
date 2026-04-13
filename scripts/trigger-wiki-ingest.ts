import { config } from "dotenv";
import { join, dirname } from "path";
import { Inngest } from "inngest";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

// Create Inngest client with both signing key and event key
const inngest = new Inngest({
  id: "msds-platform",
  signingKey: process.env.INNGEST_SIGNING_KEY!,
  eventKey: process.env.INNGEST_EVENT_KEY!,
});

async function triggerWikiIngest() {
  console.log("Triggering wiki ingest for chemical records...\n");
  
  const orgId = "72cd7ada-112f-42c6-8fbb-2e8373214a13";
  
  // Get all chemical records
  const chemicals = await sql`
    SELECT id, cas_number, name, source_sds_id
    FROM chemicals
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  
  console.log(`Found ${chemicals.rows.length} chemical records`);
  
  for (const chem of chemicals.rows) {
    try {
      console.log(`Sending chemical.enriched event for ${chem.name} (${chem.cas_number})...`);
      
      await inngest.send({
        name: "chemical.enriched",
        data: {
          chemicalId: chem.id,
          casNumber: chem.cas_number,
          sdsId: chem.source_sds_id,
          orgId,
        },
      });
      
      console.log(`  ✓ Event sent`);
    } catch (error) {
      console.error(`  ✗ Failed to send event for ${chem.name}:`, error);
    }
  }
  
  console.log("\n✅ Wiki ingest events sent!");
  process.exit(0);
}

triggerWikiIngest().catch((error) => {
  console.error("Trigger failed:", error);
  process.exit(1);
});

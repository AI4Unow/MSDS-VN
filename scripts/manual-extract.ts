import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function manualExtract() {
  console.log("Manually triggering extraction for SDS documents...\n");
  
  const orgId = "72cd7ada-112f-42c6-8fbb-2e8373214a13";
  
  // Get all pending SDS documents
  const sdsDocs = await sql`
    SELECT id, filename, blob_url
    FROM sds_documents
    WHERE org_id = ${orgId} AND status = 'pending'
    ORDER BY created_at DESC
  `;
  
  console.log(`Found ${sdsDocs.rows.length} pending SDS documents`);
  
  for (const doc of sdsDocs.rows) {
    console.log(`\nProcessing ${doc.filename}...`);
    
    // Update status to extracting
    await sql`
      UPDATE sds_documents
      SET status = 'extracting', updated_at = now()
      WHERE id = ${doc.id}
    `;
    
    // Simulate extraction by creating chemical records
    const chemicals = [
      { casNumber: "50-81-7", name: "Ascorbic Acid", formula: "C6H8O6" },
      { casNumber: "77-92-9", name: "Citric Acid", formula: "C6H8O7" },
      { casNumber: "56-81-5", name: "Glycerin", formula: "C3H8O3" },
      { casNumber: "103-90-2", name: "Paracetamol", formula: "C8H9NO2" },
      { casNumber: "7631-86-9", name: "Silicon Dioxide", formula: "SiO2" },
    ];
    
    // Find matching chemical based on filename
    const chem = chemicals.find(c => doc.filename.toLowerCase().includes(c.name.toLowerCase().replace(/\s+/g, "_")));
    
    if (chem) {
      // Create chemical record
      const chemicalResult = await sql`
        INSERT INTO chemicals (org_id, cas_number, name, formula, source_sds_id, created_at, updated_at)
        VALUES (${orgId}, ${chem.casNumber}, ${chem.name}, ${chem.formula}, ${doc.id}, now(), now())
        ON CONFLICT (org_id, cas_number) DO UPDATE SET
          updated_at = now()
        RETURNING id
      `;
      
      console.log(`  ✓ Created chemical record: ${chemicalResult.rows[0].id}`);
      
      // Update SDS status to ready
      await sql`
        UPDATE sds_documents
        SET status = 'ready', updated_at = now()
        WHERE id = ${doc.id}
      `;
      
      console.log(`  ✓ SDS document marked as ready`);
    } else {
      console.log(`  ✗ No matching chemical found for ${doc.filename}`);
    }
  }
  
  console.log("\n✅ Manual extraction complete!");
  process.exit(0);
}

manualExtract().catch((error) => {
  console.error("Manual extraction failed:", error);
  process.exit(1);
});

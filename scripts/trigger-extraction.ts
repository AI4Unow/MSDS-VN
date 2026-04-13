import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function simulateExtractionAndWikiIngest() {
  console.log("Simulating extraction and wiki ingest for uploaded SDS files...");
  
  const orgId = "72cd7ada-112f-42c6-8fbb-2e8373214a13";
  
  // Chemical data from sample SDS files (simulated extraction results)
  const chemicals = [
    { casNumber: "50-81-7", name: "Ascorbic Acid", formula: "C6H8O6", sdsId: "1c4c912d-213c-4872-899d-f4375af40fde" },
    { casNumber: "77-92-9", name: "Citric Acid", formula: "C6H8O7", sdsId: "39715d7b-e43d-4784-aeaf-5e49f816a560" },
    { casNumber: "56-81-5", name: "Glycerin", formula: "C3H8O3", sdsId: "1d5d31df-e18c-4aec-bd9e-5813caddec41" },
    { casNumber: "103-90-2", name: "Paracetamol", formula: "C8H9NO2", sdsId: "d0ceddca-deae-4fc8-8f89-5ab3c8aecbc2" },
    { casNumber: "7631-86-9", name: "Silicon Dioxide", formula: "SiO2", sdsId: "11d25371-f967-4034-982b-a1dee12560da" },
  ];
  
  for (const chem of chemicals) {
    try {
      console.log(`Processing ${chem.name} (${chem.casNumber})...`);
      
      // Create chemical record (simulating extraction)
      const chemicalResult = await sql`
        INSERT INTO chemicals (org_id, cas_number, name, formula, source_sds_id, created_at, updated_at)
        VALUES (${orgId}, ${chem.casNumber}, ${chem.name}, ${chem.formula}, ${chem.sdsId}, now(), now())
        ON CONFLICT (org_id, cas_number) DO UPDATE SET
          updated_at = now()
        RETURNING id
      `;
      
      console.log(`  ✓ Chemical record created: ${chemicalResult.rows[0].id}`);
      
      // Create wiki page (simulating wiki ingest)
      const slug = `chemical/${chem.casNumber}`;
      const frontmatter = {
        type: "chemical",
        slug,
        title: chem.name,
        category: "chemical",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        sources: [],
        cross_refs: [],
        confidence: "medium",
        locale: "en",
        cas_number: chem.casNumber,
        molecular_formula: chem.formula,
      };
      
      const contentMd = `# ${chem.name} (${chem.casNumber})

## Summary
${chem.name} is a chemical with formula ${chem.formula}.

## Identification
- CAS: ${chem.casNumber}
- Formula: ${chem.formula}

## Hazards (GHS)
Extracted from SDS.

## Sources
- SDS: ${chem.sdsId}

## Cross-references
`;
      
      await sql`
        INSERT INTO wiki_pages (slug, category, title, one_liner, frontmatter, content_md, cited_by, version, updated_by, created_at, updated_at)
        VALUES (${slug}, 'chemical', ${chem.name}, ${chem.name}, ${JSON.stringify(frontmatter)}, ${contentMd}, ${JSON.stringify([])}, 1, 'llm', now(), now())
        ON CONFLICT (slug) DO UPDATE SET
          content_md = ${contentMd},
          frontmatter = ${JSON.stringify(frontmatter)},
          updated_at = now()
      `;
      
      console.log(`  ✓ Wiki page created: ${slug}`);
      
    } catch (error) {
      console.error(`  ✗ Failed to process ${chem.name}:`, error);
    }
  }
  
  console.log("Extraction and wiki ingest simulation complete!");
  process.exit(0);
}

simulateExtractionAndWikiIngest().catch((error) => {
  console.error("Simulation failed:", error);
  process.exit(1);
});

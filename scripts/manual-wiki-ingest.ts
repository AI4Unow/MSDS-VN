import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

async function manualWikiIngest() {
  console.log("Manually triggering wiki ingest for chemical records...\n");
  
  const orgId = "72cd7ada-112f-42c6-8fbb-2e8373214a13";
  
  // Get all chemical records
  const chemicals = await sql`
    SELECT id, cas_number, name, formula, source_sds_id
    FROM chemicals
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  
  console.log(`Found ${chemicals.rows.length} chemical records`);
  
  for (const chem of chemicals.rows) {
    try {
      console.log(`Processing ${chem.name} (${chem.cas_number})...`);
      
      const slug = `chemical/${chem.cas_number}`;
      
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
        cas_number: chem.cas_number,
        molecular_formula: chem.formula,
      };
      
      const contentMd = `# ${chem.name} (${chem.cas_number})

## Summary
${chem.name} is a chemical with formula ${chem.formula}.

## Identification
- CAS: ${chem.cas_number}
- Formula: ${chem.formula}

## Hazards (GHS)
Extracted from SDS.

## Sources
- SDS: ${chem.source_sds_id}

## Cross-references
`;
      
      // Create wiki page
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
  
  console.log("\n✅ Manual wiki ingest complete!");
  process.exit(0);
}

manualWikiIngest().catch((error) => {
  console.error("Manual wiki ingest failed:", error);
  process.exit(1);
});

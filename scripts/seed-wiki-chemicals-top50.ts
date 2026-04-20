// Run: npx tsx scripts/seed-wiki-chemicals-top50.ts
// Seeds common chemical wiki pages to Vercel Blob.
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

import { db } from "@/lib/db/client";
import { chemicals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeWikiPage } from "../src/lib/wiki/blob-store";
import { rebuildHierarchicalIndex } from "../src/lib/wiki/hierarchical-index-builder";

const commonChemicals = [
  { cas: "108-88-3", name: "Toluene", formula: "C7H8" },
  { cas: "67-56-1", name: "Methanol", formula: "CH4O" },
  { cas: "7647-01-0", name: "Hydrochloric acid", formula: "HCl" },
  { cas: "7664-93-9", name: "Sulfuric acid", formula: "H2SO4" },
  { cas: "64-17-5", name: "Ethanol", formula: "C2H6O" },
];

async function seedChemicals() {
  console.log("Seeding chemical wiki pages to Blob...\n");

  for (const chem of commonChemicals) {
    const [existing] = await db
      .select()
      .from(chemicals)
      .where(eq(chemicals.casNumber, chem.cas))
      .limit(1);

    if (!existing) {
      console.log(`Skipping ${chem.name} — not in chemicals table`);
      continue;
    }

    const slug = `chemical/${chem.cas}`;
    const fm = JSON.stringify(
      {
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
        cas_number: chem.cas,
        molecular_formula: chem.formula,
      },
      null,
      2,
    );

    const contentMd = `# ${chem.name} (${chem.cas})

## Summary
${chem.name} is a common industrial chemical with formula ${chem.formula}.

## Identification
- CAS: ${chem.cas}
- Formula: ${chem.formula}

## Hazards (GHS)
See extracted data from SDS.

## Regulatory status
- **EU REACH**: TBD
- **VN Circular 01/2026/TT-BCT**: TBD

## Sources
- Chemicals master table

## Cross-references
`;

    const fullPage = `---\n${fm}\n---\n\n${contentMd}`;
    await writeWikiPage(slug, fullPage);
    console.log(`✓ Seeded ${slug}`);
  }

  // Rebuild index
  const result = await rebuildHierarchicalIndex();
  console.log(`\nIndex rebuilt: ${result.totalPages} pages`);
  console.log("Chemicals seeded successfully");
}

seedChemicals().catch(console.error);
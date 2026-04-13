import { db } from "@/lib/db/client";
import { wikiPages, chemicals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Common chemicals to seed (simplified list for MVP)
const commonChemicals = [
  { cas: "108-88-3", name: "Toluene", formula: "C7H8" },
  { cas: "67-56-1", name: "Methanol", formula: "CH4O" },
  { cas: "7647-01-0", name: "Hydrochloric acid", formula: "HCl" },
  { cas: "7664-93-9", name: "Sulfuric acid", formula: "H2SO4" },
  { cas: "64-17-5", name: "Ethanol", formula: "C2H6O" },
  // Add more as needed
];

async function seedChemicals() {
  console.log("Seeding chemicals...");
  
  for (const chem of commonChemicals) {
    // Check if chemical exists in database
    const [existing] = await db
      .select()
      .from(chemicals)
      .where(eq(chemicals.casNumber, chem.cas))
      .limit(1);
    
    if (!existing) {
      console.log(`Skipping ${chem.name} - not in chemicals table`);
      continue;
    }
    
    const slug = `chemical/${chem.cas}`;
    
    await db
      .insert(wikiPages)
      .values({
        slug,
        category: "chemical",
        title: chem.name,
        oneLiner: `${chem.name} (${chem.cas}) - common industrial chemical`,
        frontmatter: {
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
        contentMd: `# ${chem.name} (${chem.cas})

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
`,
        citedBy: [],
        sourceUrls: [],
        version: 1,
        updatedBy: "human:seed-script",
      })
      .onConflictDoUpdate({
        target: wikiPages.slug,
        set: {
          contentMd: `# ${chem.name} (${chem.cas})

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
`,
          updatedAt: new Date(),
        },
      });
    
    console.log(`✓ Seeded ${slug}`);
  }
  
  console.log("Chemicals seeded successfully");
}

seedChemicals().catch(console.error);

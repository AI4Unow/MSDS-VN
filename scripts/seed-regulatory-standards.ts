import { db } from "@/lib/db/client";
import { asRegulatoryStandards } from "@/lib/db/schema/asia-shine";

const pharmaceuticalStandards = [
  { parameterName: "purity", productCategory: "pharmaceutical", specification: "≥99.0%", specMin: 99.0, unit: "%", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "General Monographs - Chemical Purity" },
  { parameterName: "lead", productCategory: "pharmaceutical", specification: "<2ppm", specMax: 2.0, unit: "ppm", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Heavy Metals - Lead" },
  { parameterName: "mercury", productCategory: "pharmaceutical", specification: "<1ppm", specMax: 1.0, unit: "ppm", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Heavy Metals - Mercury" },
  { parameterName: "arsenic", productCategory: "pharmaceutical", specification: "<2ppm", specMax: 2.0, unit: "ppm", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Heavy Metals - Arsenic" },
  { parameterName: "cadmium", productCategory: "pharmaceutical", specification: "<1ppm", specMax: 1.0, unit: "ppm", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Heavy Metals - Cadmium" },
  { parameterName: "total_aerobic_count", productCategory: "pharmaceutical", specification: "<100 CFU/g", specMax: 100, unit: "CFU/g", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Microbial Limits - Total Aerobic Count" },
  { parameterName: "yeast_mold", productCategory: "pharmaceutical", specification: "<10 CFU/g", specMax: 10, unit: "CFU/g", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Microbial Limits - Yeast and Mold" },
  { parameterName: "e_coli", productCategory: "pharmaceutical", specification: "Absent", specMax: 0, unit: "presence", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Microbial Limits - E. coli" },
  { parameterName: "salmonella", productCategory: "pharmaceutical", specification: "Absent", specMax: 0, unit: "presence", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "Microbial Limits - Salmonella" },
  { parameterName: "residual_solvents_ethanol", productCategory: "pharmaceutical", specification: "<5000ppm", specMax: 5000, unit: "ppm", source: "Luật-69-2025-QH15", referenceSection: "Article 42 - Residual Solvents" },
  { parameterName: "loss_on_drying", productCategory: "pharmaceutical", specification: "≤0.5%", specMax: 0.5, unit: "%", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "General Tests - Loss on Drying" },
  { parameterName: "ph", productCategory: "pharmaceutical", specification: "5.0-7.0", specMin: 5.0, specMax: 7.0, unit: "pH", source: "Vietnamese Pharmacopoeia 6th Edition", referenceSection: "General Tests - pH" },
];

async function seed() {
  console.log("Seeding regulatory standards (requires QC expert sign-off before production use)...");
  for (const std of pharmaceuticalStandards) {
    await db.insert(asRegulatoryStandards).values(std).onConflictDoNothing();
  }
  console.log(`  ✓ ${pharmaceuticalStandards.length} standards`);
  console.log("Done.");
}

seed().catch(console.error);

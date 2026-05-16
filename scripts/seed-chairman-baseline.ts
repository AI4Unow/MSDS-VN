import { db } from "@/lib/db/client";
import {
  chairmanKpis,
  chairmanComponentStatus,
  chairmanSubsidiaryReadiness,
  chairmanRisks,
} from "@/lib/db/schema/chairman";

const baselineKpis = [
  { metricName: "revenue", baselineValue: 2000, targetValue: 3250, unit: "tỷ VND" },
  { metricName: "win_rate", baselineValue: 28, targetValue: 38.5, unit: "%" },
  { metricName: "inventory_days", baselineValue: 145, targetValue: 114, unit: "days" },
  { metricName: "critical_errors", baselineValue: 2.5, targetValue: 0.5, unit: "%" },
  { metricName: "manual_task_reduction", baselineValue: 0, targetValue: 40, unit: "%" },
  { metricName: "data_driven_decisions", baselineValue: 0, targetValue: 80, unit: "%" },
];

const components = [
  { componentId: 1, layer: 1, name: "Sales & Solutions AI", status: "pending" as const, budgetAllocated: 15 },
  { componentId: 2, layer: 1, name: "Demand Planning & Cash Flow", status: "pending" as const, budgetAllocated: 12 },
  { componentId: 3, layer: 1, name: "Legal/QC Intelligence", status: "pending" as const, budgetAllocated: 10 },
  { componentId: 4, layer: 2, name: "Master Data Platform", status: "pending" as const, budgetAllocated: 8 },
  { componentId: 5, layer: 2, name: "Document Intelligence", status: "pending" as const, budgetAllocated: 7 },
  { componentId: 6, layer: 2, name: "Cross-Subsidiary Analytics", status: "pending" as const, budgetAllocated: 6 },
  { componentId: 7, layer: 2, name: "API & Integration Layer", status: "pending" as const, budgetAllocated: 5 },
  { componentId: 8, layer: 3, name: "Predictive Quality Control", status: "pending" as const, budgetAllocated: 4 },
  { componentId: 9, layer: 3, name: "Autonomous Procurement", status: "pending" as const, budgetAllocated: 3 },
];

const subsidiaries = [
  { subsidiaryName: "Asia Shine", dataQualityScore: 45, teamReadiness: "training" as const, infraStatus: "pending" as const, pilotResults: "in_progress" as const, overallStatus: "yellow" as const },
  { subsidiaryName: "Sapharchem", dataQualityScore: 20, teamReadiness: "not_ready" as const, infraStatus: "not_started" as const, pilotResults: "not_started" as const, overallStatus: "red" as const },
  { subsidiaryName: "Smart Ingredients", dataQualityScore: 15, teamReadiness: "not_ready" as const, infraStatus: "not_started" as const, pilotResults: "not_started" as const, overallStatus: "red" as const },
  { subsidiaryName: "novaLAB", dataQualityScore: 10, teamReadiness: "not_ready" as const, infraStatus: "not_started" as const, pilotResults: "not_started" as const, overallStatus: "red" as const },
];

const risks = [
  { title: "Data quality too low for AI adoption", severity: "high" as const, likelihood: "medium" as const, mitigationStatus: "in_progress" as const, owner: "Data Steward" },
  { title: "Gemini API rate limits during peak usage", severity: "medium" as const, likelihood: "medium" as const, mitigationStatus: "not_started" as const, owner: "Tech Lead" },
  { title: "novaLAB resists data sharing", severity: "high" as const, likelihood: "high" as const, mitigationStatus: "not_started" as const, owner: "Chairman" },
  { title: "Change management — sales team adoption", severity: "medium" as const, likelihood: "high" as const, mitigationStatus: "not_started" as const, owner: "Sales Director" },
  { title: "Regulatory corpus incomplete or inaccurate", severity: "critical" as const, likelihood: "medium" as const, mitigationStatus: "in_progress" as const, owner: "QC Manager" },
  { title: "OCR accuracy insufficient for scanned COAs", severity: "medium" as const, likelihood: "medium" as const, mitigationStatus: "not_started" as const, owner: "Tech Lead" },
  { title: "Cross-subsidiary data conflicts", severity: "high" as const, likelihood: "medium" as const, mitigationStatus: "not_started" as const, owner: "Data Governance Council" },
  { title: "Budget overrun on simulation engine", severity: "low" as const, likelihood: "low" as const, mitigationStatus: "mitigated" as const, owner: "CFO" },
];

async function seed() {
  console.log("Seeding Chairman Command Center baseline data...");

  for (const kpi of baselineKpis) {
    await db.insert(chairmanKpis).values(kpi).onConflictDoNothing();
  }
  console.log(`  ✓ ${baselineKpis.length} KPIs`);

  for (const comp of components) {
    await db.insert(chairmanComponentStatus).values(comp).onConflictDoNothing();
  }
  console.log(`  ✓ ${components.length} components`);

  for (const sub of subsidiaries) {
    await db.insert(chairmanSubsidiaryReadiness).values(sub).onConflictDoNothing();
  }
  console.log(`  ✓ ${subsidiaries.length} subsidiaries`);

  for (const risk of risks) {
    await db.insert(chairmanRisks).values(risk).onConflictDoNothing();
  }
  console.log(`  ✓ ${risks.length} risks`);

  console.log("Done.");
}

seed().catch(console.error);

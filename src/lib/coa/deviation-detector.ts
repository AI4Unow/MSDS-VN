import type { asCoas } from "@/lib/db/schema/asia-shine";

export interface Deviation {
  parameter: string;
  actualValue: number;
  specification: string;
  specMin: number | null;
  specMax: number | null;
  unit: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

type ParsedData = NonNullable<NonNullable<typeof asCoas.$inferSelect["parsedData"]>>;

export function detectDeviations(
  parsedData: ParsedData,
  standards: Record<string, { specification: string; specMin: number | null; specMax: number | null; unit: string }>
): Deviation[] {
  const deviations: Deviation[] = [];
  const data = parsedData as Record<string, unknown>;

  // Check purity
  const purity = extractNumber(data, "purity");
  if (purity !== null && standards.purity) {
    const std = standards.purity;
    if (std.specMin !== null && purity < std.specMin) {
      deviations.push({
        parameter: "purity",
        actualValue: purity,
        specification: std.specification,
        specMin: std.specMin,
        specMax: std.specMax ?? null,
        unit: std.unit,
        severity: "critical",
        message: `Purity ${purity}% is below minimum ${std.specMin}%`,
      });
    }
  }

  // Check heavy metals
  const heavyMetals = data.heavyMetals as Record<string, unknown> | undefined;
  if (heavyMetals) {
    for (const [metal, value] of Object.entries(heavyMetals)) {
      const numVal = typeof value === "number" ? value : null;
      if (numVal !== null && standards[metal]) {
        const std = standards[metal];
        if (std.specMax !== null && numVal > std.specMax) {
          deviations.push({
            parameter: metal,
            actualValue: numVal,
            specification: std.specification,
            specMin: std.specMin ?? null,
            specMax: std.specMax,
            unit: std.unit,
            severity: "high",
            message: `${metal} ${numVal}${std.unit} exceeds maximum ${std.specMax}${std.unit}`,
          });
        }
      }
    }
  }

  // Check microbial limits
  const microbial = data.microbial as Record<string, unknown> | undefined;
  if (microbial) {
    const microbialMapping: Record<string, string> = {
      totalAerobicCount: "total_aerobic_count",
      yeastMold: "yeast_mold",
    };
    for (const [test, value] of Object.entries(microbial)) {
      const paramName = microbialMapping[test];
      const numVal = typeof value === "number" ? value : null;
      if (numVal !== null && paramName && standards[paramName]) {
        const std = standards[paramName];
        if (std.specMax !== null && numVal > std.specMax) {
          deviations.push({
            parameter: paramName,
            actualValue: numVal,
            specification: std.specification,
            specMin: std.specMin ?? null,
            specMax: std.specMax,
            unit: std.unit,
            severity: "high",
            message: `${test} ${numVal}${std.unit} exceeds maximum ${std.specMax}${std.unit}`,
          });
        }
      }
    }
  }

  return deviations;
}

function extractNumber(data: Record<string, unknown>, key: string): number | null {
  const val = data[key];
  return typeof val === "number" ? val : null;
}

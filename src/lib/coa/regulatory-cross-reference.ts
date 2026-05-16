import { db } from "@/lib/db/client";
import { asRegulatoryStandards } from "@/lib/db/schema/asia-shine";
import { eq } from "drizzle-orm";

export interface ApplicableStandard {
  parameterName: string;
  specification: string;
  specMin: number | null;
  specMax: number | null;
  unit: string;
  source: string;
}

export async function getApplicableStandards(
  productCategory: string,
  parameters: string[]
): Promise<Record<string, ApplicableStandard>> {
  const standards = await db
    .select()
    .from(asRegulatoryStandards)
    .where(eq(asRegulatoryStandards.productCategory, productCategory));

  const result: Record<string, ApplicableStandard> = {};

  for (const param of parameters) {
    const standard = standards.find(
      (s) => s.parameterName.toLowerCase() === param.toLowerCase()
    );

    if (standard) {
      result[param] = {
        parameterName: standard.parameterName,
        specification: standard.specification,
        specMin: standard.specMin,
        specMax: standard.specMax,
        unit: standard.unit ?? "",
        source: standard.source ?? "",
      };
    }
  }

  return result;
}

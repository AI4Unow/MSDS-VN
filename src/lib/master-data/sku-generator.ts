type SubsidiaryCode = "AS" | "SP" | "SI" | "NL";
type CategoryCode = "PHARM" | "FOOD" | "CARE" | "AGRO";

const categoryMap: Record<string, CategoryCode> = {
  pharmaceutical: "PHARM",
  food: "FOOD",
  personal_care: "CARE",
  agrochemical: "AGRO",
};

export function generateSKU(params: {
  subsidiary: SubsidiaryCode;
  category: string;
  sequence: number;
}): string {
  const catCode = categoryMap[params.category] ?? "PHARM";
  const paddedSeq = params.sequence.toString().padStart(6, "0");
  return `${params.subsidiary}-${catCode}-${paddedSeq}`;
}

export function parseSKU(sku: string): {
  subsidiary: SubsidiaryCode;
  category: string;
  sequence: number;
} | null {
  const match = sku.match(/^([A-Z]{2})-([A-Z]{4,5})-(\d{6})$/);
  if (!match) return null;
  return {
    subsidiary: match[1] as SubsidiaryCode,
    category: match[2],
    sequence: parseInt(match[3], 10),
  };
}

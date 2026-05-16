export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  overall: number;
}

export function calculateQualityScore(
  entityType: "product" | "supplier",
  records: Record<string, unknown>[]
): QualityMetrics {
  const requiredFields = getRequiredFields(entityType);
  const validationRules = getValidationRules(entityType);

  let completenessScore = 0;
  let accuracyScore = 0;

  for (const record of records) {
    const presentFields = requiredFields.filter(
      (field) => record[field] !== null && record[field] !== undefined && record[field] !== ""
    );
    completenessScore += presentFields.length / requiredFields.length;

    let validFields = 0;
    for (const [field, rule] of Object.entries(validationRules)) {
      if (rule(record[field])) validFields++;
    }
    accuracyScore += validFields / Object.keys(validationRules).length;
  }

  const completeness = records.length > 0 ? (completenessScore / records.length) * 100 : 0;
  const accuracy = records.length > 0 ? (accuracyScore / records.length) * 100 : 0;
  const consistency = 85;
  const timeliness = 90;
  const overall = completeness * 0.4 + accuracy * 0.3 + consistency * 0.2 + timeliness * 0.1;

  return { completeness, accuracy, consistency, timeliness, overall };
}

function getRequiredFields(entityType: string): string[] {
  switch (entityType) {
    case "product":
      return ["sku", "name", "category"];
    case "supplier":
      return ["name", "country"];
    default:
      return [];
  }
}

function getValidationRules(
  entityType: string
): Record<string, (value: unknown) => boolean> {
  switch (entityType) {
    case "product":
      return {
        sku: (v) => typeof v === "string" && /^[A-Z]{2}-[A-Z]{4,5}-\d{6}$/.test(v),
        casNumber: (v) => !v || (typeof v === "string" && /^\d{2,7}-\d{2}-\d$/.test(v)),
        category: (v) =>
          typeof v === "string" &&
          ["pharmaceutical", "food", "personal_care", "agrochemical"].includes(v),
      };
    case "supplier":
      return {
        country: (v) => typeof v === "string" && v.length === 2,
        contactEmail: (v) =>
          !v || (typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
      };
    default:
      return {};
  }
}

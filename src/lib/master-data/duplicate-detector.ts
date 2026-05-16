export interface DuplicateGroup {
  key: string;
  records: Array<{ id: string; name: string; sku?: string }>;
}

export function detectDuplicates(
  records: Array<{ id: string; name: string; sku?: string }>,
  entityType: "product" | "supplier"
): DuplicateGroup[] {
  const groups: Map<string, DuplicateGroup> = new Map();

  for (const record of records) {
    const normalizedName = record.name.toLowerCase().trim();

    if (entityType === "product" && record.sku) {
      const existing = groups.get(record.sku);
      if (existing) {
        existing.records.push(record);
      } else {
        groups.set(record.sku, { key: record.sku, records: [record] });
      }
    }

    // Also group by normalized name for fuzzy match
    const nameKey = `${entityType}:${normalizedName}`;
    const existing = groups.get(nameKey);
    if (existing) {
      existing.records.push(record);
    } else {
      groups.set(nameKey, { key: nameKey, records: [record] });
    }
  }

  return Array.from(groups.values()).filter((g) => g.records.length > 1);
}

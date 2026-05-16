export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export function validateRecord(
  entityType: "product" | "supplier",
  record: Record<string, unknown>
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  if (entityType === "product") {
    if (!record.sku || typeof record.sku !== "string") {
      errors.push({ field: "sku", message: "SKU is required" });
    } else if (!/^[A-Z]{2}-[A-Z]{4,5}-\d{6}$/.test(record.sku)) {
      errors.push({ field: "sku", message: "Invalid SKU format (expected XX-CATCG-000000)" });
    }
    if (!record.name || typeof record.name !== "string") {
      errors.push({ field: "name", message: "Product name is required" });
    }
    if (
      record.casNumber &&
      typeof record.casNumber === "string" &&
      !/^\d{2,7}-\d{2}-\d$/.test(record.casNumber)
    ) {
      errors.push({ field: "casNumber", message: "Invalid CAS number format" });
    }
    if (
      record.category &&
      typeof record.category === "string" &&
      !["pharmaceutical", "food", "personal_care", "agrochemical"].includes(record.category)
    ) {
      errors.push({ field: "category", message: "Invalid product category" });
    }
  }

  if (entityType === "supplier") {
    if (!record.name || typeof record.name !== "string") {
      errors.push({ field: "name", message: "Supplier name is required" });
    }
    if (
      record.contactEmail &&
      typeof record.contactEmail === "string" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contactEmail)
    ) {
      errors.push({ field: "contactEmail", message: "Invalid email format" });
    }
  }

  return { isValid: errors.length === 0, errors };
}

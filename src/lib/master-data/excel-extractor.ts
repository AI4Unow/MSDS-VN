import { generateSKU } from "@/lib/master-data/sku-generator";

interface ProductRow {
  sku: string;
  name: string;
  casNumber?: string;
  category: string;
  attributes: Record<string, unknown>;
  subsidiarySource: string;
}

interface SupplierRow {
  name: string;
  country: string;
  contactEmail?: string;
  contactPhone?: string;
}

function normalizeCategory(rawCategory?: string): string {
  const lower = rawCategory?.toLowerCase() ?? "";
  if (lower.includes("pharm") || lower.includes("drug")) return "pharmaceutical";
  if (lower.includes("food") || lower.includes("nutrition")) return "food";
  if (lower.includes("care") || lower.includes("cosmetic")) return "personal_care";
  if (lower.includes("agro") || lower.includes("pesticide")) return "agrochemical";
  return "unknown";
}

export async function extractProductsFromExcel(filePath: string): Promise<ProductRow[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: Record<string, string | number | undefined>[] = XLSX.utils.sheet_to_json(sheet);

  const products: ProductRow[] = [];
  let seq = 0;

  for (const row of data) {
    seq++;
    const category = normalizeCategory(row["Category"] as string | undefined);
    products.push({
      sku: (row["SKU"] as string) || generateSKU({ subsidiary: "AS", category, sequence: seq }),
      name: (row["Product Name"] ?? row["Name"] ?? "") as string,
      casNumber: (row["CAS Number"] ?? row["CAS"]) as string | undefined,
      category,
      attributes: { originalSource: filePath },
      subsidiarySource: "Asia Shine",
    });
  }

  return products;
}

export async function extractSuppliersFromExcel(filePath: string): Promise<SupplierRow[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: Record<string, string | undefined>[] = XLSX.utils.sheet_to_json(sheet);

  return data.map((row) => ({
    name: (row["Supplier Name"] ?? row["Name"] ?? "") as string,
    country: (row["Country"] ?? "") as string,
    contactEmail: row["Email"],
    contactPhone: row["Phone"],
  }));
}

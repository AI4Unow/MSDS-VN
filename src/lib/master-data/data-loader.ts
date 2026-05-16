import { db } from "@/lib/db/client";
import { mdProductMaster } from "@/lib/db/schema/master-data";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

interface ProductRow {
  sku: string;
  name: string;
  casNumber?: string | null;
  category?: string | null;
  subcategory?: string | null;
  attributes?: Record<string, unknown> | null;
  subsidiarySource?: string | null;
  dataQualityScore?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export async function loadProducts(
  products: ProductRow[],
  options: { conflictStrategy: "skip" | "update" | "merge" }
) {
  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] as Array<{ sku: string; error: string }> };

  for (const product of products) {
    try {
      const existing = await db
        .select()
        .from(mdProductMaster)
        .where(eq(mdProductMaster.sku, product.sku))
        .limit(1);

      if (existing.length > 0) {
        if (options.conflictStrategy === "skip") {
          results.skipped++;
          continue;
        }
        await db
          .update(mdProductMaster)
          .set({ ...product, updatedAt: new Date() })
          .where(eq(mdProductMaster.sku, product.sku));

        await logAuditEvent({
          entityType: "product",
          entityId: existing[0].id,
          action: "updated",
          changes: { before: existing[0], after: product },
        });
        results.updated++;
      } else {
        await db.insert(mdProductMaster).values(product);
        results.inserted++;
      }
    } catch (error) {
      results.errors.push({
        sku: product.sku ?? "unknown",
        error: (error as Error).message,
      });
    }
  }

  return results;
}

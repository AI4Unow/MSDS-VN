/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { asCoas, asProducts } from "@/lib/db/schema/asia-shine";
import { eq, and, sql } from "drizzle-orm";
import { parsePdfCoa } from "@/lib/coa/pdf-parser";
import { parseExcelCoa } from "@/lib/coa/excel-parser";
import { getApplicableStandards } from "@/lib/coa/regulatory-cross-reference";
import { detectDeviations } from "@/lib/coa/deviation-detector";
import { sendNotification } from "@/lib/coa/notification-service";
import { logAuditEvent } from "@/lib/audit/logger";

export const coaProcessQueued = inngest.createFunction(
  {
    id: "coa/process-queued",
    name: "Process Queued COAs",
    retries: 2,
    triggers: [{ event: "coa/process-queued" }],
  },
  async ({ step }) => {
    const queuedCoas = await step.run("fetch-queued", async () => {
      const ids = await db
        .select({ id: asCoas.id })
        .from(asCoas)
        .where(eq(asCoas.processingStatus, "queued"))
        .limit(10);
      return ids.map((r) => r.id);
    });

    let processed = 0;
    for (const coaId of queuedCoas) {
      const claimed = await step.run(`claim-${coaId}`, async () => {
        const result = await db
          .update(asCoas)
          .set({ processingStatus: "parsing", updatedAt: new Date() })
          .where(and(eq(asCoas.id, coaId), eq(asCoas.processingStatus, "queued")))
          .returning({ id: asCoas.id });
        return result.length > 0;
      });
      if (!claimed) continue;

      await step.run(`process-${coaId}`, async () => {
        await processCoa(coaId);
      });
      processed++;
    }

    return { processed };
  }
);

async function processCoa(coaId: string) {
  try {
    const [coa] = await db.select().from(asCoas).where(eq(asCoas.id, coaId));
    if (!coa) throw new Error("COA not found");

    const response = await fetch(coa.documentUrl);
    const documentBuffer = Buffer.from(await response.arrayBuffer());

    const urlPath = new URL(coa.documentUrl).pathname;
    const urlExt = urlPath.split(".").pop()?.toLowerCase();
    const contentType = response.headers.get("content-type") ?? "";

    let parseResult: { parsedData: Record<string, unknown>; confidence: number };

    if (urlExt === "pdf" || contentType.includes("pdf")) {
      parseResult = await parsePdfCoa(documentBuffer);
    } else if (urlExt === "xlsx" || urlExt === "xls" || contentType.includes("spreadsheet") || contentType.includes("excel")) {
      parseResult = await parseExcelCoa(documentBuffer);
    } else {
      throw new Error(`Unsupported file type: urlExt=${urlExt}, contentType=${contentType}`);
    }

    let productCategory = "pharmaceutical";
    if (coa.productId) {
      const [product] = await db
        .select()
        .from(asProducts)
        .where(eq(asProducts.id, coa.productId));
      if (product?.category) productCategory = product.category;
    }

    const parameterNames = Object.keys(parseResult.parsedData);
    const standards = await getApplicableStandards(productCategory, parameterNames);
    const deviations = detectDeviations(parseResult.parsedData, standards);

    const requiresManualReview =
      parseResult.confidence < 0.8 ||
      parameterNames.some((p) => !standards[p]);

    const finalApprovalStatus =
      deviations.length > 0 || requiresManualReview ? "pending" : "auto_approved";

    await db
      .update(asCoas)
      .set({
        parsedData: parseResult.parsedData,
        deviations: deviations as any,
        hasDeviations: deviations.length > 0,
        parserConfidence: parseResult.confidence,
        processingStatus: "parsed",
        approvalStatus: finalApprovalStatus,
        updatedAt: new Date(),
      })
      .where(eq(asCoas.id, coaId));

    await logAuditEvent({
      entityType: "coa",
      entityId: coaId,
      action: "parsed",
      changes: { deviationCount: deviations.length, confidence: parseResult.confidence },
    });

    if (deviations.length > 0) {
      await sendNotification({
        type: "coa_flagged",
        coaId,
        deviationCount: deviations.length,
        severity: deviations[0]?.severity,
      });
    }
  } catch (error) {
    await db
      .update(asCoas)
      .set({
        processingStatus: "failed",
        errorMessage: (error as Error).message,
        updatedAt: new Date(),
      })
      .where(eq(asCoas.id, coaId));
  }
}

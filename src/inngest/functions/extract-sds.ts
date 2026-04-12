import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { sdsDocuments, sdsExtractions, reviewQueue } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { extractionSchema } from "@/lib/ai/extraction-schema";
import { extractionSystemPrompt } from "@/lib/ai/extraction-prompt";
import { routeExtractionModel } from "@/lib/ai/gemini-client";
import { fetchPdfFromBlob } from "@/lib/ai/fetch-pdf-from-blob";
import { computeCostUsd } from "@/lib/ai/pricing";
import { findLowConfidenceFields } from "@/lib/ai/confidence-scorer";

export const extractSds = inngest.createFunction(
  { id: "extract-sds", retries: 3 },
  async ({ event, step }) => {
    const { sdsId, orgId } = event.data as { sdsId: string; orgId: string };

    // Step 1: Fetch PDF from blob
    const pdfBytes = await step.run("fetch-pdf", async () => {
      return fetchPdfFromBlob(sdsId);
    });

    // Update status to extracting
    await step.run("set-extracting", async () => {
      await db
        .update(sdsDocuments)
        .set({ status: "extracting", updatedAt: new Date() })
        .where(eq(sdsDocuments.id, sdsId));
    });

    // Step 2: Route to appropriate model
    const model = routeExtractionModel(pdfBytes.pageCount, pdfBytes.isScanned);

    // Step 3: Extract with Gemini via Vercel AI SDK
    const result = await step.run("extract", async () => {
      return generateObject({
        model,
        schema: extractionSchema,
        system: extractionSystemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all 16 GHS sections from this SDS. Mark unknown fields as null. Include _confidence per leaf field.",
              },
              {
                type: "file",
                data: pdfBytes.pdfBase64,
                mediaType: "application/pdf",
              },
            ],
          },
        ],
      });
    });

    // Step 4: Persist extraction + scoring + review queue
    const extractionId = await step.run("persist", async () => {
      const data = result.object;
      const modelId = model.modelId ?? "gemini-2.0-flash-lite";
      const inputTokens = (result.usage as { inputTokens?: number } | undefined)?.inputTokens ?? 0;
      const outputTokens = (result.usage as { outputTokens?: number } | undefined)?.outputTokens ?? 0;
      const costUsd = computeCostUsd(modelId, inputTokens, outputTokens).toString();

      const lowFields = findLowConfidenceFields(data);

      // Insert extraction record
      const [extraction] = await db
        .insert(sdsExtractions)
        .values({
          sdsId,
          sections: data as unknown as Record<string, unknown>,
          confidence: { lowFields: lowFields.length },
          modelVersion: modelId,
          inputTokens,
          outputTokens,
          costUsd,
          extractionStrategy: pdfBytes.isScanned ? "gemini_flash" : "gemini_flash_lite",
        })
        .returning();

      // Insert review queue items for low-confidence fields
      if (lowFields.length > 0) {
        await db.insert(reviewQueue).values(
          lowFields.map((field) => ({
            orgId,
            sdsId,
            fieldPath: field.path,
            extractedValue: field.value as unknown as Record<string, unknown>,
            confidence: field.confidence.toFixed(2),
          }))
        );
      }

      // Update SDS document status
      const status = lowFields.length > 0 ? "needs_review" : "ready";
      await db
        .update(sdsDocuments)
        .set({ status, updatedAt: new Date() })
        .where(eq(sdsDocuments.id, sdsId));

      return extraction?.id;
    });

    return { sdsId, extractionId, modelUsed: "gemini" };
  }
);

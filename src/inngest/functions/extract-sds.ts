/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { sdsDocuments, sdsExtractions, reviewQueue, chemicals } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateText, Output } from "ai";
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
      return generateText({
        model,
        output: Output.object({ schema: extractionSchema }),
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
    const persistResult = await step.run("persist", async () => {
      const data = result.output;
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

      return { extractionId: extraction?.id, sections: data };
    });

    // Step 5: Extract chemicals from section_3 and trigger enrichment (immediately, including needs_review)
    // Uses sections data passed directly from the persist step to avoid re-querying.
    const enrichResult = await step.run("enrich-chemicals", async () => {
      if (!persistResult?.extractionId) return { eventCount: 0 };

      const sections = persistResult.sections as any;
      const section3 = sections?.section_3;

      if (!section3 || !section3.components) {
        return;
      }

      // Per-component hazard data is extracted when the SDS provides it.
      // Fall back to section_2 mixture hazards only if component-level data is absent.
      // Track processed CAS numbers to deduplicate enrichment events
      const processedCasNumbers = new Set<string>();
      // Collect enrichment events to send in one batch after the loop
      // to avoid resending earlier events if a later upsert fails and
      // the step retries (inngest.send inside the loop is not idempotent).
      const enrichmentEvents: Array<{ name: string; data: Record<string, string> }> = [];

      // Accept both single H-codes (H225) and combined (H302+H332, H315+H319+H335)
      const H_CODE_RE = /^H\d{3}[A-Za-z]*(\+H\d{3}[A-Za-z]*)*$/;

      for (const component of section3.components) {
        const casNumber = component.casNumber?.value;
        const name = component.name?.value;

        if (!casNumber || !name) continue;

        // Skip if we've already processed this CAS number in this step
        if (processedCasNumbers.has(casNumber)) {
          continue;
        }
        processedCasNumbers.add(casNumber);

        // Extract per-component hazards if the SDS provides them.
        // Filter to only keep normalized H-codes (e.g., "H225", "H314") —
        // discard free-form statements like "Causes serious eye irritation"
        // which don't map to hazard wiki pages.
        // Filter to H-code format, then split combined codes (H315+H319 → [H315, H319])
        // so each individual hazard gets its own wiki page backlink.
        const componentHazards = (component.hazardStatements || [])
          .map((s: any) => (typeof s === 'string' ? s : s.value))
          .filter((v: string) => Boolean(v) && H_CODE_RE.test(v))
          .flatMap((v: string) => v.split('+'));
        const componentPictograms = (component.ghsPictograms || [])
          .map((s: any) => (typeof s === 'string' ? s : s.value))
          .filter(Boolean);

        // Only use per-component hazards when the SDS provides them.
        // Do NOT fall back to section_2 mixture hazards — those apply to the
        // whole product, not individual ingredients, and would incorrectly tag
        // non-hazardous components (e.g., water in a solvent blend).
        const hazards = componentHazards;
        const picts = componentPictograms;

        // Upsert chemical record — use per-component hazards on initial insert,
        // but preserve existing enriched data on conflict
        const [chemical] = await db
          .insert(chemicals)
          .values({
            orgId,
            casNumber,
            name,
            synonymNames: [],
            formula: null,
            molecularWeight: null,
            ghsHazardCodes: hazards,
            ghsPictograms: picts,
            sourceSdsId: sdsId,
          })
          .onConflictDoUpdate({
            target: [chemicals.orgId, chemicals.casNumber],
            set: {
              name,
              // Merge hazard codes: union existing with new so a richer SDS can
              // supplement codes that an earlier sparse SDS didn't provide.
              // COALESCE to '[]'::jsonb so empty union → empty array, not NULL
              ghsHazardCodes: sql`COALESCE((SELECT jsonb_agg(DISTINCT x) FROM (
                SELECT jsonb_array_elements_text(COALESCE(${chemicals.ghsHazardCodes}, '[]'::jsonb)) AS x
                UNION
                SELECT jsonb_array_elements_text(${JSON.stringify(hazards)}::jsonb) AS x
              ) sub), '[]'::jsonb)`,
              ghsPictograms: sql`COALESCE((SELECT jsonb_agg(DISTINCT x) FROM (
                SELECT jsonb_array_elements_text(COALESCE(${chemicals.ghsPictograms}, '[]'::jsonb)) AS x
                UNION
                SELECT jsonb_array_elements_text(${JSON.stringify(picts)}::jsonb) AS x
              ) sub), '[]'::jsonb)`,
              sourceSdsId: sdsId,
              updatedAt: new Date(),
            },
          })
          .returning();

        enrichmentEvents.push({
          name: "chemical.enriched",
          data: {
            chemicalId: chemical.id,
            casNumber: chemical.casNumber!,
            sdsId,
            orgId,
            extractionId: persistResult.extractionId!,
          },
        });
      }

      // Send all enrichment events in a single batch with idempotency keys
      // derived from extractionId + casNumber so retries of the same extraction
      // are deduped, but re-extracting the same SDS (new attempt) generates fresh events.
      // Also emit a single wiki.index.rebuild event so the index is rebuilt once per
      // SDS upload instead of once per chemical.
      if (enrichmentEvents.length > 0) {
        await inngest.send([
          ...enrichmentEvents.map((evt) => ({
            ...evt,
            id: `${persistResult.extractionId}-${evt.data.casNumber}`,
          })),
          {
            name: "wiki.index.rebuild",
            data: {
              sdsId,
              orgId,
              chemicalCount: enrichmentEvents.length,
              expectedSlugs: enrichmentEvents.map((e) => `chemical/${e.data.casNumber}`),
            },
            id: `rebuild-${persistResult.extractionId}`,
          },
        ]);
      }
    });

    return { sdsId, extractionId: persistResult.extractionId, modelUsed: "gemini" };
  }
);

import { inngest } from "@/inngest/client";
import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema/sds-documents";
import { sdsExtractions } from "@/lib/db/schema/sds-extractions";
import { safetyCards } from "@/lib/db/schema/safety-cards";
import { organizations } from "@/lib/db/schema/organizations";
import { eq } from "drizzle-orm";
import { translateSdsToVietnamese } from "@/lib/safety-card/translator";
import { renderSafetyCardPdf } from "@/lib/safety-card/render-pdf";
import { generateQrToken } from "@/lib/safety-card/qr-generator";
import { put } from "@vercel/blob";

export const generateSafetyCard = inngest.createFunction(
  { id: "generate-safety-card", retries: 2 },
  async ({ event }) => {
    const { sdsId, orgId } = event.data as { sdsId: string; orgId: string };

    // Fetch extraction
    const extraction = await db
      .select()
      .from(sdsExtractions)
      .where(eq(sdsExtractions.sdsId, sdsId))
      .limit(1);

    if (!extraction[0]?.sections) {
      throw new Error(`No extraction found for SDS ${sdsId}`);
    }

    // Fetch org name
    const org = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    // Translate to Vietnamese
    const translatedCard = await translateSdsToVietnamese(
      extraction[0].sections as Record<string, unknown>
    );

    // Render PDF
    const pdfBuffer = await renderSafetyCardPdf(
      translatedCard,
      org[0]?.name ?? "Unknown"
    );

    // Generate QR token
    const qrToken = await generateQrToken();

    // Upload PDF to Vercel Blob
    const cardId = crypto.randomUUID();
    const pathname = `${orgId}/cards/${cardId}.pdf`;
    const blob = await put(pathname, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });

    // Insert safety card record
    await db.insert(safetyCards).values({
      orgId,
      sdsId,
      publicToken: qrToken,
      blobUrl: blob.url,
      status: "ready",
      language: "vi",
    });

    // Update SDS document status
    await db
      .update(sdsDocuments)
      .set({ status: "ready" })
      .where(eq(sdsDocuments.id, sdsId));

    return { cardId, qrToken, blobUrl: blob.url };
  }
);

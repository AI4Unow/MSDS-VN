import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Proxy route for serving SDS PDF blobs.
 *
 * Why proxy instead of direct blob URL in iframe?
 * 1. Blob URLs can go stale (deleted, rotated, or private).
 * 2. This route validates auth + org ownership before serving.
 * 3. Returns a proper HTTP error (404/502) instead of raw JSON in an iframe.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { orgId } = await requireOrg();
  const { id } = await params;

  const [doc] = await db
    .select({ blobUrl: sdsDocuments.blobUrl, filename: sdsDocuments.filename })
    .from(sdsDocuments)
    .where(and(eq(sdsDocuments.id, id), eq(sdsDocuments.orgId, orgId)))
    .limit(1);

  if (!doc) {
    return new Response("Document not found", { status: 404 });
  }

  try {
    const blobRes = await fetch(doc.blobUrl);

    if (!blobRes.ok) {
      console.error(
        `[sds-pdf-proxy] Blob fetch failed for ${id}: ${blobRes.status}`,
      );
      return new Response("PDF file is unavailable. It may have been deleted from storage.", {
        status: 502,
      });
    }

    const contentType =
      blobRes.headers.get("content-type") ?? "application/pdf";

    return new Response(blobRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${doc.filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error(`[sds-pdf-proxy] Network error for ${id}:`, err);
    return new Response("Failed to retrieve PDF from storage", {
      status: 502,
    });
  }
}

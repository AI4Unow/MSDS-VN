import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function fetchPdfFromBlob(sdsId: string) {
  const [doc] = await db
    .select({ blobUrl: sdsDocuments.blobUrl, filename: sdsDocuments.filename })
    .from(sdsDocuments)
    .where(eq(sdsDocuments.id, sdsId))
    .limit(1);

  if (!doc) throw new Error(`SDS document not found: ${sdsId}`);

  const response = await fetch(doc.blobUrl);
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.status}`);

  const arrayBuf = await response.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuf);

  // Estimate page count from PDF structure (lightweight heuristic)
  const pdfText = Buffer.from(pdfBytes).toString("latin1");
  const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches?.length ?? 1;

  // Detect if scanned (low text content relative to file size)
  const textContent = Buffer.from(pdfBytes).toString("utf8").replace(/[^\x20-\x7E]/g, "");
  const isScanned = pdfBytes.length > 100000 && textContent.length < pdfBytes.length * 0.05;

  // Return base64 for Vercel AI SDK file part
  const base64 = Buffer.from(pdfBytes).toString("base64");

  return {
    pdfBase64: base64,
    pageCount,
    isScanned,
    filename: doc.filename,
  };
}

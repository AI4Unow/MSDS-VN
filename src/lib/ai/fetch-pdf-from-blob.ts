import { db } from "@/lib/db/client";
import { sdsDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Max PDF size: 50 MB — reject oversized files
const MAX_PDF_BYTES = 50 * 1024 * 1024;

export async function fetchPdfFromBlob(sdsId: string) {
  const [doc] = await db
    .select({ blobUrl: sdsDocuments.blobUrl, filename: sdsDocuments.filename })
    .from(sdsDocuments)
    .where(eq(sdsDocuments.id, sdsId))
    .limit(1);

  if (!doc) throw new Error(`SDS document not found: ${sdsId}`);

  const response = await fetch(doc.blobUrl);
  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.status}`);

  // M2: Enforce size limit before loading into memory
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_PDF_BYTES) {
    throw new Error(`PDF too large (${contentLength} bytes, max ${MAX_PDF_BYTES})`);
  }

  const arrayBuf = await response.arrayBuffer();

  // Double-check actual size after download
  if (arrayBuf.byteLength > MAX_PDF_BYTES) {
    throw new Error(`PDF too large (${arrayBuf.byteLength} bytes, max ${MAX_PDF_BYTES})`);
  }

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

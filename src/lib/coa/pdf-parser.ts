import { extractParameters } from "./parameter-extractor";

export async function parsePdfCoa(pdfBuffer: Buffer): Promise<{
  parsedData: Record<string, unknown>;
  confidence: number;
}> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    if (text.length > 100) {
      const params = await extractParameters(text, "pdf");
      return { parsedData: params, confidence: 0.9 };
    }

    // Scanned PDF — OCR needed
    console.log("PDF appears to be scanned, OCR required (not yet configured)");
    const params = await extractParameters(text, "ocr");
    return { parsedData: params, confidence: 0.5 };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

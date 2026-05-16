export type DocumentType = "coa" | "msds" | "invoice" | "other";

export function classifyDocument(filename: string, content: Buffer): DocumentType {
  const lowerFilename = filename.toLowerCase();

  if (lowerFilename.includes("coa") || lowerFilename.includes("certificate") || lowerFilename.includes("analysis")) {
    return "coa";
  }

  if (lowerFilename.includes("msds") || lowerFilename.includes("sds") || lowerFilename.includes("safety")) {
    return "msds";
  }

  if (lowerFilename.includes("invoice") || lowerFilename.includes("bill")) {
    return "invoice";
  }

  const contentStr = content.toString("utf-8", 0, Math.min(1000, content.length));
  if (contentStr.includes("Certificate of Analysis") || contentStr.includes("Test Results")) {
    return "coa";
  }

  return "other";
}

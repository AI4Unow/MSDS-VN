import type { ExtractionResult } from "./extraction-schema";

const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface LowConfidenceField {
  path: string;
  value: unknown;
  confidence: number;
}

export function findLowConfidenceFields(data: ExtractionResult): LowConfidenceField[] {
  const fields: LowConfidenceField[] = [];

  function walk(obj: unknown, path: string) {
    if (obj === null || obj === undefined) return;
    if (typeof obj !== "object") return;

    if ("_confidence" in (obj as object) && "value" in (obj as object)) {
      const record = obj as { _confidence: number; value: unknown };
      if (record._confidence < LOW_CONFIDENCE_THRESHOLD) {
        fields.push({ path, value: record.value, confidence: record._confidence });
      }
      return;
    }

    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        val.forEach((item, idx) => walk(item, `${path}.${key}[${idx}]`));
      } else if (typeof val === "object" && val !== null) {
        walk(val, path ? `${path}.${key}` : key);
      }
    }
  }

  walk(data, "");
  return fields;
}

export function overallConfidence(data: ExtractionResult): number {
  const confidences: number[] = [];

  function collect(obj: unknown) {
    if (obj === null || obj === undefined || typeof obj !== "object") return;
    if ("_confidence" in (obj as object)) {
      confidences.push((obj as { _confidence: number })._confidence);
      return;
    }
    for (const val of Object.values(obj as Record<string, unknown>)) {
      if (Array.isArray(val)) val.forEach(collect);
      else if (typeof val === "object") collect(val);
    }
  }

  collect(data);
  if (confidences.length === 0) return 0;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

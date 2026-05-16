import { generateText } from "ai";
import { google } from "@/lib/ai/gemini-client";

export async function extractParameters(
  text: string,
  sourceType: "pdf" | "ocr"
): Promise<Record<string, unknown>> {
  const truncatedText = text.length > 30000 ? text.slice(0, 30000) + "\n[TRUNCATED]" : text;

  const prompt = `Extract pharmaceutical COA parameters from this text. Return JSON only.

Text:
${truncatedText}

Extract these parameters (return null if not found):
{
  "purity": <number>,
  "heavyMetals": {
    "lead": <number in ppm>,
    "mercury": <number in ppm>,
    "arsenic": <number in ppm>
  },
  "microbial": {
    "totalAerobicCount": <number in CFU/g>,
    "yeastMold": <number in CFU/g>
  },
  "residualSolvents": {
    "ethanol": <number in ppm>
  },
  "batchNumber": <string>,
  "manufacturingDate": <ISO date string>,
  "expiryDate": <ISO date string>
}`;

  const { text: responseText } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt,
  });

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from Gemini response");
  }

  return JSON.parse(jsonMatch[0]);
}

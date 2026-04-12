import { generateObject } from "ai";
import { z } from "zod";
import { geminiFlash } from "@/lib/ai/gemini-client";
import { buildGlossaryPrompt } from "./moit-glossary";

const translatedSectionSchema = z.object({
  section1: z.object({
    productName: z.string(),
    manufacturer: z.string(),
    address: z.string(),
    phone: z.string(),
    emergencyPhone: z.string(),
  }),
  section2: z.object({
    hazardClassification: z.string(),
    signalWord: z.string(),
    hazardStatements: z.array(z.string()),
    precautionaryStatements: z.array(z.string()),
    pictograms: z.array(z.string()),
  }),
  section3: z.object({
    ingredients: z.array(
      z.object({
        name: z.string(),
        casNumber: z.string(),
        percentage: z.string(),
      })
    ),
  }),
  section4: z.object({
    inhalation: z.string(),
    skinContact: z.string(),
    eyeContact: z.string(),
    ingestion: z.string(),
    notesToPhysician: z.string().optional(),
  }),
  section5: z.object({
    suitableExtinguishingMedia: z.string(),
    unsuitableExtinguishingMedia: z.string().optional(),
    specificHazards: z.string().optional(),
    protectiveEquipment: z.string().optional(),
  }),
  section6: z.object({
    personalPrecautions: z.string(),
    environmentalPrecautions: z.string(),
    containment: z.string(),
    cleanup: z.string(),
  }),
  section7: z.object({
    handling: z.string(),
    storageConditions: z.string(),
    incompatibleMaterials: z.string().optional(),
  }),
  section8: z.object({
    exposureLimits: z.string().optional(),
    engineeringControls: z.string().optional(),
    ppe: z.object({
      respiratory: z.string().optional(),
      eye: z.string().optional(),
      skin: z.string().optional(),
      general: z.string().optional(),
    }),
  }),
});

export type TranslatedCard = z.infer<typeof translatedSectionSchema>;

const TRANSLATION_SYSTEM_PROMPT = `You are an expert chemical safety translator. You translate English SDS content into Vietnamese following MOIT regulations (Circular 01/2026/TT-BCT).

${buildGlossaryPrompt()}

Rules:
1. Use ONLY the glossary translations above.
2. Do NOT paraphrase hazard statements — translate them literally.
3. Keep CAS numbers, molecular formulas, and numeric values unchanged.
4. Translate measurement units using VN conventions (mg/m³, ppm, °C, etc.).
5. If a field is empty or unavailable in the source, leave it as an empty string.`;

export async function translateSdsToVietnamese(
  sections: Record<string, unknown>
): Promise<TranslatedCard> {
  const result = await generateObject({
    model: geminiFlash,
    system: TRANSLATION_SYSTEM_PROMPT,
    prompt: `Translate the following SDS sections into Vietnamese per MOIT Appendix I format:\n\n${JSON.stringify(sections, null, 2)}`,
    schema: translatedSectionSchema,
  });

  return result.object;
}

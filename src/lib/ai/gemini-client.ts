import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const geminiFlashLite = google("gemini-3.1-flash-lite");
export const geminiFlash = google("gemini-3.1-flash");

export function routeExtractionModel(pageCount: number, isScanned: boolean) {
  if (isScanned || pageCount > 20) return geminiFlash;
  return geminiFlashLite;
}

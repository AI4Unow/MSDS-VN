import { geminiFlashLite, geminiFlash } from "@/lib/ai/gemini-client";

/**
 * Heuristic model routing for compliance chat.
 * Flash Lite for simple lookups; Flash for regulatory interpretation.
 */
export function pickChatModel(
  messages: Array<{ role: string; content: string }>
) {
  const lastUserMsg = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  if (!lastUserMsg) return geminiFlashLite;

  const text = lastUserMsg.content.toLowerCase();
  const isComplex =
    text.includes("tại sao") ||
    text.includes("because") ||
    text.includes("why") ||
    text.includes("phân tích") ||
    text.includes("so sánh") ||
    text.includes("nghị định") ||
    text.includes("thông tư") ||
    text.includes("circular") ||
    text.includes("decree") ||
    text.length > 200;

  return isComplex ? geminiFlash : geminiFlashLite;
}

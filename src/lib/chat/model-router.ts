import { geminiFlashLite } from "@/lib/ai/gemini-client";

/**
 * Compliance chat is pinned to Flash-Lite for predictable latency/cost.
 */
export function pickChatModel(
  messages: Array<{ role: string; content: string }>
) {
  void messages;
  return geminiFlashLite;
}

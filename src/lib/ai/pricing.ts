// Pricing per 1M tokens (USD) — update when model pricing changes
const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.30 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
};

export function computeCostUsd(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[modelId] ?? PRICING["gemini-2.0-flash-lite"];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

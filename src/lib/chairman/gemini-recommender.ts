import { generateText } from "ai";
import { google } from "@/lib/ai/gemini-client";

export interface RecommendationRequest {
  currentAllocation: Record<number, number>;
  componentStatuses: Array<{ id: number; status: string; progress: number }>;
  kpiGaps: Record<string, { current: number; target: number; gap: number }>;
  constraints: { totalBudget: number; minPerComponent: number; maxPerComponent: number };
}

export interface Recommendation {
  suggestedReallocation: Record<number, number>;
  rationale: string;
  expectedImpact: string;
  risks: string[];
  confidence: "low" | "medium" | "high";
}

export async function generateRecommendation(
  request: RecommendationRequest
): Promise<Recommendation> {
  const prompt = `You are a strategic advisor for Shine Group's AI transformation (Vietnamese chemical conglomerate).

Current budget allocation (tỷ VND): ${JSON.stringify(request.currentAllocation)}
Component statuses: ${JSON.stringify(request.componentStatuses)}
KPI gaps (current vs target): ${JSON.stringify(request.kpiGaps)}
Constraints: Total budget ${request.constraints.totalBudget} tỷ VND, min ${request.constraints.minPerComponent} per component, max ${request.constraints.maxPerComponent}

Analyze and recommend budget reallocation to close KPI gaps. Prioritize:
1. Components behind schedule with high ROI potential
2. Components blocking others (dependencies)
3. Quick wins (short time-to-impact)

Return JSON only:
{
  "suggestedReallocation": {"1": 15, "2": 12, ...},
  "rationale": "...",
  "expectedImpact": "...",
  "risks": ["...", "..."],
  "confidence": "medium"
}`;

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to extract JSON from Gemini response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    suggestedReallocation: typeof parsed.suggestedReallocation === "object" ? parsed.suggestedReallocation : {},
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
    expectedImpact: typeof parsed.expectedImpact === "string" ? parsed.expectedImpact : "",
    risks: Array.isArray(parsed.risks) ? parsed.risks.filter((r: unknown) => typeof r === "string") : [],
    confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
  };
}

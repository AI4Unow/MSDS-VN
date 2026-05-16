import { applyRules } from "@/lib/chairman/rule-engine";
import { runMonteCarloSimulation } from "@/lib/chairman/monte-carlo";
import { generateRecommendation } from "@/lib/chairman/gemini-recommender";
import { db } from "@/lib/db/client";
import { chairmanScenarios, chairmanKpis, chairmanComponentStatus } from "@/lib/db/schema/chairman";

export interface SimulationRequest {
  budgetAllocation: Record<number, number>;
  timelineAdjustments: Record<string, number>;
  numSimulations?: number;
}

export interface SimulationResult {
  scenarioId: string;
  kpiProjections: Array<{
    metric: string;
    baseline: number;
    projected: { min: number; median: number; max: number };
    confidence: string;
    dataSource: string;
  }>;
  aiRecommendation: {
    suggestedReallocation: Record<number, number>;
    rationale: string;
    expectedImpact: string;
    risks: string[];
  } | null;
  timestamp: number;
}

export async function runSimulation(
  request: SimulationRequest
): Promise<SimulationResult> {
  const baselineKpisRows = await db.select().from(chairmanKpis);
  const baselineMap = Object.fromEntries(
    baselineKpisRows.map((k) => [k.metricName, k.baselineValue ?? 0])
  );

  const ruleBasedDeltas = applyRules(
    request.budgetAllocation,
    request.timelineAdjustments,
    6
  );

  const monteCarloResults = runMonteCarloSimulation(
    baselineMap,
    ruleBasedDeltas,
    { numSimulations: request.numSimulations ?? 1000, uncertaintyPercent: 15 }
  );

  let aiRec: SimulationResult["aiRecommendation"] = null;
  try {
    const componentStatuses = await db.select().from(chairmanComponentStatus);
    const kpiGaps = baselineKpisRows.map((k) => ({
      metric: k.metricName,
      current: k.currentValue ?? 0,
      target: k.targetValue ?? 0,
      gap: (k.targetValue ?? 0) - (k.currentValue ?? 0),
    }));

    aiRec = await generateRecommendation({
      currentAllocation: request.budgetAllocation,
      componentStatuses: componentStatuses.map((c) => ({
        id: c.componentId,
        status: c.status,
        progress: c.progressPercent ?? 0,
      })),
      kpiGaps: Object.fromEntries(kpiGaps.map((g) => [g.metric, g])),
      constraints: { totalBudget: 82, minPerComponent: 2, maxPerComponent: 25 },
    });
  } catch (err) {
    console.error("AI recommendation failed, continuing without it:", err);
  }

  const scenarioId = `scenario_${Date.now()}`;
  await db.insert(chairmanScenarios).values({
    id: scenarioId,
    name: `Simulation ${new Date().toISOString()}`,
    budgetAllocation: request.budgetAllocation,
    timelineAdjustments: request.timelineAdjustments,
    projectedKpis: monteCarloResults,
    aiRecommendation: aiRec ? JSON.stringify(aiRec) : null,
  });

  return {
    scenarioId,
    kpiProjections: monteCarloResults.map((mc) => ({
      metric: mc.metric,
      baseline: baselineMap[mc.metric] ?? 0,
      projected: { min: mc.percentile5, median: mc.percentile50, max: mc.percentile95 },
      confidence: ruleBasedDeltas[mc.metric]?.confidence ?? "medium",
      dataSource: ruleBasedDeltas[mc.metric]?.dataSource ?? "estimated",
    })),
    aiRecommendation: aiRec,
    timestamp: Date.now(),
  };
}

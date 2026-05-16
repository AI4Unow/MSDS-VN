export interface Rule {
  componentId: number;
  budgetThreshold: number;
  kpiImpact: {
    metric: string;
    deltaPercent: number;
    delayMonths: number;
    confidence: "low" | "medium" | "high";
    dataSource: "estimated" | "validated" | "assumed";
  }[];
}

export interface KpiProjection {
  value: number;
  confidence: string;
  dataSource: string;
}

const rules: Rule[] = [
  {
    componentId: 1,
    budgetThreshold: 10,
    kpiImpact: [
      { metric: "win_rate", deltaPercent: 15, delayMonths: 6, confidence: "medium", dataSource: "estimated" },
      { metric: "revenue", deltaPercent: 8, delayMonths: 9, confidence: "medium", dataSource: "estimated" },
    ],
  },
  {
    componentId: 2,
    budgetThreshold: 8,
    kpiImpact: [
      { metric: "inventory_days", deltaPercent: -20, delayMonths: 4, confidence: "high", dataSource: "estimated" },
    ],
  },
  {
    componentId: 3,
    budgetThreshold: 6,
    kpiImpact: [
      { metric: "critical_errors", deltaPercent: -70, delayMonths: 3, confidence: "high", dataSource: "estimated" },
      { metric: "manual_task_reduction", deltaPercent: 30, delayMonths: 4, confidence: "high", dataSource: "estimated" },
    ],
  },
  {
    componentId: 4,
    budgetThreshold: 5,
    kpiImpact: [
      { metric: "data_driven_decisions", deltaPercent: 40, delayMonths: 6, confidence: "medium", dataSource: "assumed" },
    ],
  },
  {
    componentId: 5,
    budgetThreshold: 4,
    kpiImpact: [
      { metric: "manual_task_reduction", deltaPercent: 15, delayMonths: 3, confidence: "high", dataSource: "estimated" },
    ],
  },
  {
    componentId: 6,
    budgetThreshold: 4,
    kpiImpact: [
      { metric: "data_driven_decisions", deltaPercent: 20, delayMonths: 8, confidence: "low", dataSource: "assumed" },
    ],
  },
  {
    componentId: 7,
    budgetThreshold: 3,
    kpiImpact: [
      { metric: "revenue", deltaPercent: 3, delayMonths: 12, confidence: "low", dataSource: "assumed" },
    ],
  },
  {
    componentId: 8,
    budgetThreshold: 3,
    kpiImpact: [
      { metric: "critical_errors", deltaPercent: -15, delayMonths: 10, confidence: "low", dataSource: "assumed" },
    ],
  },
  {
    componentId: 9,
    budgetThreshold: 2,
    kpiImpact: [
      { metric: "inventory_days", deltaPercent: -10, delayMonths: 12, confidence: "low", dataSource: "assumed" },
    ],
  },
];

export function applyRules(
  budgetAllocation: Record<number, number>,
  timelineAdjustments: Record<string, number>,
  currentMonth: number
): Record<string, KpiProjection> {
  const projections: Record<string, KpiProjection> = {};

  for (const rule of rules) {
    const allocated = budgetAllocation[rule.componentId] ?? 0;
    if (allocated < rule.budgetThreshold) continue;

    const timelineAdj = timelineAdjustments[`phase_${rule.componentId}_delay`] ?? 0;

    for (const impact of rule.kpiImpact) {
      const effectiveMonth = impact.delayMonths + timelineAdj;
      const timeFactor = Math.min(1, Math.max(0, (currentMonth - effectiveMonth + 12) / 12));

      const delta = impact.deltaPercent * timeFactor;

      if (!projections[impact.metric]) {
        projections[impact.metric] = { value: 0, confidence: impact.confidence, dataSource: impact.dataSource };
      }

      projections[impact.metric].value += delta;

      if (impact.confidence === "low") projections[impact.metric].confidence = "low";
      else if (impact.confidence === "medium" && projections[impact.metric].confidence !== "low") {
        projections[impact.metric].confidence = "medium";
      }
    }
  }

  return projections;
}

export { rules };

export interface MonteCarloConfig {
  numSimulations: number;
  uncertaintyPercent: number;
  seed?: number;
}

export interface MonteCarloResult {
  metric: string;
  percentile5: number;
  percentile50: number;
  percentile95: number;
  mean: number;
  stdDev: number;
}

function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function runMonteCarloSimulation(
  baselineKpis: Record<string, number>,
  ruleBasedDeltas: Record<string, { value: number; confidence: string; dataSource: string }>,
  config: MonteCarloConfig
): MonteCarloResult[] {
  const metrics = new Set([...Object.keys(baselineKpis), ...Object.keys(ruleBasedDeltas)]);
  const results: MonteCarloResult[] = [];

  for (const metric of metrics) {
    const baseline = baselineKpis[metric] ?? 0;
    const delta = ruleBasedDeltas[metric]?.value ?? 0;
    const uncertainty = config.uncertaintyPercent / 100;
    const stdDev = Math.abs(delta) * uncertainty || Math.abs(baseline) * 0.05;

    const samples: number[] = [];
    for (let i = 0; i < config.numSimulations; i++) {
      const sampledDelta = normalRandom(delta, stdDev);
      const isLowerBetter = metric === "inventory_days" || metric === "critical_errors";
      const projected = isLowerBetter
        ? baseline - sampledDelta
        : baseline + sampledDelta;
      samples.push(projected);
    }

    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;

    results.push({
      metric,
      percentile5: percentile(samples, 5),
      percentile50: percentile(samples, 50),
      percentile95: percentile(samples, 95),
      mean,
      stdDev: Math.sqrt(variance),
    });
  }

  return results;
}

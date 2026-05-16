"use client";

interface Projection {
  metric: string;
  baseline: number;
  projected: { min: number; median: number; max: number };
  confidence: string;
  dataSource: string;
}

export function ConfidenceChart({ projections }: { projections: Projection[] }) {
  return (
    <div className="space-y-4">
      {projections.map((p) => {
        const range = p.projected.max - p.projected.min || 1;
        const medianPct = ((p.projected.median - p.projected.min) / range) * 100;

        return (
          <div key={p.metric} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">
                {p.metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span className="text-xs text-gray-500">
                {p.confidence} | {p.dataSource}
              </span>
            </div>

            {/* Confidence interval bar */}
            <div className="relative h-6 bg-gray-100 rounded">
              <div
                className="absolute h-full bg-blue-200 rounded"
                style={{
                  left: "10%",
                  width: "80%",
                }}
              />
              <div
                className="absolute h-full w-1 bg-blue-700 rounded"
                style={{ left: `${10 + medianPct * 0.8}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                <span>{p.projected.min.toFixed(1)}</span>
                <span className="font-bold">{p.projected.median.toFixed(1)}</span>
                <span>{p.projected.max.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Baseline: {p.baseline.toFixed(1)}</span>
              <span>P5 — P50 — P95</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

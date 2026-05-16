"use client";

import { useState } from "react";
import { BudgetSlider } from "@/components/chairman/budget-slider";
import { ConfidenceChart } from "@/components/chairman/confidence-chart";

const componentNames: Record<number, string> = {
  1: "Sales & Solutions AI",
  2: "Demand Planning",
  3: "Legal/QC Intel",
  4: "Master Data",
  5: "Document Intel",
  6: "Cross-Sub Analytics",
  7: "API & Integration",
  8: "Predictive QC",
  9: "Autonomous Procurement",
};

export default function SandboxPage() {
  const [allocation, setAllocation] = useState<Record<number, number>>({
    1: 15, 2: 12, 3: 10, 4: 8, 5: 7, 6: 6, 7: 5, 8: 4, 9: 3,
  });
  const [results, setResults] = useState<Awaited<ReturnType<typeof runSimulation>> | null>(null);
  const [loading, setLoading] = useState(false);

  const totalBudget = Object.values(allocation).reduce((a, b) => a + b, 0);
  const isValid = totalBudget >= 69 && totalBudget <= 82;

  async function handleSimulate() {
    setLoading(true);
    try {
      const res = await fetch("/api/chairman/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetAllocation: allocation, timelineAdjustments: {} }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Scenario Sandbox</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Budget Allocation</h2>
          <div className="space-y-4">
            {Object.entries(allocation).map(([id, value]) => (
              <BudgetSlider
                key={id}
                componentId={parseInt(id)}
                label={componentNames[parseInt(id)] ?? `Component ${id}`}
                value={value}
                onChange={(val) => setAllocation({ ...allocation, [id]: val })}
              />
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded">
            <p className="text-lg">
              Total:{" "}
              <span className={isValid ? "text-green-600" : "text-red-600"}>
                {totalBudget} tỷ VND
              </span>
            </p>
            <p className="text-sm text-gray-600">Target: 69–82 tỷ VND</p>
          </div>

          <button
            onClick={handleSimulate}
            disabled={!isValid || loading}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {loading ? "Simulating..." : "Run Simulation"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Projected Impact</h2>
          {results ? (
            <ConfidenceChart projections={results.kpiProjections} />
          ) : (
            <div className="text-gray-500 p-8 text-center border rounded">
              Run a simulation to see projected KPI impacts
            </div>
          )}

          {results?.aiRecommendation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold mb-2">AI Recommendation</h3>
              <p className="text-sm">{results.aiRecommendation.rationale}</p>
              <p className="text-sm mt-2 text-gray-600">
                Expected impact: {results.aiRecommendation.expectedImpact}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function runSimulation(params: {
  budgetAllocation: Record<number, number>;
  timelineAdjustments: Record<string, number>;
}) {
  return fetch("/api/chairman/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  }).then((r) => r.json());
}

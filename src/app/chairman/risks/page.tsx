import { db } from "@/lib/db/client";
import { chairmanRisks } from "@/lib/db/schema/chairman";

export const dynamic = "force-dynamic";

export default async function RisksPage() {
  const riskList = await db.select().from(chairmanRisks);

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Risk Register</h1>

      <div className="space-y-4">
        {riskList.map((risk) => (
          <div key={risk.id} className="border rounded p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{risk.title}</h3>
                {risk.description && (
                  <p className="text-gray-600 mt-1">{risk.description}</p>
                )}
                <div className="flex gap-4 mt-3">
                  <span className={`px-2 py-1 rounded text-sm ${severityColors[risk.severity] ?? ""}`}>
                    {risk.severity.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">Likelihood: {risk.likelihood}</span>
                  {risk.owner && (
                    <span className="text-sm text-gray-600">Owner: {risk.owner}</span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    risk.mitigationStatus === "mitigated"
                      ? "bg-green-100 text-green-800"
                      : risk.mitigationStatus === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {risk.mitigationStatus.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

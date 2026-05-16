import { db } from "@/lib/db/client";
import { mdGovernanceDecisions } from "@/lib/db/schema/master-data";

export const dynamic = "force-dynamic";

export default async function CouncilPage() {
  const recentDecisions = await db
    .select()
    .from(mdGovernanceDecisions);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Data Governance Council</h1>

      {/* Council Members */}
      <div className="mb-8 p-4 bg-gray-50 rounded">
        <h2 className="text-xl font-semibold mb-3">Council Members</h2>
        <ul className="space-y-2 text-sm">
          <li>Asia Shine: Data Owner (Products, Suppliers)</li>
          <li>Sapharchem: Data Owner (Pharmaceutical Standards)</li>
          <li>Smart Ingredients: Data Owner (Specialty Ingredients)</li>
          <li>novaLAB: Data Owner (Experiment Data)</li>
          <li>AI4U.now: Technical Lead (Schema, ETL)</li>
        </ul>
      </div>

      {/* Recent Decisions */}
      <h2 className="text-xl font-semibold mb-4">Decisions</h2>
      {recentDecisions.length === 0 ? (
        <p className="text-gray-500">No governance decisions recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {recentDecisions.map((decision) => (
            <div key={decision.id} className="border rounded p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{decision.decisionType}</h3>
                  <p className="text-gray-600 mt-1">{decision.description}</p>
                  {decision.rationale && (
                    <p className="text-sm text-gray-500 mt-2">Rationale: {decision.rationale}</p>
                  )}
                </div>
                {decision.decisionDate && (
                  <div className="ml-4 text-right text-sm text-gray-600">
                    {new Date(decision.decisionDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

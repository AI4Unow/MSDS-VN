import { db } from "@/lib/db/client";
import { chairmanSubsidiaryReadiness } from "@/lib/db/schema/chairman";

export const dynamic = "force-dynamic";

export default async function SubsidiariesPage() {
  const subsidiaries = await db.select().from(chairmanSubsidiaryReadiness);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Subsidiary Readiness Scorecard</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left">Subsidiary</th>
            <th className="border p-3">Data Quality</th>
            <th className="border p-3">Team Readiness</th>
            <th className="border p-3">Infra Status</th>
            <th className="border p-3">Pilot Results</th>
            <th className="border p-3">Overall</th>
          </tr>
        </thead>
        <tbody>
          {subsidiaries.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50">
              <td className="border p-3 font-semibold">{sub.subsidiaryName}</td>
              <td className="border p-3 text-center">
                <span
                  className={
                    (sub.dataQualityScore ?? 0) >= 70
                      ? "text-green-600"
                      : (sub.dataQualityScore ?? 0) >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                  }
                >
                  {sub.dataQualityScore ?? 0}%
                </span>
              </td>
              <td className="border p-3 text-center">
                {sub.teamReadiness === "ready"
                  ? "Ready"
                  : sub.teamReadiness === "training"
                    ? "Training"
                    : "Not Ready"}
              </td>
              <td className="border p-3 text-center">
                {sub.infraStatus === "live"
                  ? "Live"
                  : sub.infraStatus === "pending"
                    ? "Pending"
                    : "Not Started"}
              </td>
              <td className="border p-3 text-center">
                {sub.pilotResults === "completed"
                  ? "Completed"
                  : sub.pilotResults === "in_progress"
                    ? "In Progress"
                    : "Not Started"}
              </td>
              <td className="border p-3 text-center text-2xl">
                {sub.overallStatus === "green" ? "🟢" : sub.overallStatus === "yellow" ? "🟡" : "🔴"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

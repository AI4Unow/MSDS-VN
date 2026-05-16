import { db } from "@/lib/db/client";
import { mdDataSources, mdDataQualityIssues } from "@/lib/db/schema/master-data";
import { eq } from "drizzle-orm";

export default async function QualityDashboardPage() {
  const sources = await db.select().from(mdDataSources);
  const openIssues = await db
    .select()
    .from(mdDataQualityIssues)
    .where(eq(mdDataQualityIssues.status, "open"));

  const avgQuality =
    sources.length > 0
      ? sources.reduce((sum, s) => sum + (s.dataQualityScore ?? 0), 0) / sources.length
      : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Data Quality Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">Overall Quality Score</p>
          <p className="text-4xl font-bold text-blue-600">{avgQuality.toFixed(1)}%</p>
        </div>
        <div className="p-6 bg-yellow-50 rounded">
          <p className="text-sm text-gray-600">Open Issues</p>
          <p className="text-4xl font-bold text-yellow-600">{openIssues.length}</p>
        </div>
        <div className="p-6 bg-green-50 rounded">
          <p className="text-sm text-gray-600">Data Sources</p>
          <p className="text-4xl font-bold text-green-600">{sources.length}</p>
        </div>
      </div>

      {/* Per-source quality */}
      <h2 className="text-xl font-semibold mb-4">Quality by Source</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Source</th>
            <th className="border p-2">Entity Type</th>
            <th className="border p-2">Records</th>
            <th className="border p-2">Quality Score</th>
            <th className="border p-2">Migration Status</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source.id} className="hover:bg-gray-50">
              <td className="border p-2">{source.sourceLocation}</td>
              <td className="border p-2 text-center">{source.entityType ?? "—"}</td>
              <td className="border p-2 text-center">{source.recordCount ?? 0}</td>
              <td className="border p-2 text-center">
                <span
                  className={`px-2 py-1 rounded ${
                    (source.dataQualityScore ?? 0) >= 70
                      ? "bg-green-100 text-green-800"
                      : (source.dataQualityScore ?? 0) >= 40
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {source.dataQualityScore?.toFixed(1) ?? "N/A"}%
                </span>
              </td>
              <td className="border p-2 text-center">{source.migrationStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

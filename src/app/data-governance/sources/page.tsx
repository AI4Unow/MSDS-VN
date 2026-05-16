import { db } from "@/lib/db/client";
import { mdDataSources } from "@/lib/db/schema/master-data";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await db.select().from(mdDataSources);

  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Data Source Inventory</h1>

      {sources.length === 0 ? (
        <div className="text-gray-500 p-8 text-center border rounded">
          No data sources cataloged yet. Run the source scanner to discover Asia Shine data sources.
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Source Location</th>
              <th className="border p-3">Type</th>
              <th className="border p-3">Entity</th>
              <th className="border p-3">Records</th>
              <th className="border p-3">Owner</th>
              <th className="border p-3">Migration</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-gray-50">
                <td className="border p-3 font-medium">{source.sourceLocation}</td>
                <td className="border p-3 text-center">{source.sourceType ?? "—"}</td>
                <td className="border p-3 text-center">{source.entityType ?? "—"}</td>
                <td className="border p-3 text-center">{source.recordCount ?? 0}</td>
                <td className="border p-3 text-center">{source.owner ?? "—"}</td>
                <td className="border p-3 text-center">
                  <span className={`px-2 py-1 rounded text-sm ${statusColors[source.migrationStatus] ?? ""}`}>
                    {source.migrationStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

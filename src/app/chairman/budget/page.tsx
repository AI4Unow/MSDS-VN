import { db } from "@/lib/db/client";
import { chairmanComponentStatus } from "@/lib/db/schema/chairman";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const components = await db.select().from(chairmanComponentStatus);
  const totalAllocated = components.reduce((s, c) => s + (c.budgetAllocated ?? 0), 0);
  const totalConsumed = components.reduce((s, c) => s + (c.budgetConsumed ?? 0), 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Budget & Timeline Tracker</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">Total Allocated</p>
          <p className="text-2xl font-bold text-blue-600">{totalAllocated} tỷ VND</p>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <p className="text-sm text-gray-600">Total Consumed</p>
          <p className="text-2xl font-bold text-green-600">{totalConsumed.toFixed(1)} tỷ VND</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded">
          <p className="text-sm text-gray-600">Remaining</p>
          <p className="text-2xl font-bold text-yellow-600">{(totalAllocated - totalConsumed).toFixed(1)} tỷ VND</p>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left">Component</th>
            <th className="border p-3">Layer</th>
            <th className="border p-3">Allocated</th>
            <th className="border p-3">Consumed</th>
            <th className="border p-3">Progress</th>
            <th className="border p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {components.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="border p-3 font-medium">{c.name}</td>
              <td className="border p-3 text-center">{c.layer}</td>
              <td className="border p-3 text-center">{c.budgetAllocated ?? 0} tỷ</td>
              <td className="border p-3 text-center">{c.budgetConsumed?.toFixed(1) ?? 0} tỷ</td>
              <td className="border p-3 text-center">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded h-2">
                    <div
                      className="bg-blue-600 rounded h-2"
                      style={{ width: `${c.progressPercent ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm">{c.progressPercent ?? 0}%</span>
                </div>
              </td>
              <td className="border p-3 text-center">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    c.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : c.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : c.status === "blocked"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

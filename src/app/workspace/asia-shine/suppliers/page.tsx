import { db } from "@/lib/db/client";
import { asSuppliers } from "@/lib/db/schema/asia-shine";

export default async function SuppliersPage() {
  const suppliers = await db.select().from(asSuppliers);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Supplier Quality Tracking — Asia Shine</h1>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left">Supplier</th>
            <th className="border p-3">Country</th>
            <th className="border p-3">Quality Score</th>
            <th className="border p-3">Total COAs</th>
            <th className="border p-3">Flagged</th>
            <th className="border p-3">Flag Rate</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => {
            const flagRate = s.totalCoasReceived ? ((s.flaggedCoas ?? 0) / s.totalCoasReceived * 100) : 0;
            return (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="border p-3 font-semibold">{s.name}</td>
                <td className="border p-3 text-center">{s.country ?? "—"}</td>
                <td className="border p-3 text-center">
                  <span
                    className={
                      (s.qualityScore ?? 100) >= 90
                        ? "text-green-600"
                        : (s.qualityScore ?? 100) >= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                    }
                  >
                    {(s.qualityScore ?? 100).toFixed(0)}
                  </span>
                </td>
                <td className="border p-3 text-center">{s.totalCoasReceived ?? 0}</td>
                <td className="border p-3 text-center">{s.flaggedCoas ?? 0}</td>
                <td className="border p-3 text-center">
                  <span className={flagRate > 20 ? "text-red-600" : "text-gray-600"}>
                    {flagRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

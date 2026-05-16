import { db } from "@/lib/db/client";
import { asCoas, asSuppliers, asProducts } from "@/lib/db/schema/asia-shine";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoasPage() {
  const pendingCoas = await db
    .select({ coa: asCoas, supplier: asSuppliers, product: asProducts })
    .from(asCoas)
    .leftJoin(asSuppliers, eq(asCoas.supplierId, asSuppliers.id))
    .leftJoin(asProducts, eq(asCoas.productId, asProducts.id))
    .where(eq(asCoas.approvalStatus, "pending"));

  const recentCoas = await db
    .select({ coa: asCoas, supplier: asSuppliers })
    .from(asCoas)
    .leftJoin(asSuppliers, eq(asCoas.supplierId, asSuppliers.id))
    .orderBy(asCoas.receivedDate)
    .limit(20);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">COA Management — Asia Shine</h1>

      {/* Pending Approvals */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          Pending Approvals ({pendingCoas.length})
        </h2>
        {pendingCoas.length === 0 ? (
          <p className="text-gray-600">No COAs pending approval</p>
        ) : (
          <div className="space-y-3">
            {pendingCoas.map(({ coa, supplier, product }) => (
              <Link
                key={coa.id}
                href={`/workspace/asia-shine/coas/${coa.id}`}
                className="block border rounded p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{product?.name ?? "Unknown Product"}</h3>
                    <p className="text-sm text-gray-600">Supplier: {supplier?.name ?? "Unknown"}</p>
                    <p className="text-sm text-gray-600">Batch: {coa.batchNumber ?? "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
                      {Array.isArray(coa.deviations) ? coa.deviations.length : 0} deviations
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent COAs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent COAs</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Batch</th>
              <th className="border p-2 text-left">Supplier</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Deviations</th>
            </tr>
          </thead>
          <tbody>
            {recentCoas.map(({ coa, supplier }) => (
              <tr key={coa.id} className="hover:bg-gray-50">
                <td className="border p-2">
                  <Link href={`/workspace/asia-shine/coas/${coa.id}`} className="text-blue-600 hover:underline">
                    {coa.batchNumber ?? "N/A"}
                  </Link>
                </td>
                <td className="border p-2">{supplier?.name ?? "Unknown"}</td>
                <td className="border p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      coa.approvalStatus === "approved" || coa.approvalStatus === "auto_approved"
                        ? "bg-green-100 text-green-800"
                        : coa.approvalStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {coa.approvalStatus}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  {coa.hasDeviations ? (Array.isArray(coa.deviations) ? coa.deviations.length : 0) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

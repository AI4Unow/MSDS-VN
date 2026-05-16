import { db } from "@/lib/db/client";
import { asCoas, asSuppliers, asProducts } from "@/lib/db/schema/asia-shine";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ApprovalForm } from "@/components/chairman/approval-form";

export default async function CoaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db
    .select({ coa: asCoas, supplier: asSuppliers, product: asProducts })
    .from(asCoas)
    .leftJoin(asSuppliers, eq(asCoas.supplierId, asSuppliers.id))
    .leftJoin(asProducts, eq(asCoas.productId, asProducts.id))
    .where(eq(asCoas.id, id))
    .limit(1);

  if (!rows.length) notFound();
  const { coa, supplier, product } = rows[0];
  const parsedData = coa.parsedData as Record<string, unknown> | null;
  const deviations = Array.isArray(coa.deviations) ? coa.deviations : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">COA Detail</h1>

      {/* Header */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
        <div>
          <p className="text-sm text-gray-600">Product</p>
          <p className="font-semibold">{product?.name ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Supplier</p>
          <p className="font-semibold">{supplier?.name ?? "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Batch Number</p>
          <p className="font-semibold">{coa.batchNumber ?? "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="font-semibold">{coa.parserConfidence?.toFixed(2) ?? "N/A"}</p>
        </div>
      </div>

      {/* Deviations */}
      {deviations.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-800 mb-3">
            {deviations.length} Deviation(s) Detected
          </h2>
          <div className="space-y-2">
            {deviations.map((dev: Record<string, unknown>, idx: number) => (
              <div key={idx} className="p-3 bg-white rounded border border-red-300">
                <p className="font-semibold text-red-700">{dev.parameter as string}</p>
                <p className="text-sm">{dev.message as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parsed Parameters */}
      {parsedData && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Parameter</th>
                <th className="border p-2 text-center">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parsedData).map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="border p-2">{key}</td>
                  <td className="border p-2 text-center">
                    {typeof value === "object" && value !== null
                      ? JSON.stringify(value)
                      : String(value ?? "N/A")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approval Form */}
      {coa.approvalStatus === "pending" && (
        <ApprovalForm coaId={coa.id} />
      )}

      {/* Approval Status */}
      {coa.approvalStatus !== "pending" && (
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Approval Status</h3>
          <p
            className={`text-lg ${
              coa.approvalStatus === "approved" || coa.approvalStatus === "auto_approved"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {coa.approvalStatus.toUpperCase()}
          </p>
          {coa.approvalNotes && <p className="text-sm mt-2">{coa.approvalNotes}</p>}
        </div>
      )}
    </div>
  );
}

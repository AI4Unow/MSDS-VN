import { db } from "@/lib/db/client";
import { chairmanComponentStatus } from "@/lib/db/schema/chairman";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ComponentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [component] = await db
    .select()
    .from(chairmanComponentStatus)
    .where(eq(chairmanComponentStatus.id, id))
    .limit(1);

  if (!component) notFound();

  const blockers = (component.blockers as Array<{ description: string; owner: string; eta: string }>) ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{component.name}</h1>
      <p className="text-gray-600 mb-6">Component #{component.componentId} — Layer {component.layer}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-semibold">{component.status}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Budget Allocated</p>
          <p className="text-lg font-semibold">{component.budgetAllocated ?? 0} tỷ VND</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Budget Consumed</p>
          <p className="text-lg font-semibold">{component.budgetConsumed?.toFixed(1) ?? 0} tỷ VND</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Progress</p>
          <p className="text-lg font-semibold">{component.progressPercent ?? 0}%</p>
        </div>
      </div>

      {blockers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Blockers</h2>
          <div className="space-y-2">
            {blockers.map((b, i) => (
              <div key={i} className="p-3 border rounded bg-red-50">
                <p className="font-medium">{b.description}</p>
                <p className="text-sm text-gray-600">Owner: {b.owner} | ETA: {b.eta}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-3">Budget Progress</h2>
        <div className="w-full bg-gray-200 rounded h-4">
          <div
            className="bg-blue-600 rounded h-4 transition-all"
            style={{ width: `${component.progressPercent ?? 0}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>0%</span>
          <span>{component.progressPercent ?? 0}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

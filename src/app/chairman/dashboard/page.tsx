import { db } from "@/lib/db/client";
import { chairmanKpis, chairmanComponentStatus } from "@/lib/db/schema/chairman";
import { KpiGauge } from "@/components/chairman/kpi-gauge";
import { ArchitectureDiagram } from "@/components/chairman/architecture-diagram";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const kpiData = await db.select().from(chairmanKpis);
  const components = await db.select().from(chairmanComponentStatus);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bộ Não Số — Executive Overview</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ArchitectureDiagram components={components} />

        <div className="grid grid-cols-2 gap-4">
          {kpiData.map((kpi) => (
            <KpiGauge
              key={kpi.id}
              label={kpi.metricName}
              current={kpi.currentValue ?? 0}
              target={kpi.targetValue ?? 0}
              baseline={kpi.baselineValue ?? 0}
              unit={kpi.unit ?? ""}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

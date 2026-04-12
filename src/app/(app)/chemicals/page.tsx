import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { chemicals } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Flask, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export default async function ChemicalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { orgId } = await requireOrg();
  const { q } = await searchParams;

  const query = db
    .select()
    .from(chemicals)
    .where(eq(chemicals.orgId, orgId))
    .orderBy(desc(chemicals.createdAt))
    .limit(100);

  const docs = q
    ? await db
        .select()
        .from(chemicals)
        .where(
          sql`${chemicals.orgId} = ${orgId} AND (${chemicals.name} ILIKE ${`%${q}%`} OR ${chemicals.casNumber} ILIKE ${`%${q}%`})`
        )
        .orderBy(desc(chemicals.createdAt))
        .limit(100)
    : await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Hóa chất</h1>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <MagnifyingGlass
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên hoặc CAS..."
          className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-ring"
        />
      </form>

      {docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Flask size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {q
              ? `Không tìm thấy hóa chất phù hợp với "${q}"`
              : "Cơ sở dữ liệu hóa chất sẽ được điền tự động từ tài liệu SDS."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Tên hóa chất</th>
                <th className="text-left px-4 py-3 font-medium">CAS</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Công thức</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">MW</th>
              </tr>
            </thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {docs.map((chem: any) => (
                <tr
                  key={chem.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{chem.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {chem.casNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {chem.formula ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {chem.molecularWeight ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

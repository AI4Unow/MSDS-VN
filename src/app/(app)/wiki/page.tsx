import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";
import { BookOpen } from "@phosphor-icons/react/dist/ssr";

export default async function WikiPage() {
  await requireOrg();

  const pages = await db
    .select()
    .from(wikiPages)
    .orderBy(wikiPages.category, wikiPages.title)
    .limit(100);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const grouped = pages.reduce(
    (acc: Record<string, any[]>, page: any) => {
      const cat = page.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(page);
      return acc;
    },
    {} as Record<string, typeof pages>
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const categoryLabels: Record<string, string> = {
    regulation: "Quy định pháp luật",
    chemical: "Hóa chất",
    guide: "Hướng dẫn",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Wiki quy định</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BookOpen size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Wiki sẽ được khởi tạo với nội dung từ Circular 01/2026/TT-BCT.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {categoryLabels[category] ?? category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(items as any[]).map((page: any) => (
                <a
                  key={page.id}
                  href={`/wiki/${page.slug}`}
                  className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <h3 className="text-sm font-medium">{page.title}</h3>
                  {page.tags && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {page.tags}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

import { requireOrg } from "@/lib/auth/require-org";
import { listWikiPages, readWikiPage } from "@/lib/wiki/blob-store";
import { parseWikiPage } from "@/lib/wiki/frontmatter-parser";
import { BookOpen } from "@phosphor-icons/react/dist/ssr";

const HIDDEN_PREFIXES = ["index", "log/", "openkb/"];

export default async function WikiPage() {
  await requireOrg();

  const allSlugs = await listWikiPages();
  const contentSlugs = allSlugs.filter(
    (s) => !HIDDEN_PREFIXES.some((p) => s.startsWith(p) || s === p),
  );

  // Batch reads to avoid unbounded fan-out on Blob API (P1-4 fix)
  const BATCH_SIZE = 20;
  const allPages: Array<{ slug: string; title: string; category: string; oneLiner: string | null; crossRefs: string[]; citedBy: Array<{ page: string; count: number }>; content: string; frontmatter: Record<string, unknown> } | null> = [];
  const limitedSlugs = contentSlugs.slice(0, 200);
  for (let i = 0; i < limitedSlugs.length; i += BATCH_SIZE) {
    const batch = limitedSlugs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (slug) => {
        const raw = await readWikiPage(slug);
        if (!raw) return null;
        const parsed = parseWikiPage(raw);
        return { slug, ...parsed };
      }),
    );
    allPages.push(...batchResults);
  }

  const validPages = allPages.filter(Boolean) as NonNullable<
    (typeof allPages)[number]
  >[];


  const grouped = validPages.reduce(
    (acc, page) => {
      const cat = page.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(page);
      return acc;
    },
    {} as Record<string, typeof validPages>,
  );

  const categoryLabels: Record<string, string> = {
    regulation: "Quy định pháp luật",
    chemical: "Hóa chất",
    guide: "Hướng dẫn",
    concept: "Chủ đề",
    template: "Mẫu biểu",
    hazard: "Nguy hiểm",
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
              {items.map((page) => (
                <a
                  key={page.slug}
                  href={`/wiki/${page.slug}`}
                  className="rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <h3 className="text-sm font-medium">{page.title}</h3>
                  {page.oneLiner && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {page.oneLiner}
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
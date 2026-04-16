import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BookOpen, CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { requireOrg } from "@/lib/auth/require-org";
import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";

function formatCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    regulation: "Quy dinh phap luat",
    regulations: "Quy dinh phap luat",
    chemical: "Hoa chat",
    chemicals: "Hoa chat",
    guide: "Huong dan",
    guides: "Huong dan",
    hazards: "Nguy hai",
    topics: "Chu de",
    templates: "Bieu mau",
    countries: "Quoc gia",
    meta: "He thong",
  };

  return labels[category] ?? category;
}

function splitMarkdownBlocks(contentMd: string) {
  return contentMd
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default async function WikiDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  await requireOrg();

  const { slug } = await params;
  const slugPath = slug.join("/");

  const [page] = await db
    .select({
      slug: wikiPages.slug,
      title: wikiPages.title,
      category: wikiPages.category,
      oneLiner: wikiPages.oneLiner,
      contentMd: wikiPages.contentMd,
      updatedAt: wikiPages.updatedAt,
    })
    .from(wikiPages)
    .where(eq(wikiPages.slug, slugPath))
    .limit(1);

  if (!page) {
    notFound();
  }

  const blocks = splitMarkdownBlocks(page.contentMd);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CaretLeft size={16} />
          Quay lại wiki
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <BookOpen size={14} />
            {formatCategoryLabel(page.category)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
          {page.oneLiner && (
            <p className="text-sm text-muted-foreground">{page.oneLiner}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Cập nhật: {page.updatedAt.toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      <article className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Trang wiki này chưa có nội dung.
          </p>
        ) : (
          blocks.map((block, index) => (
            <section
              key={`${page.slug}-${index}`}
              className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground"
            >
              {block}
            </section>
          ))
        )}
      </article>
    </div>
  );
}

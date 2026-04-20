import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { requireOrg } from "@/lib/auth/require-org";
import { readWikiPage } from "@/lib/wiki/blob-store";
import { parseWikiPage } from "@/lib/wiki/frontmatter-parser";
import { MarkdownContent } from "@/components/markdown/markdown-content";

const SLUG_RE = /^[a-z0-9][a-z0-9/-]*[a-z0-9]$/;

function formatCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    regulation: "Quy dinh phap luat",
    regulations: "Quy dinh phap luat",
    chemical: "Hoa chat",
    chemicals: "Hoa chat",
    guide: "Huong dan",
    guides: "Huong dan",
    hazards: "Nguy hai",
    hazard: "Nguy hai",
    concept: "Chu de",
    concepts: "Chu de",
    templates: "Bieu mau",
    template: "Bieu mau",
    countries: "Quoc gia",
    meta: "He thong",
  };

  return labels[category] ?? category;
}

export default async function WikiDetailPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  await requireOrg();

  const { slug } = await params;
  const slugPath = slug.join("/");

  // Validate slug to prevent path traversal (C1 fix)
  if (!SLUG_RE.test(slugPath) || slugPath.length > 200 || slugPath.includes("..")) {
    notFound();
  }

  const raw = await readWikiPage(slugPath);
  if (!raw) {
    notFound();
  }

  const parsed = parseWikiPage(raw);
  const updatedAt = (parsed.frontmatter.updated_at as string)
    ? new Date(parsed.frontmatter.updated_at as string)
    : new Date();

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
            {formatCategoryLabel(parsed.category)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{parsed.title}</h1>
          {parsed.oneLiner && (
            <p className="text-sm text-muted-foreground">{parsed.oneLiner}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Cập nhật: {updatedAt.toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      <article className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        {parsed.content.trim().length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Trang wiki này chưa có nội dung.
          </p>
        ) : (
          <MarkdownContent content={parsed.content} />
        )}
      </article>
    </div>
  );
}
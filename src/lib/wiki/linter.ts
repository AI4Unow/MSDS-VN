import { listWikiPages, readWikiPage } from "./blob-store";
import { parseWikiPage } from "./frontmatter-parser";

export interface LintFinding {
  type: "orphan" | "dangling_xref" | "stale" | "contradiction";
  page: string;
  message: string;
}

export async function lintWiki(): Promise<LintFinding[]> {
  const findings: LintFinding[] = [];
  const allSlugs = await listWikiPages();
  const contentSlugs = allSlugs.filter(
    (s) =>
      !s.startsWith("index/") &&
      s !== "index" &&
      s !== "log" &&
      !s.startsWith("log/"),
  );

  const allSlugSet = new Set(contentSlugs);
  const BATCH_SIZE = 20;
  const pages: Array<{ slug: string; title: string; category: string; oneLiner: string | null; crossRefs: string[]; citedBy: Array<{ page: string; count: number }>; content: string; frontmatter: Record<string, unknown> } | null> = [];
  for (let i = 0; i < contentSlugs.length; i += BATCH_SIZE) {
    const batch = contentSlugs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (slug) => {
        const raw = await readWikiPage(slug);
        return raw ? { slug, ...parseWikiPage(raw) } : null;
      }),
    );
    pages.push(...batchResults);
  }

  const validPages = pages.filter(
    Boolean,
  ) as NonNullable<(typeof pages)[number]>[];

  // Check for dangling cross-references
  for (const page of validPages) {
    for (const ref of page.crossRefs) {
      if (!allSlugSet.has(ref)) {
        findings.push({
          type: "dangling_xref",
          page: page.slug,
          message: `Cross-reference to non-existent page: ${ref}`,
        });
      }
    }
  }

  // Check for orphans (pages not referenced by any other page)
  const referenced = new Set<string>();
  for (const page of validPages) {
    for (const ref of page.crossRefs) referenced.add(ref);
    for (const cite of page.citedBy) referenced.add(cite.page);
  }

  for (const page of validPages) {
    if (!referenced.has(page.slug)) {
      findings.push({
        type: "orphan",
        page: page.slug,
        message: "Page has no inbound references",
      });
    }
  }

  return findings;
}
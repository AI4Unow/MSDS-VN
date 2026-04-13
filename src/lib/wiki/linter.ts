/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db/client";
import { wikiPages } from "@/lib/db/schema";

export interface LintFinding {
  type: "orphan" | "dangling_xref" | "stale" | "contradiction";
  page: string;
  message: string;
}

export async function lintWiki() {
  const findings: LintFinding[] = [];
  const pages = await db.select().from(wikiPages);

  // Check for orphans (no inbound citations)
  // Only run if at least one page has non-empty citedBy — otherwise every page
  // is an orphan and the check produces only noise
  const anyCitations = pages.some(p => p.citedBy && p.citedBy.length > 0);
  const allSlugs = new Set(pages.map(p => p.slug));
  if (anyCitations) {
    for (const page of pages) {
      if (page.slug === "index" || page.slug === "log" || page.slug === "schema") continue;

      const citedByCount = page.citedBy?.length || 0;
      if (citedByCount === 0) {
        findings.push({
          type: "orphan",
          page: page.slug,
          message: "Page has no inbound citations",
        });
      }
    }
  }

  // Check for dangling cross-references
  for (const page of pages) {
    const crossRefs = (page.frontmatter as any)?.cross_refs || [];
    for (const ref of crossRefs) {
      if (!allSlugs.has(ref)) {
        findings.push({
          type: "dangling_xref",
          page: page.slug,
          message: `Cross-reference to non-existent page: ${ref}`,
        });
      }
    }
  }

  return findings;
}

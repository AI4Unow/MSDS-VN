import { writeWikiPage, readWikiPage } from "./blob-store";
import { parseWikiPage } from "./frontmatter-parser";

/**
 * Upsert a wiki page. Merges with existing frontmatter to preserve incremental fields.
 *
 * Concurrency note: If two Inngest handlers for the same CAS run concurrently
 * (e.g., separate SDS uploads for the same chemical), both will read-merge-write
 * and last-writer-wins. This is acceptable at MVP scale because:
 * 1. Chemical page content is deterministic (regenerated from SDS extraction data)
 * 2. Inngest `step.run` serializes steps within a single function attempt
 * 3. Cross-extraction races are rare and converge on re-ingest
 * If strict single-writer is needed, serialize via a per-CAS Inngest mutex or
 * move canonical state to Postgres with CAS/optimistic concurrency.
 */
export async function upsertWikiPage(params: {
  slug: string;
  category: string;
  title: string;
  oneLiner?: string | null;
  frontmatter: Record<string, unknown>;
  contentMd: string;
  sourceUrls?: string[];
}) {
  const { slug, category, title, oneLiner, frontmatter, contentMd, sourceUrls } =
    params;

  // Merge with existing frontmatter to preserve incremental fields (P1-2 fix)
  const existingRaw = await readWikiPage(slug);
  const existingFm = existingRaw
    ? parseWikiPage(existingRaw).frontmatter
    : {};

  const merged = {
    ...existingFm,
    ...frontmatter,
    category,
    title,
    one_liner: oneLiner || existingFm.one_liner || undefined,
    source_urls: sourceUrls || (existingFm.source_urls as string[]) || [],
    // Preserve created timestamp from existing page
    created: (existingFm.created as string) || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const fm = JSON.stringify(merged, null, 2);
  const fullPage = `---\n${fm}\n---\n\n${contentMd}`;
  await writeWikiPage(slug, fullPage);
}

export async function triggerWikiIngest(sdsId: string, casNumber: string) {
  const { rebuildHierarchicalIndex } = await import(
    "./hierarchical-index-builder"
  );
  await rebuildHierarchicalIndex();

  const { appendLogEntry, LOG_PREFIXES } = await import("./log-writer");
  await appendLogEntry(LOG_PREFIXES.INGEST, {
    sds: sdsId,
    cas: casNumber,
    pages_touched: 1,
  });
}
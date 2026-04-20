import { listWikiPages, readWikiPage, writeWikiPage } from "./blob-store";
import { parseWikiPage } from "./frontmatter-parser";

const SUB_INDEX_MAX_CHARS = 12000;

const CATEGORY_LABELS: Record<string, string> = {
  chemical: "Hóa chất (Chemicals)",
  regulation: "Quy định (Regulations)",
  concept: "Chủ đề (Concepts)",
  guide: "Hướng dẫn (Guides)",
  template: "Mẫu biểu (Templates)",
  hazard: "Nguy hiểm (Hazards)",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function rebuildHierarchicalIndex(): Promise<{
  rootSize: number;
  subIndexes: Record<string, number>;
  totalPages: number;
}> {
  const allSlugs = await listWikiPages();
  const contentSlugs = allSlugs.filter(
    (s) => !s.startsWith("index/") && s !== "index" && s !== "log" && !s.startsWith("log/"),
  );

  // Batch reads to avoid unbounded fan-out on Blob API (H2 fix)
  const BATCH_SIZE = 20;
  const pages: Array<{ slug: string; title: string; category: string; oneLiner: string | null; crossRefs: string[]; citedBy: Array<{ page: string; count: number }>; content: string; frontmatter: Record<string, unknown> } | null> = [];
  for (let i = 0; i < contentSlugs.length; i += BATCH_SIZE) {
    const batch = contentSlugs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (slug) => {
        const raw = await readWikiPage(slug);
        if (!raw) return null;
        const parsed = parseWikiPage(raw);
        return { slug, ...parsed };
      }),
    );
    pages.push(...batchResults);
  }

  const validPages = pages.filter(
    Boolean,
  ) as NonNullable<(typeof pages)[number]>[];

  const grouped = validPages.reduce(
    (acc, page) => {
      const cat = page.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(page);
      return acc;
    },
    {} as Record<string, typeof validPages>,
  );

  const subIndexSizes: Record<string, number> = {};

  for (const [category, categoryPages] of Object.entries(grouped)) {
    categoryPages.sort((a, b) => a.title.localeCompare(b.title));

    let subIndexMd = `# ${capitalize(category)} Index\n\n`;
    subIndexMd += `${categoryPages.length} pages in this category.\n\n`;

    for (const page of categoryPages) {
      const oneLiner = page.oneLiner ? ` — ${page.oneLiner}` : "";
      subIndexMd += `- [${page.title}](${page.slug})${oneLiner}\n`;
    }

    if (subIndexMd.length > SUB_INDEX_MAX_CHARS) {
      await writeSplitSubIndexes(category, categoryPages);
    } else {
      await writeWikiPage(`index/${category}`, subIndexMd);
    }

    subIndexSizes[category] = subIndexMd.length;
  }

  let rootMd = "# Wiki Index\n\n";
  for (const [category, categoryPages] of Object.entries(grouped)) {
    const label = CATEGORY_LABELS[category] || capitalize(category);
    rootMd += `- [${label}](index/${category}) — ${categoryPages.length} pages\n`;
  }

  await writeWikiPage("index", rootMd);

  return {
    rootSize: rootMd.length,
    subIndexes: subIndexSizes,
    totalPages: validPages.length,
  };
}

async function writeSplitSubIndexes(
  category: string,
  pages: Array<{ slug: string; title: string; oneLiner: string | null }>,
) {
  const chunks: typeof pages[] = [[]];
  let currentSize = 0;

  for (const page of pages) {
    const line = `- [${page.title}](${page.slug})${page.oneLiner ? ` — ${page.oneLiner}` : ""}\n`;
    if (currentSize + line.length > SUB_INDEX_MAX_CHARS - 200) {
      chunks.push([]);
      currentSize = 0;
    }
    chunks[chunks.length - 1].push(page);
    currentSize += line.length;
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const firstLetter = chunk[0]?.title[0]?.toUpperCase() || "?";
    const lastLetter =
      chunk[chunk.length - 1]?.title[0]?.toUpperCase() || "?";
    const suffix = `${firstLetter.toLowerCase()}-${lastLetter.toLowerCase()}`;

    let md = `# ${capitalize(category)} Index (${firstLetter}–${lastLetter})\n\n`;
    for (const page of chunk) {
      const oneLiner = page.oneLiner ? ` — ${page.oneLiner}` : "";
      md += `- [${page.title}](${page.slug})${oneLiner}\n`;
    }
    await writeWikiPage(`index/${category}-${suffix}`, md);
  }

  let parentMd = `# ${capitalize(category)} Index\n\n`;
  parentMd += `${pages.length} pages, split into ranges:\n\n`;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const first = chunk[0]?.title[0]?.toUpperCase() || "?";
    const last = chunk[chunk.length - 1]?.title[0]?.toUpperCase() || "?";
    const suffix = `${first.toLowerCase()}-${last.toLowerCase()}`;
    parentMd += `- [${first}–${last}](index/${category}-${suffix}) — ${chunk.length} pages\n`;
  }
  await writeWikiPage(`index/${category}`, parentMd);
}
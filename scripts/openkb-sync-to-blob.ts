// Run: npx tsx scripts/openkb-sync-to-blob.ts [openkb-dir]
// Reads OpenKB wiki/ output and uploads each .md file to Vercel Blob.
// Enforces deterministic slug normalization, frontmatter rewriting, and provenance tracking.
import { config } from "dotenv";
import { join, dirname, basename, relative } from "path";
import { readdir, readFile } from "fs/promises";

const __dirname = dirname(new URL(import.meta.url).pathname);
config({ path: join(__dirname, "../.env.local") });

import { writeWikiPage } from "../src/lib/wiki/blob-store";
import { rebuildHierarchicalIndex } from "../src/lib/wiki/hierarchical-index-builder";

const OPENKB_DIR = process.argv[2] || "./openkb-regulations/wiki";

// --- Configuration ---

const NAMESPACE_MAP: Record<string, string> = {
  "summaries/": "regulation/",
  "concepts/": "concept/",
  "guides/": "guide/",
};

const SKIP_PATTERNS = [
  /^AGENTS\.md$/,
  /^log\.md$/,
  /^index\.md$/,
  /^sources\//,
  /^\.openkb\//,
  /^_/,
];

const PROVENANCE_MAP: Record<string, string[]> = {
  "luat-69-2025-qh15": ["Luật-69-2025-QH15.docx"],
  "nghi-dinh-26-2026-nd-cp": ["Nghị-định-26-2026-NĐ-CP.docx"],
  "thong-tu-01-2026-tt-bct": ["Thông-tư-01-2026-TT-BCT.docx"],
};

// --- Slug Normalization ---

function normalizeSlug(rawSlug: string): string {
  let slug = rawSlug
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "");

  slug = slug
    .split("/")
    .map((seg) => seg.replace(/(^-|-$)/g, ""))
    .filter((seg) => seg.length > 0)
    .join("/");

  if (slug.length > 200) {
    const hash = slug.slice(-8);
    slug = slug.slice(0, 191) + "-" + hash;
  }

  return slug;
}

function mapNamespace(relPath: string): string {
  const slug = relPath.replace(/\.md$/, "");
  for (const [from, to] of Object.entries(NAMESPACE_MAP)) {
    if (slug.startsWith(from)) {
      return slug.replace(from, to);
    }
  }
  return `openkb/${slug}`;
}

// --- Frontmatter Parsing & Rewriting ---

interface OpenKBFrontmatter {
  [key: string]: unknown;
}

function parseFrontmatter(raw: string): {
  frontmatter: OpenKBFrontmatter;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const fmText = match[1].trim();
  const body = match[2].trim();

  try {
    return { frontmatter: JSON.parse(fmText), body };
  } catch {
    const fm: OpenKBFrontmatter = {};
    for (const line of fmText.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let val: unknown = line.slice(colonIdx + 1).trim();
      if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
        try {
          val = JSON.parse(val);
        } catch {
          /* keep as string */
        }
      }
      fm[key] = val;
    }
    return { frontmatter: fm, body };
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "\u2026";
}

function extractTitleFromSlug(slug: string): string {
  const lastSegment = slug.split("/").pop() || slug;
  return lastSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function rewriteFrontmatter(
  openkbFm: OpenKBFrontmatter,
  slug: string,
  relPath: string,
  syncTimestamp: string,
): string {
  const category = slug.split("/")[0];

  const sourceDocuments: string[] = [];
  for (const [key, docs] of Object.entries(PROVENANCE_MAP)) {
    if (slug.includes(key)) {
      sourceDocuments.push(...docs);
    }
    const refs = openkbFm.references;
    if (Array.isArray(refs) && refs.some((r: string) => r.includes(key))) {
      sourceDocuments.push(...docs);
    }
  }

  const oneLiner = truncate(
    (openkbFm.one_liner as string) ||
      (openkbFm.summary as string) ||
      (openkbFm.description as string) ||
      "",
    120,
  );

  const crossRefs: string[] = [];
  if (Array.isArray(openkbFm.tags)) crossRefs.push(...(openkbFm.tags as string[]));
  if (Array.isArray(openkbFm.references))
    crossRefs.push(...(openkbFm.references as string[]));
  if (Array.isArray(openkbFm.cross_refs))
    crossRefs.push(...(openkbFm.cross_refs as string[]));

  const msdsMetadata = {
    title: (openkbFm.title as string) || extractTitleFromSlug(slug),
    category,
    one_liner: oneLiner || undefined,
    cross_refs: [...new Set(crossRefs)],
    jurisdiction: (openkbFm.jurisdiction as string) || "vn",
    confidence: (openkbFm.confidence as string) || "medium",
    source_openkb: relPath,
    source_documents: [...new Set(sourceDocuments)],
    synced_at: syncTimestamp,
    updated_at: syncTimestamp,
  };

  return JSON.stringify(msdsMetadata, null, 2);
}

// --- Main Sync Logic ---

interface SyncReport {
  synced: Array<{ from: string; to: string }>;
  skipped: Array<{ path: string; reason: string }>;
  errors: Array<{ path: string; error: string }>;
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function syncAll(): Promise<SyncReport> {
  const files = await walkDir(OPENKB_DIR);
  const syncTimestamp = new Date().toISOString();
  const report: SyncReport = { synced: [], skipped: [], errors: [] };

  for (const filePath of files) {
    const relPath = relative(OPENKB_DIR, filePath);

    if (!relPath.endsWith(".md")) {
      report.skipped.push({ path: relPath, reason: "not markdown" });
      continue;
    }

    const skipMatch = SKIP_PATTERNS.find((p) => p.test(relPath));
    if (skipMatch) {
      report.skipped.push({
        path: relPath,
        reason: `matches skip pattern: ${skipMatch}`,
      });
      continue;
    }

    try {
      const raw = await readFile(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(raw);
      const mappedSlug = mapNamespace(relPath);
      const slug = normalizeSlug(mappedSlug);
      const msdsMetadata = rewriteFrontmatter(
        frontmatter,
        slug,
        relPath,
        syncTimestamp,
      );
      const finalPage = `---\n${msdsMetadata}\n---\n\n${body}`;
      await writeWikiPage(slug, finalPage);
      report.synced.push({ from: relPath, to: slug });
    } catch (err) {
      report.errors.push({ path: relPath, error: String(err) });
    }
  }

  if (report.synced.length > 0) {
    const result = await rebuildHierarchicalIndex();
    console.log(`\n\u2713 Index rebuilt: ${result.totalPages} total pages`);
    console.log(`  Root: ${result.rootSize} chars`);
    for (const [cat, size] of Object.entries(result.subIndexes)) {
      console.log(`  ${cat}: ${size} chars`);
    }
  }

  return report;
}

syncAll()
  .then((report) => {
    console.log(`\n=== Sync Report ===`);
    console.log(`Synced:  ${report.synced.length} pages`);
    for (const s of report.synced) console.log(`  \u2713 ${s.from} \u2192 ${s.to}`);
    console.log(`Skipped: ${report.skipped.length} files`);
    for (const s of report.skipped)
      console.log(`  \u2298 ${s.path} (${s.reason})`);
    if (report.errors.length > 0) {
      console.error(`Errors:  ${report.errors.length}`);
      for (const e of report.errors) console.error(`  \u2717 ${e.path}: ${e.error}`);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Fatal sync error:", err);
    process.exit(1);
  });
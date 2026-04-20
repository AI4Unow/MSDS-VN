export interface ParsedWikiPage {
  frontmatter: Record<string, unknown>;
  content: string;
  title: string;
  category: string;
  oneLiner: string | null;
  crossRefs: string[];
  citedBy: Array<{ page: string; count: number }>;
}

export function parseWikiPage(raw: string): ParsedWikiPage {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: {},
      content: raw,
      title: extractTitle(raw),
      category: "unknown",
      oneLiner: null,
      crossRefs: [],
      citedBy: [],
    };
  }

  const fmText = match[1].trim();
  const content = match[2].trim();
  let frontmatter: Record<string, unknown>;

  try {
    frontmatter = JSON.parse(fmText);
  } catch {
    frontmatter = parseSimpleKvYaml(fmText);
  }

  return {
    frontmatter,
    content,
    title: (frontmatter.title as string) || extractTitle(content),
    category: (frontmatter.category as string) || "unknown",
    oneLiner:
      (frontmatter.one_liner as string) ||
      (frontmatter.oneLiner as string) ||
      null,
    crossRefs: asStringArray(frontmatter.cross_refs) || [],
    citedBy: asCitedByArray(frontmatter.cited_by) || [],
  };
}

function extractTitle(md: string): string {
  const h1 = md.match(/^#\s+(.+)/m);
  return h1?.[1] || "Untitled";
}

// Fallback for simple key-value YAML (no nested objects/arrays).
// Complex YAML must be normalized to JSON before hitting Blob.
function parseSimpleKvYaml(text: string): Record<string, unknown> {
  const fm: Record<string, unknown> = {};
  for (const line of text.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val: unknown = line.slice(colonIdx + 1).trim();
    // Handle inline arrays: [a, b, c]
    if (
      typeof val === "string" &&
      val.startsWith("[") &&
      val.endsWith("]")
    ) {
      try {
        val = JSON.parse(val);
      } catch {
        /* keep as string */
      }
    }
    fm[key] = val;
  }
  return fm;
}

function asStringArray(v: unknown): string[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") return [v];
  return null;
}

function asCitedByArray(
  v: unknown,
): Array<{ page: string; count: number }> | null {
  if (!Array.isArray(v)) return null;
  return v
    .filter(
      (e): e is Record<string, unknown> =>
        typeof e === "object" && e !== null && "page" in e,
    )
    .map((e) => ({
      page: String(e.page),
      count: typeof e.count === "number" ? e.count : 1,
    }));
}
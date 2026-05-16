import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { sql } from "@vercel/postgres";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workdir = resolve(__dirname, "..");

config({ path: join(__dirname, "../.env.local") });

function findDocxByTokens(tokens: string[]) {
  const file = readdirSync(workdir).find((name) => {
    const lower = name.toLowerCase();
    return name.endsWith(".docx") && tokens.every((token) => lower.includes(token.toLowerCase()));
  });

  if (!file) {
    throw new Error(`Could not find DOCX file matching tokens: ${tokens.join(", ")}`);
  }

  return resolve(workdir, file);
}

function extractDocxMarkdown(docxPath: string) {
  const python = String.raw`
import re
import sys
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph


def iter_blocks(parent):
    for child in parent.element.body.iterchildren():
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            yield Paragraph(child, parent)
        elif tag == "tbl":
            yield Table(child, parent)


def clean(text):
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def is_heading_like(text):
    letters = "".join(ch for ch in text if ch.isalpha())
    if not letters or len(text) > 140:
        return False
    return letters == letters.upper()


def render_paragraph(text):
    text = clean(text)
    if not text:
        return ""
    if text.startswith("Chương "):
        return f"## {text}"
    if text.startswith("Mục "):
        return f"### {text}"
    if text.startswith("Điều "):
        return f"### {text}"
    if is_heading_like(text) and len(text.split()) <= 8:
        return f"# {text}"
    if re.match(r"^[a-zđ]\)\s+", text):
        return f"- {text}"
    return text


def render_table(table):
    rows = [[clean(cell.text) for cell in row.cells] for row in table.rows]
    if not rows:
        return ""

    width = max(len(row) for row in rows)
    rows = [row + [""] * (width - len(row)) for row in rows]

    def esc(cell):
        return cell.replace("|", "\\|").replace("\n", "<br>")

    if len(rows) == 1:
        return " | ".join(esc(cell) for cell in rows[0])

    out = []
    out.append("| " + " | ".join(esc(cell) for cell in rows[0]) + " |")
    out.append("| " + " | ".join(["---"] * width) + " |")
    for row in rows[1:]:
        out.append("| " + " | ".join(esc(cell) for cell in row) + " |")
    return "\n".join(out)


document = Document(sys.argv[1])
parts = []
for block in iter_blocks(document):
    md = render_paragraph(block.text) if isinstance(block, Paragraph) else render_table(block)
    if md:
        parts.append(md)
        parts.append("")

text = "\n".join(parts).strip()
text = re.sub(r"\n{3,}", "\n\n", text)
print(text)
`;

  return execFileSync("python3", ["-c", python, docxPath], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  }).trim();
}

function buildRegulationPage(options: {
  slug: string;
  title: string;
  oneLiner: string;
  docxTokens: string[];
  frontmatter: Record<string, unknown>;
}) {
  const docxPath = findDocxByTokens(options.docxTokens);
  const contentMd = extractDocxMarkdown(docxPath);

  if (contentMd.length < 5000) {
    throw new Error(
      `Extracted content for ${options.slug} is unexpectedly short (${contentMd.length} chars).`,
    );
  }

  return {
    slug: options.slug,
    category: "regulation",
    title: options.title,
    oneLiner: options.oneLiner,
    frontmatter: {
      ...options.frontmatter,
      sources: [`wiki/regulations/raw-sources/${basename(docxPath)}`],
      updated: new Date().toISOString().slice(0, 10),
    },
    contentMd,
  };
}

const regulations = [
  buildRegulationPage({
    slug: "regulation/vn-circular-01-2026-tt-bct",
    title: "Thông tư 01/2026/TT-BCT",
    oneLiner: "Quy tắc MOIT về mẫu SDS, phân loại và hóa chất ưu tiên",
    docxTokens: ["01-2026", "tt-bct"],
    frontmatter: {
      type: "regulation",
      slug: "vn-circular-01-2026-tt-bct",
      title: "Thông tư 01/2026/TT-BCT",
      category: "regulation",
      created: "2026-04-12",
      updated: "2026-04-12",
      cross_refs: [],
      confidence: "high",
      locale: "vi",
      jurisdiction: "vn",
      regulation_id: "Circular 01/2026/TT-BCT",
      issuing_body: "Ministry of Industry and Trade (MOIT)",
      effective_date: "2026-01-17",
      supersedes: ["Circular 32/2017/TT-BCT", "Circular 17/2022/TT-BCT"],
    },
  }),
  buildRegulationPage({
    slug: "regulation/vn-law-chemicals-2025",
    title: "Luật Hóa chất 2025",
    oneLiner: "Luật mẹ điều chỉnh hoạt động hóa chất tại Việt Nam",
    docxTokens: ["69-2025", "qh15"],
    frontmatter: {
      type: "regulation",
      slug: "vn-law-chemicals-2025",
      title: "Luật Hóa chất 2025",
      category: "regulation",
      created: "2026-04-12",
      updated: "2026-04-12",
      cross_refs: [],
      confidence: "high",
      locale: "vi",
      jurisdiction: "vn",
      regulation_id: "69/2025/QH15",
      issuing_body: "National Assembly of Vietnam",
      effective_date: "2026-01-01",
    },
  }),
  buildRegulationPage({
    slug: "regulation/vn-decree-26-2026-nd-cp",
    title: "Nghị định 26/2026/NĐ-CP",
    oneLiner: "Nghị định hướng dẫn quản lý hoạt động hóa chất và sản phẩm nguy hiểm",
    docxTokens: ["26-2026", "nđ-cp"],
    frontmatter: {
      type: "regulation",
      slug: "vn-decree-26-2026-nd-cp",
      title: "Nghị định 26/2026/NĐ-CP",
      category: "regulation",
      created: "2026-04-12",
      updated: "2026-04-12",
      cross_refs: [],
      confidence: "high",
      locale: "vi",
      jurisdiction: "vn",
      regulation_id: "26/2026/NĐ-CP",
      issuing_body: "Government of Vietnam",
      effective_date: "2026-01-17",
    },
  }),
  {
    slug: "regulation/ghs-rev-10",
    category: "regulation",
    title: "GHS Rev 10",
    oneLiner: "Bộ quy tắc hài hòa toàn cầu của UNECE",
    frontmatter: {
      type: "regulation",
      slug: "ghs-rev-10",
      title: "GHS Rev 10",
      category: "regulation",
      created: "2026-04-12",
      updated: "2026-04-12",
      sources: ["wiki/regulations/raw-sources/ghs-rev10-purple-book.pdf"],
      cross_refs: [],
      confidence: "high",
      locale: "en",
      jurisdiction: "global",
      regulation_id: "GHS Rev 10",
      issuing_body: "United Nations Economic Commission for Europe",
      effective_date: "2023-01-01",
    },
    contentMd: `# GHS Rev 10 - Hệ thống hài hòa toàn cầu

Hệ thống hài hòa toàn cầu về phân loại và ghi nhãn hóa chất.

## Tiêu chí phân loại
GHS phân loại hóa chất thành 29 lớp nguy hiểm chính:
- Cháy nổ (16 loại)
- Độc hại (10 loại)
- Ăn mòn (2 loại)
- Nguy hại khác (1 loại)

## Biểu tượng cảnh báo
9 pictogram tiêu chuẩn: 💀 ☢️ 🍃 🔥 ⚠️ 😷 🧪 ⚡ 💥

## Tài liệu nguồn
- Official text: wiki/regulations/raw-sources/ghs-rev10-purple-book.pdf
`,
  },
];

async function seedRegulations() {
  console.log("Seeding regulations...");

  for (const reg of regulations) {
    try {
      await sql`
        INSERT INTO wiki_pages (slug, category, title, one_liner, frontmatter, content_md, cited_by, version, updated_by, created_at, updated_at)
        VALUES (${reg.slug}, ${reg.category}, ${reg.title}, ${reg.oneLiner}, ${JSON.stringify(reg.frontmatter)}, ${reg.contentMd}, ${JSON.stringify([])}, 1, 'human:seed-script', now(), now())
        ON CONFLICT (slug) DO UPDATE SET
          content_md = ${reg.contentMd},
          frontmatter = ${JSON.stringify(reg.frontmatter)},
          updated_at = now()
      `;
      console.log(`✓ Seeded ${reg.slug}`);
    } catch (error) {
      console.error(`Error seeding ${reg.slug}:`, error);
    }
  }

  console.log("Regulations seeded successfully");
  process.exit(0);
}

seedRegulations().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

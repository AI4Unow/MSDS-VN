import { config } from "dotenv";
import { join, dirname } from "path";
import { sql } from "@vercel/postgres";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly
config({ path: join(__dirname, "../.env.local") });

const regulations = [
  {
    slug: "regulation/vn-circular-01-2026-tt-bct",
    category: "regulation",
    title: "Thông tư 01/2026/TT-BCT",
    oneLiner: "MOIT implementing rules for SDS template, classification, and priority chemicals",
    frontmatter: {
      type: "regulation",
      slug: "vn-circular-01-2026-tt-bct",
      title: "Thông tư 01/2026/TT-BCT",
      category: "regulation",
      created: "2026-04-12",
      updated: "2026-04-12",
      sources: ["wiki/regulations/raw-sources/Thông-tư-01-2026-TT-BCT.docx"],
      cross_refs: [],
      confidence: "high",
      locale: "vi",
      jurisdiction: "vn",
      regulation_id: "Circular 01/2026/TT-BCT",
      issuing_body: "Ministry of Industry and Trade (MOIT)",
      effective_date: "2026-01-17",
      supersedes: ["Circular 32/2017/TT-BCT", "Circular 17/2022/TT-BCT"],
    },
    contentMd: `# Thông tư 01/2026/TT-BCT

Quy định về an toàn hóa chất và Safety Data Sheet (SDS).

## Scope
Áp dụng cho các tổ chức, cá nhân sản xuất, nhập khẩu, kinh doanh, lưu thông, sử dụng hóa chất tại Việt Nam.

## Key Obligations
- Lập SDS cho hóa chất nguy hiểm theo Phụ lục I
- SDS phải bằng tiếng Việt hoặc song ngữ Việt-Anh
- Cập nhật SDS trong vòng 90 ngày khi có thay đổi

## How it applies to SDS management
Mẫu SDS bao gồm 16 mục theo chuẩn GHS. Phụ lục I định nghĩa cấu trúc chi tiết.

## Sources
- Official text: wiki/regulations/raw-sources/Thông-tư-01-2026-TT-BCT.docx

## Cross-references
- [[regulation/ghs-rev-10]] for GHS classification
`,
  },
  {
    slug: "regulation/vn-law-chemicals-2025",
    category: "regulation",
    title: "Luật Hóa chất 2025",
    oneLiner: "Parent law governing chemical management in Vietnam",
    frontmatter: {
      type: "regulation",
      slug: "vn-law-chemicals-2025",
      title: "Luật Hóa chất 2025",
      category: "regulation",
      created: "2026-04-12",
      updated: "2026-04-12",
      sources: ["wiki/regulations/raw-sources/Luật-Hóa-chất-2025.pdf"],
      cross_refs: [],
      confidence: "high",
      locale: "vi",
      jurisdiction: "vn",
      regulation_id: "69/2025/QH15",
      issuing_body: "National Assembly of Vietnam",
      effective_date: "2026-01-01",
    },
    contentMd: `# Luật Hóa chất 2025 (69/2025/QH15)

Luật quản lý hóa chất tại Việt Nam.

## Scope
Quản lý toàn bộ hoạt động liên quan đến hóa chất tại Việt Nam.

## Key Obligations
- Đăng ký hóa chất nguy hiểm
- Lập và cung cấp SDS
- Báo cáo thống kê định kỳ
- Đào tạo nhân viên an toàn hóa chất

## Sources
- Official text: wiki/regulations/raw-sources/Luật-Hóa-chất-2025.pdf

## Cross-references
- [[regulation/vn-decree-26-2026-nd-cp]] for implementation details
`,
  },
  {
    slug: "regulation/ghs-rev-10",
    category: "regulation",
    title: "GHS Rev 10",
    oneLiner: "UN ECE Purple Book - globally harmonized classification system",
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
    contentMd: `# GHS Rev 10 - Globally Harmonized System

Hệ thống hài hòa toàn cầu về phân loại và ghi nhãn hóa chất.

## Classification Criteria
GHS phân loại hóa chất thành 29 lớp nguy hiểm chính:
- Cháy nổ (16 loại)
- Độc hại (10 loại)
- Ăn mòn (2 loại)
- Nguy hại khác (1 loại)

## Pictograms
9 pictogram tiêu chuẩn: 💀 ☢️ 🍃 🔥 ⚠️ 😷 🧪 ⚡ 💥

## Sources
- Official text: wiki/regulations/raw-sources/ghs-rev10-purple-book.pdf
`,
  },
];

async function seedRegulations() {
  console.log("Seeding regulations...");
  
  for (const reg of regulations) {
    try {
      // Skip source_urls for now to avoid array handling issues
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

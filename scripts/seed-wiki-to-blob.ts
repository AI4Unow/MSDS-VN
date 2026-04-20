// Run: npx tsx scripts/seed-wiki-to-blob.ts
// One-time migration: writes fallback wiki data to Vercel Blob, then rebuilds indexes.
// NOTE: The fallback data was originally in src/lib/chat/wiki-fallback-data.ts (now deleted).
// It is inlined here for the migration script only.
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

import { writeWikiPage } from "../src/lib/wiki/blob-store";

type FallbackPage = { title: string; category: string; contentMd: string };

const FALLBACK_PAGES: Record<string, FallbackPage> = {
  "regulation/vn-circular-01-2026-tt-bct": {
    title: "Thông tư 01/2026/TT-BCT",
    category: "regulation",
    contentMd: `# Thông tư 01/2026/TT-BCT

Quy định về an toàn hóa chất và Safety Data Sheet (SDS).

## Nội dung chính

### Phạm vi áp dụng
- Áp dụng cho các tổ chức, cá nhân sản xuất, nhập khẩu, kinh doanh, lưu thông, sử dụng hóa chất tại Việt Nam
- Bắt buộc lập SDS cho hóa chất nguy hiểm theo Phụ lục I

### Yêu cầu SDS
- SDS phải được lập bằng tiếng Việt hoặc song ngữ Việt-Anh
- Phải cập nhật khi có thay đổi về thành phần, tính chất nguy hiểm, hoặc quy định pháp luật
- Thời hạn cập nhật: trong vòng 90 ngày kể từ khi có thay đổi

### Phụ lục I - Mẫu SDS
Mẫu SDS bao gồm 16 mục theo chuẩn GHS:
1. Sản phẩm và công ty
2. Nhận biết nguy hiểm
3. Thành phần/thông tin thành phần
4. Biện pháp sơ cứu
5. Biện pháp chữa cháy
6. Biện pháp rò rỉ vô tình
7. Xử lý và lưu trữ
8. Kiểm soát phơi nhiễm/bảo vệ cá nhân
9. Tính chất vật lý và hóa học
10. Ổn định và phản ứng
11. Thông tin độc học
12. Thông tin sinh thái
13. Cân nhắc xử lý thải
14. Thông tin vận chuyển
15. Thông tin quy định
16. Thông tin khác

### Quy trình công bố
1. Lập SDS theo mẫu Phụ lục I
2. Đánh giá và ký duyệt bởi chuyên gia an toàn hóa chất
3. Lưu trữ bản mềm và bản cứng
4. Cung cấp cho người sử dụng hóa chất
5. Cập nhật định kỳ và khi có thay đổi`,
  },
  "regulation/vn-law-chemicals-2025": {
    title: "Luật Hóa chất 2025 (69/2025/QH15)",
    category: "regulation",
    contentMd: `# Luật Hóa chất 2025 (69/2025/QH15)

Luật quản lý hóa chất tại Việt Nam, được Quốc hội thông qua ngày 15/01/2025.

## Nội dung chính

### Phân loại hóa chất
- **Hóa chất nguy hiểm**: Hóa chất có tính độc hại, ăn mòn, cháy nổ, hoặc gây hại khác
- **Hóa chất thông thường**: Hóa chất không thuộc danh sách hóa chất nguy hiểm
- **Hóa chất bị hạn chế**: Hóa chất có nguy cơ cao, cần kiểm soát đặc biệt

### Nghĩa vụ của doanh nghiệp
- Đăng ký hóa chất nguy hiểm với cơ quan quản lý
- Lập và cung cấp SDS cho hóa chất nguy hiểm
- Báo cáo thống kê hóa chất định kỳ
- Đào tạo nhân viên về an toàn hóa chất
- Lưu trữ hồ sơ an toàn hóa chất tối thiểu 5 năm

### Chế tài xử phạt
- Phạt tiền từ 10-200 triệu đồng cho vi phạm quy định SDS
- Phạt tiền từ 50-500 triệu đồng cho vi phạm đăng ký hóa chất
- Tước giấy phép hoạt động trong trường hợp vi phạm nghiêm trọng`,
  },
  "regulation/vn-decree-26-2026-nd-cp": {
    title: "Nghị định 26/2026/ND-CP",
    category: "regulation",
    contentMd: `# Nghị định 26/2026/ND-CP

Quy định chi tiết thi hành Luật Hóa chất 2025.

## Nội dung chính

### Quy định về SDS
- SDS phải được lập bởi chuyên gia có chứng chỉ an toàn hóa chất
- Thẩm quyền ký duyệt: Giám đốc kỹ thuật hoặc Chuyên gia an toàn hóa chất cấp II trở lên
- Định dạng: PDF, chữ ký điện tử hoặc chữ ký ướt

### Danh mục hóa chất
- Phụ lục I: Danh mục hóa chất nguy hiểm
- Phụ lục II: Danh mục hóa chất bị hạn chế
- Phụ lục III: Danh mục hóa chất bị cấm

### Thẩm quyền quản lý
- Bộ Công Thương: Quản lý hóa chất công nghiệp
- Bộ Y tế: Quản lý hóa chất y tế
- Bộ Nông nghiệp: Quản lý hóa chất nông nghiệp`,
  },
  "chemical/ghs-rev-10": {
    title: "GHS Rev 10 - Hệ thống hài hòa toàn cầu",
    category: "chemical",
    contentMd: `# GHS Rev 10 - Globally Harmonized System

Hệ thống hài hòa toàn cầu về phân loại và ghi nhãn hóa chất (GHS Revision 10).

## Nguyên tắc cơ bản

### Phân loại nguy hiểm
GHS phân loại hóa chất thành 29 lớp nguy hiểm chính:
- Cháy nổ (16 loại)
- Độc hại (10 loại)
- Ăn mòn (2 loại)
- Nguy hại khác (1 loại)

### Biểu tượng cảnh báo
Có 9 pictogram tiêu chuẩn:
1. 💀 Độc hại cấp tính
2. ☢️ Phóng xạ
3. 🍃 Nguy hại môi trường
4. 🔥 Cháy nổ
5. ⚠️ Cảnh báo chung
6. 😷 Nguy hại sức khỏe
7. 🧪 Ăn mòn
8. ⚡ Nguy hại oxy hóa
9. 💥 Cháy tự phát

### Câu tín hiệu
- **Danger (Nguy hiểm)**: Nguy hiểm cấp cao
- **Warning (Cảnh báo)**: Nguy hiểm cấp thấp hơn

### Câu cảnh báo
Mã định dạng: Hxxx (ví dụ: H225 - Rất dễ cháy)`,
  },
  "chemical/hazard-classification": {
    title: "Phân loại nguy hiểm hóa chất",
    category: "chemical",
    contentMd: `# Phân loại nguy hiểm hóa chất theo GHS

## Quy trình phân loại

### Bước 1: Thu thập dữ liệu
- Tính chất vật lý (điểm cháy, điểm sôi)
- Tính chất hóa học (ổn định, phản ứng)
- Độc tính (LD50, LC50)
- Dữ liệu sinh thái

### Bước 2: So sánh với tiêu chuẩn
Sử dụng các tiêu chí phân loại GHS Rev 10 để xác định:
- Lớp nguy hiểm (hazard class)
- Thể loại (category)
- Câu cảnh báo (hazard statement)

### Bước 3: Xác định pictogram
Dựa trên lớp nguy hiểm để chọn pictogram phù hợp

## Ví dụ
- **H2SO4 (Axit sulfuric)**: Ăn mòn (Category 1), Pictogram ☣️
- **Benzene**: Độc hại cấp tính +致癌 (Carcinogenic), Pictogram ☠️
- **Ethanol**: Dễ cháy (Category 2), Pictogram 🔥`,
  },
  "template/sds-template-vi": {
    title: "Mẫu SDS tiếng Việt",
    category: "template",
    contentMd: `# Mẫu SDS tiếng Việt theo Phụ lục I Thông tư 01/2026/TT-BCT

## Cấu trúc 16 mục

### Mục 1: Sản phẩm và công ty
- Tên hóa chất
- Tên thương mại
- Công ty sản xuất/nhập khẩu
- Địa chỉ, số điện thoại, email

### Mục 2: Nhận biết nguy hiểm
- Câu tín hiệu (Danger/Warning)
- Pictogram
- Câu cảnh báo (H-statements)
- Câu phòng ngừa (P-statements)

### Mục 3: Thành phần
- Tên hóa chất, số CAS
- Nồng độ/phần trăm
- Thành phần bí mật (nếu có)

### Mục 4-16: Các mục khác theo chuẩn GHS

## Yêu cầu định dạng
- Font: Times New Roman, size 12
- Mục in đậm, chữ cái đầu viết hoa
- Bố cục rõ ràng, dễ đọc`,
  },
  "template/safety-card-template": {
    title: "Mẫu Phiếu an toàn hóa chất",
    category: "template",
    contentMd: `# Mẫu Phiếu an toàn hóa chất

## Nội dung bắt buộc

### Thông tin hóa chất
- Tên hóa chất
- Số CAS
- Nhà sản xuất

### Biện pháp an toàn
- Trang bị bảo hộ (PPE)
- Biện pháp sơ cứu
- Biện pháp chữa cháy
- Biện pháp rò rỉ

### Thông tin liên hệ
- Người chịu trách nhiệm
- Số điện thoại khẩn cấp
- Cơ quan quản lý`,
  },
  "guide/sds-preparation-guide": {
    title: "Hướng dẫn soạn thảo SDS",
    category: "guide",
    contentMd: `# Hướng dẫn soạn thảo Safety Data Sheet

## Quy trình 7 bước

### 1. Thu thập thông tin
- MSDS từ nhà sản xuất nước ngoài
- Tài liệu kỹ thuật
- Kết quả thử nghiệm

### 2. Dịch thuật
- Dịch sang tiếng Việt
- Kiểm tra thuật ngữ chuyên ngành
- Xác minh số liệu

### 3. Đánh giá
- So sánh với quy định Việt Nam
- Bổ sung thông tin thiếu
- Loại bỏ thông tin thừa

### 4. Định dạng
- Áp dụng mẫu Phụ lục I
- Chỉnh sửa bố cục
- Thêm biểu tượng

### 5. Thẩm định
- Chuyên gia an toàn hóa chất review
- Kiểm tra tính chính xác
- Đề xuất sửa đổi

### 6. Ký duyệt
- Giám đốc kỹ thuật ký
- Đóng dấu công ty
- Lưu trữ bản chính

### 7. Cập nhật
- Theo dõi thay đổi
- Cập nhật định kỳ
- Thông báo cho người dùng`,
  },
  "guide/chemical-registration": {
    title: "Quy trình đăng ký hóa chất",
    category: "guide",
    contentMd: `# Quy trình đăng ký hóa chất

## Bước 1: Chuẩn bị hồ sơ
- Đơn đăng ký hóa chất
- SDS bản tiếng Việt
- Giấy phép kinh doanh
- Chứng nhận phù hợp (nếu có)

## Bước 2: Nộp hồ sơ
- Nộp online qua Cổng thông tin Bộ Công Thương
- Hoặc nộp trực tiếp tại Sở Công Thương

## Bước 3: Thẩm định
- Cơ quan quản lý kiểm tra hồ sơ
- Yêu cầu bổ sung (nếu cần)
- Thời gian: 15-30 ngày

## Bước 4: Cấp số đăng ký
- Cấp mã số đăng ký hóa chất
- Cấp giấy chứng nhận
- Công khai trên cổng thông tin

## Bước 5: Báo cáo định kỳ
- Báo cáo 6 tháng/lần
- Báo cáo năm
- Cập nhật khi có thay đổi`,
  },
};

function mapLegacySlug(slug: string, _page: FallbackPage): string {
  // Slugs in FALLBACK_PAGES are already namespaced (e.g., "regulation/vn-circular-01-2026-tt-bct")
  return slug;
}

async function seed() {
  console.log("Seeding wiki pages to Vercel Blob...\n");

  let count = 0;
  for (const [slug, page] of Object.entries(FALLBACK_PAGES)) {
    const mappedSlug = mapLegacySlug(slug, page);

    const fm = JSON.stringify(
      {
        title: page.title,
        category: page.category,
        updated_at: new Date().toISOString(),
      },
      null,
      2,
    );

    const fullPage = `---\n${fm}\n---\n\n${page.contentMd}`;
    await writeWikiPage(mappedSlug, fullPage);
    console.log(`  Seeded: ${mappedSlug}`);
    count++;
  }

  // Rebuild hierarchical index
  const { rebuildHierarchicalIndex } = await import(
    "../src/lib/wiki/hierarchical-index-builder"
  );
  const result = await rebuildHierarchicalIndex();
  console.log(`\nIndex rebuilt: ${result.totalPages} pages`);
  console.log(`  Root index: ${result.rootSize} chars`);
  for (const [cat, size] of Object.entries(result.subIndexes)) {
    console.log(`  ${cat}: ${size} chars`);
  }
  console.log(`\nDone. ${count} pages seeded.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
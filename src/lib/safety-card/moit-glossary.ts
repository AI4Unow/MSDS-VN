/**
 * MOIT Terminology Glossary — EN→VI locked mappings.
 * Source: Circular 01/2026/TT-BCT, Decree 42/2020/ND-CP, GHS VN official glossary.
 * This is the single source of truth for safety card translation.
 */
export const MOIT_GLOSSARY: Record<string, string> = {
  // Document types
  "Safety Data Sheet": "Phiếu an toàn hóa chất",
  SDS: "Phiếu an toàn hóa chất",
  "Material Safety Data Sheet": "Phiếu an toàn hóa chất",

  // Section names (GHS 16 sections)
  Identification: "Nhận dạng",
  "Hazard identification": "Nhận biết nguy hại",
  "Composition/information on ingredients": "Thành phần / thông tin về các thành phần",
  "First-aid measures": "Biện pháp sơ cứu",
  "Fire-fighting measures": "Biện pháp chữa cháy",
  "Accidental release measures": "Biện pháp xử lý sự cố rò rỉ",
  "Handling and storage": "Bảo quản và sử dụng",
  "Exposure controls/personal protection": "Kiểm soát phơi nhiễm / bảo vệ cá nhân",
  "Physical and chemical properties": "Đặc tính vật lý và hóa học",
  "Stability and reactivity": "Độ ổn định và phản ứng",
  "Toxicological information": "Thông tin độc tính",
  "Ecological information": "Thông tin sinh thái",
  "Disposal considerations": "Thông tin loại bỏ",
  "Transport information": "Thông tin vận chuyển",
  "Regulatory information": "Thông tin quy định",
  "Other information": "Thông tin khác",

  // PPE
  "Personal protective equipment": "Phương tiện bảo vệ cá nhân",
  "Protective gloves": "Găng tay bảo hộ",
  "Safety glasses": "Kính bảo hộ",
  "Respiratory protection": "Thiết bị bảo vệ hô hấp",
  "Protective clothing": "Quần áo bảo hộ",
  "Face shield": "Mặt nạ bảo hộ",
  "Eye protection": "Bảo vệ mắt",

  // Hazard terms
  "Signal word": "Từ cảnh báo",
  Danger: "Nguy hiểm",
  Warning: "Cảnh báo",
  Flammable: "Dễ cháy",
  Corrosive: "Ăn mòn",
  Toxic: "Độc",
  "Oxidizing": "Chất oxy hóa",
  Irritant: "Kích ứng",
  "Health hazard": "Nguy hại sức khỏe",
  "Environmental hazard": "Nguy hại môi trường",
  "Gas under pressure": "Khí nén",
  Explosive: "Chất nổ",
  "Self-reactive": "Tự phản ứng",
  "Pyrophoric": "Tự bốc cháy",
  "Organic peroxide": "Peroxide hữu cơ",
  Mutagenic: "Đột biến",
  Carcinogenic: "Ung thư",
  "Reproductive toxicity": "Độc tính sinh sản",
  "Specific target organ toxicity": "Độc tính cơ quan đích",
  Aspiration: "Hít phải",

  // Exposure terms
  Inhalation: "Hít phải",
  "Skin contact": "Tiếp xúc da",
  "Eye contact": "Tiếp xúc mắt",
  Ingestion: "Nuốt phải",
  "Acute toxicity": "Độc tính cấp",
  "Chronic toxicity": "Độc tính mãn",

  // Fire-fighting
  "Extinguishing media": "Chất dập cháy",
  "Suitable extinguishing media": "Chất dập cháy phù hợp",
  "Unsuitable extinguishing media": "Chất dập cháy không phù hợp",
  "Firefighter protection": "Bảo vệ lính cứu hỏa",

  // Spill response
  Containment: "Phòng chống",
  Cleanup: "Dọn dẹp",
  Evacuation: "Sơ tán",
  Ventilation: "Thông gió",

  // Storage
  "Store in a cool place": "Bảo quản ở nơi mát",
  "Keep away from heat": "Tránh xa nguồn nhiệt",
  "Keep container tightly closed": "Giữ container đóng kín",
  "Incompatible materials": "Các chất không tương thích",

  // General
  Manufacturer: "Nhà sản xuất",
  Supplier: "Nhà cung cấp",
  "Emergency phone": "Điện thoại khẩn cấp",
  "CAS number": "Số CAS",
  "Molecular formula": "Công thức phân tử",
  "Molecular weight": "Khối lượng phân tử",
  Density: "Tỷ trọng",
  "Boiling point": "Điểm sôi",
  "Melting point": "Điểm nóng chảy",
  "Flash point": "Điểm bắt lửa",
  "Auto-ignition temperature": "Nhiệt độ tự bốc cháy",
  "Vapor pressure": "Áp suất hơi",
  Solubility: "Độ hòa tan",
  pH: "pH",
  Appearance: "Trạng thái",
  Odor: "Mùi",
  Color: "Màu sắc",
};

/**
 * Build the glossary instruction block for the AI system prompt.
 */
export function buildGlossaryPrompt(): string {
  const entries = Object.entries(MOIT_GLOSSARY)
    .map(([en, vi]) => `- "${en}" → "${vi}"`)
    .join("\n");
  return `## MOIT Terminology Glossary (MUST use these translations)
${entries}

If a term is not in this glossary, keep the English original and add "(chưa dịch)" note.`;
}

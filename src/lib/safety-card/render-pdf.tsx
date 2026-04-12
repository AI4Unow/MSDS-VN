import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { TranslatedCard } from "./translator";

// Register Be Vietnam Pro for PDF rendering
Font.register({
  family: "BeVietnamPro",
  fonts: [
    { src: "https://fonts.gstatic.com/s/bevietnampro/v11/QdVPSTAyLFyend_IDMDvCTnmHz_Y.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/bevietnampro/v11/QdVNSTAyLFyend_IDMDvCTnmMg53fA.woff2", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "BeVietnamPro",
    fontSize: 9,
    padding: 30,
    color: "#0E1116",
  },
  header: {
    backgroundColor: "#D97706",
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 4,
  },
  section: {
    marginBottom: 8,
    border: "1px solid #E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: "#F3F4F6",
    padding: 6,
    borderBottom: "1px solid #E5E7EB",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
  },
  sectionBody: {
    padding: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: "35%",
    fontSize: 8,
    color: "#6B7280",
  },
  value: {
    width: "65%",
    fontSize: 8,
  },
  hazardBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  hazardTag: {
    backgroundColor: "#FEF3C7",
    padding: "3 6",
    borderRadius: 3,
    fontSize: 7,
    color: "#92400E",
  },
  disclaimer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 6,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
});

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function FieldRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

export function SafetyCardDocument({
  card,
  orgName,
  generatedAt,
}: {
  card: TranslatedCard;
  orgName: string;
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PHIẾU AN TOÀN HÓA CHẤT</Text>
          <Text style={styles.headerSubtitle}>
            Safety Data Sheet — MOIT Circular 01/2026/TT-BCT
          </Text>
        </View>

        {/* Section 1: Identification */}
        <SectionBlock title="1. Nhận dạng">
          <FieldRow label="Tên sản phẩm" value={card.section1.productName} />
          <FieldRow label="Nhà sản xuất" value={card.section1.manufacturer} />
          <FieldRow label="Địa chỉ" value={card.section1.address} />
          <FieldRow label="Điện thoại" value={card.section1.phone} />
          <FieldRow label="Điện thoại khẩn cấp" value={card.section1.emergencyPhone} />
        </SectionBlock>

        {/* Section 2: Hazard */}
        <SectionBlock title="2. Nhận biết nguy hại">
          <FieldRow label="Phân loại nguy hại" value={card.section2.hazardClassification} />
          <FieldRow label="Từ cảnh báo" value={card.section2.signalWord} />
          <View style={styles.row}>
            <Text style={styles.label}>Câu cảnh báo nguy hại</Text>
          </View>
          <View style={styles.hazardBox}>
            {card.section2.hazardStatements.map((s, i) => (
              <Text key={i} style={styles.hazardTag}>
                {s}
              </Text>
            ))}
          </View>
          {card.section2.pictograms.length > 0 && (
            <View style={[styles.row, { marginTop: 4 }]}>
              <Text style={styles.label}>Biểu tượng GHS</Text>
              <Text style={styles.value}>
                {card.section2.pictograms.join(", ")}
              </Text>
            </View>
          )}
        </SectionBlock>

        {/* Section 3: Composition */}
        <SectionBlock title="3. Thành phần">
          {card.section3.ingredients.map((ing, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>
                {ing.name} ({ing.casNumber})
              </Text>
              <Text style={styles.value}>{ing.percentage}</Text>
            </View>
          ))}
        </SectionBlock>

        {/* Section 4: First Aid */}
        <SectionBlock title="4. Biện pháp sơ cứu">
          <FieldRow label="Hít phải" value={card.section4.inhalation} />
          <FieldRow label="Tiếp xúc da" value={card.section4.skinContact} />
          <FieldRow label="Tiếp xúc mắt" value={card.section4.eyeContact} />
          <FieldRow label="Nuốt phải" value={card.section4.ingestion} />
          {card.section4.notesToPhysician && (
            <FieldRow label="Ghi chú y tế" value={card.section4.notesToPhysician} />
          )}
        </SectionBlock>

        {/* Section 5: Fire-fighting */}
        <SectionBlock title="5. Biện pháp chữa cháy">
          <FieldRow label="Chất dập cháy phù hợp" value={card.section5.suitableExtinguishingMedia} />
          <FieldRow label="Nguy hiểm đặc biệt" value={card.section5.specificHazards} />
          <FieldRow label="Trang bị bảo vệ" value={card.section5.protectiveEquipment} />
        </SectionBlock>

        {/* Section 6: Accidental release */}
        <SectionBlock title="6. Biện pháp xử lý sự cố rò rỉ">
          <FieldRow label="Biện pháp cá nhân" value={card.section6.personalPrecautions} />
          <FieldRow label="Biện pháp môi trường" value={card.section6.environmentalPrecautions} />
          <FieldRow label="Phòng chống" value={card.section6.containment} />
          <FieldRow label="Dọn dẹp" value={card.section6.cleanup} />
        </SectionBlock>

        {/* Section 7: Handling & Storage */}
        <SectionBlock title="7. Bảo quản và sử dụng">
          <FieldRow label="Sử dụng" value={card.section7.handling} />
          <FieldRow label="Điều kiện bảo quản" value={card.section7.storageConditions} />
          <FieldRow label="Chất không tương thích" value={card.section7.incompatibleMaterials} />
        </SectionBlock>

        {/* Section 8: PPE */}
        <SectionBlock title="8. Kiểm soát phơi nhiễm / Bảo vệ cá nhân">
          <FieldRow label="Giới hạn phơi nhiễm" value={card.section8.exposureLimits} />
          <FieldRow label="Biện pháp kỹ thuật" value={card.section8.engineeringControls} />
          <FieldRow label="Bảo vệ hô hấp" value={card.section8.ppe.respiratory} />
          <FieldRow label="Bảo vệ mắt" value={card.section8.ppe.eye} />
          <FieldRow label="Bảo vệ da" value={card.section8.ppe.skin} />
        </SectionBlock>

        {/* Footer */}
        <View style={styles.disclaimer}>
          <Text>
            Phiếu này được tạo tự động bằng AI. Người dùng phải tự xác minh trước khi sử dụng.
            SDS Platform không chịu trách nhiệm pháp lý cho việc sử dụng không đúng.
          </Text>
          <Text style={{ marginTop: 2 }}>
            This card was AI-generated. Users must verify before use. SDS Platform is not liable for misuse.
          </Text>
          <Text style={{ marginTop: 2 }}>
            Tổ chức: {orgName} | Ngày tạo: {generatedAt}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderSafetyCardPdf(
  card: TranslatedCard,
  orgName: string
): Promise<Buffer> {
  const generatedAt = new Date().toLocaleDateString("vi-VN");
  const doc = <SafetyCardDocument card={card} orgName={orgName} generatedAt={generatedAt} />;
  return renderToBuffer(doc as React.ReactElement<DocumentProps>);
}

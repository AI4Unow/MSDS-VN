import { z } from "zod";

// Confidence wrapper for any leaf field
const withConf = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ value: schema, _confidence: z.number().min(0).max(1) });

// Section 1: Identification
const section1 = z.object({
  productName: withConf(z.string()),
  supplier: z.object({
    name: withConf(z.string()),
    address: withConf(z.string()),
    phone: withConf(z.string()),
    emergencyPhone: withConf(z.string().optional()),
  }),
  productIdentifier: withConf(z.string().optional()),
});

// Section 2: Hazard identification
const section2 = z.object({
  ghsClassification: withConf(z.string().optional()),
  hazardStatements: z.array(withConf(z.string())),
  precautionaryStatements: z.array(withConf(z.string())),
  ghsPictograms: z.array(withConf(z.string())),
  signalWord: withConf(z.enum(["Danger", "Warning", "None"]).optional()),
});

// Section 3: Composition / ingredients
const section3 = z.object({
  components: z.array(
    z.object({
      name: withConf(z.string()),
      casNumber: withConf(z.string().optional()),
      concentration: withConf(z.string().optional()),
      percentageRange: withConf(z.string().optional()),
    })
  ),
});

// Section 4: First-aid measures
const section4 = z.object({
  inhalation: withConf(z.string().optional()),
  skinContact: withConf(z.string().optional()),
  eyeContact: withConf(z.string().optional()),
  ingestion: withConf(z.string().optional()),
  notesToPhysician: withConf(z.string().optional()),
});

// Section 5: Fire-fighting
const section5 = z.object({
  suitableExtinguishingMedia: withConf(z.string().optional()),
  unsuitableExtinguishingMedia: withConf(z.string().optional()),
  specificHazards: withConf(z.string().optional()),
  protectiveEquipment: withConf(z.string().optional()),
});

// Section 6: Accidental release
const section6 = z.object({
  personalPrecautions: withConf(z.string().optional()),
  environmentalPrecautions: withConf(z.string().optional()),
  cleanupMethods: withConf(z.string().optional()),
});

// Section 7: Handling and storage
const section7 = z.object({
  handling: withConf(z.string().optional()),
  storageConditions: withConf(z.string().optional()),
  incompatibleMaterials: withConf(z.string().optional()),
});

// Section 8: Exposure controls / PPE
const section8 = z.object({
  exposureLimits: z.array(
    z.object({
      component: withConf(z.string()),
      limit: withConf(z.string()),
      basis: withConf(z.string().optional()),
    })
  ),
  ppe: z.object({
    respiratory: withConf(z.string().optional()),
    hand: withConf(z.string().optional()),
    eye: withConf(z.string().optional()),
    skin: withConf(z.string().optional()),
  }),
});

// Section 9: Physical and chemical properties
const section9 = z.object({
  appearance: withConf(z.string().optional()),
  odor: withConf(z.string().optional()),
  ph: withConf(z.string().optional()),
  meltingPoint: withConf(z.string().optional()),
  boilingPoint: withConf(z.string().optional()),
  flashPoint: withConf(z.string().optional()),
  density: withConf(z.string().optional()),
  solubility: withConf(z.string().optional()),
});

// Section 10: Stability and reactivity
const section10 = z.object({
  stability: withConf(z.string().optional()),
  conditionsToAvoid: withConf(z.string().optional()),
  incompatibleMaterials: withConf(z.string().optional()),
  decompositionProducts: withConf(z.string().optional()),
});

// Section 11: Toxicological
const section11 = z.object({
  acuteToxicity: withConf(z.string().optional()),
  skinCorrosion: withConf(z.string().optional()),
  eyeDamage: withConf(z.string().optional()),
  sensitization: withConf(z.string().optional()),
  mutagenicity: withConf(z.string().optional()),
  carcinogenicity: withConf(z.string().optional()),
});

// Section 12: Ecological
const section12 = z.object({
  ecotoxicity: withConf(z.string().optional()),
  persistence: withConf(z.string().optional()),
  bioaccumulation: withConf(z.string().optional()),
  mobility: withConf(z.string().optional()),
});

// Section 13: Disposal
const section13 = z.object({
  disposalMethods: withConf(z.string().optional()),
  contaminatedPackaging: withConf(z.string().optional()),
});

// Section 14: Transport
const section14 = z.object({
  unNumber: withConf(z.string().optional()),
  properShippingName: withConf(z.string().optional()),
  hazardClass: withConf(z.string().optional()),
  packingGroup: withConf(z.string().optional()),
  environmentalHazards: withConf(z.string().optional()),
});

// Section 15: Regulatory
const section15 = z.object({
  regulations: z.array(withConf(z.string())),
});

// Section 16: Other
const section16 = z.object({
  revisionDate: withConf(z.string().optional()),
  disclaimer: withConf(z.string().optional()),
  otherInfo: withConf(z.string().optional()),
});

export const extractionSchema = z.object({
  section_1: section1,
  section_2: section2,
  section_3: section3,
  section_4: section4,
  section_5: section5,
  section_6: section6,
  section_7: section7,
  section_8: section8,
  section_9: section9,
  section_10: section10,
  section_11: section11,
  section_12: section12,
  section_13: section13,
  section_14: section14,
  section_15: section15,
  section_16: section16,
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

export const SECTION_NAMES: Record<string, string> = {
  section_1: "1. Nhận dạng sản phẩm",
  section_2: "2. Nhận dạng mối nguy",
  section_3: "3. Thành phần",
  section_4: "4. Sơ cứu",
  section_5: "5. Chữa cháy",
  section_6: "6. Xử lý sự cố",
  section_7: "7. Bảo quản",
  section_8: "8. Kiểm soát phơi nhiễm",
  section_9: "9. Tính chất lý hóa",
  section_10: "10. Ổn định và phản ứng",
  section_11: "11. Độc tính học",
  section_12: "12. Sinh thái",
  section_13: "13. Xử lý thải bỏ",
  section_14: "14. Vận chuyển",
  section_15: "15. Quy định",
  section_16: "16. Thông tin khác",
};

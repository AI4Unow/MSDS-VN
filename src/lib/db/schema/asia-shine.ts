import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const asProducts = pgTable("as_products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text("sku").unique().notNull(),
  name: text("name").notNull(),
  casNumber: text("cas_number"),
  category: text("category"),
  supplierId: text("supplier_id").references(() => asSuppliers.id),
  regulatoryStatus: text("regulatory_status"),
  pharmacopoeiaRef: text("pharmacopoeia_ref"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const asSuppliers = pgTable("as_suppliers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  country: text("country"),
  qualityScore: real("quality_score").default(100),
  totalCoasReceived: integer("total_coas_received").default(0),
  flaggedCoas: integer("flagged_coas").default(0),
  lastCoaDate: timestamp("last_coa_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const asCoas = pgTable("as_coas", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").references(() => asProducts.id),
  supplierId: text("supplier_id").references(() => asSuppliers.id),
  batchNumber: text("batch_number"),
  manufacturingDate: timestamp("manufacturing_date"),
  expiryDate: timestamp("expiry_date"),
  documentUrl: text("document_url").notNull(),
  emailMessageId: text("email_message_id"),
  receivedDate: timestamp("received_date"),
  parsedData: jsonb("parsed_data"),
  deviations: jsonb("deviations").$type<
    Array<{
      parameter: string;
      actualValue: number;
      specification: string;
      specMin: number | null;
      specMax: number | null;
      unit: string;
      severity: "critical" | "high" | "medium" | "low";
      message: string;
    }>
  >(),
  hasDeviations: boolean("has_deviations").default(false),
  approvalStatus: text("approval_status").$type<
    "pending" | "approved" | "rejected" | "auto_approved"
  >()
    .default("pending")
    .notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  parserConfidence: real("parser_confidence"),
  processingStatus: text("processing_status").$type<
    "queued" | "parsing" | "parsed" | "failed"
  >()
    .default("queued")
    .notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const asRegulatoryStandards = pgTable("as_regulatory_standards", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parameterName: text("parameter_name").notNull(),
  productCategory: text("product_category"),
  specification: text("specification").notNull(),
  specMin: real("spec_min"),
  specMax: real("spec_max"),
  unit: text("unit"),
  source: text("source"),
  referenceSection: text("reference_section"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const asAuditLog = pgTable("as_audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  userId: text("user_id"),
  userName: text("user_name"),
  changes: jsonb("changes"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

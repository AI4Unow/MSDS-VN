import {
  pgTable,
  text,
  integer,
  real,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const mdProductMaster = pgTable("md_product_master", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text("sku").unique().notNull(),
  name: text("name").notNull(),
  nameVariants: jsonb("name_variants").$type<string[]>(),
  casNumber: text("cas_number"),
  category: text("category"),
  subcategory: text("subcategory"),
  attributes: jsonb("attributes").$type<Record<string, unknown>>(),
  subsidiarySource: text("subsidiary_source").default("Asia Shine"),
  dataQualityScore: real("data_quality_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

export const mdSupplierMaster = pgTable("md_supplier_master", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameVariants: jsonb("name_variants").$type<string[]>(),
  country: text("country"),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  qualityScore: real("quality_score").default(100),
  certification: jsonb("certification").$type<string[]>(),
  dataQualityScore: real("data_quality_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mdDataSources = pgTable("md_data_sources", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceType: text("source_type"),
  sourceLocation: text("source_location"),
  entityType: text("entity_type"),
  recordCount: integer("record_count"),
  lastScanned: timestamp("last_scanned"),
  dataQualityScore: real("data_quality_score"),
  owner: text("owner"),
  migrationStatus: text("migration_status").$type<
    "pending" | "in_progress" | "completed" | "failed"
  >()
    .default("pending")
    .notNull(),
  migrationDate: timestamp("migration_date"),
});

export const mdDataQualityIssues = pgTable("md_data_quality_issues", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceId: text("source_id").references(() => mdDataSources.id),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  issueType: text("issue_type").$type<
    "missing_field" | "invalid_format" | "duplicate" | "inconsistent"
  >(),
  fieldName: text("field_name"),
  currentValue: text("current_value"),
  expectedValue: text("expected_value"),
  severity: text("severity").$type<
    "critical" | "high" | "medium" | "low"
  >(),
  status: text("status").$type<
    "open" | "in_progress" | "resolved" | "wont_fix"
  >()
    .default("open")
    .notNull(),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const mdGovernanceDecisions = pgTable("md_governance_decisions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  decisionType: text("decision_type"),
  description: text("description"),
  rationale: text("rationale"),
  approvedBy: jsonb("approved_by").$type<string[]>(),
  decisionDate: timestamp("decision_date"),
  effectiveDate: timestamp("effective_date"),
  relatedEntities: jsonb("related_entities").$type<string[]>(),
});

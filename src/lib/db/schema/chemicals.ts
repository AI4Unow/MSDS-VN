import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const chemicals = pgTable(
  "chemicals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    casNumber: text("cas_number"),
    name: text("name").notNull(),
    synonymNames: jsonb("synonym_names").$type<string[]>().default([]),
    formula: text("formula"),
    molecularWeight: text("molecular_weight"),
    pubchemCid: integer("pubchem_cid"),
    ghsHazardCodes: jsonb("ghs_hazard_codes").$type<string[]>().default([]),
    ghsPictograms: jsonb("ghs_pictograms").$type<string[]>().default([]),
    properties: jsonb("properties"),
    sourceSdsId: uuid("source_sds_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("chemicals_org_idx").on(t.orgId),
    uniqueIndex("chemicals_org_cas_uniq").on(t.orgId, t.casNumber),
  ]
);

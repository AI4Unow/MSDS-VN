import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const chairmanScenarios = pgTable("chairman_scenarios", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  budgetAllocation: jsonb("budget_allocation").$type<Record<number, number>>(),
  timelineAdjustments: jsonb("timeline_adjustments").$type<
    Record<string, number>
  >(),
  projectedKpis: jsonb("projected_kpis"),
  confidenceIntervals: jsonb("confidence_intervals"),
  aiRecommendation: text("ai_recommendation"),
  isBaseline: boolean("is_baseline").default(false),
});

export const chairmanComponentStatus = pgTable("chairman_component_status", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  componentId: integer("component_id").notNull(),
  layer: integer("layer").notNull(),
  name: text("name").notNull(),
  status: text("status").$type<
    "pending" | "in_progress" | "completed" | "blocked"
  >()
    .default("pending")
    .notNull(),
  budgetAllocated: real("budget_allocated"),
  budgetConsumed: real("budget_consumed"),
  progressPercent: integer("progress_percent").default(0),
  blockers: jsonb("blockers").$type<
    Array<{ description: string; owner: string; eta: string }>
  >(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const chairmanKpis = pgTable("chairman_kpis", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  metricName: text("metric_name").unique().notNull(),
  baselineValue: real("baseline_value"),
  targetValue: real("target_value"),
  currentValue: real("current_value"),
  unit: text("unit"),
  lastMeasured: timestamp("last_measured"),
});

export const chairmanSubsidiaryReadiness = pgTable(
  "chairman_subsidiary_readiness",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    subsidiaryName: text("subsidiary_name").notNull(),
    dataQualityScore: integer("data_quality_score").default(0),
    teamReadiness: text("team_readiness").$type<
      "ready" | "training" | "not_ready"
    >()
      .default("not_ready")
      .notNull(),
    infraStatus: text("infra_status").$type<
      "live" | "pending" | "not_started"
    >()
      .default("not_started")
      .notNull(),
    pilotResults: text("pilot_results").$type<
      "in_progress" | "completed" | "not_started"
    >()
      .default("not_started")
      .notNull(),
    overallStatus: text("overall_status").$type<"green" | "yellow" | "red">()
      .default("red")
      .notNull(),
    lastUpdated: timestamp("last_updated").defaultNow(),
  }
);

export const chairmanRisks = pgTable("chairman_risks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").$type<
    "critical" | "high" | "medium" | "low"
  >()
    .default("medium")
    .notNull(),
  likelihood: text("likelihood").$type<"high" | "medium" | "low">()
    .default("medium")
    .notNull(),
  mitigationStatus: text("mitigation_status").$type<
    "mitigated" | "in_progress" | "not_started"
  >()
    .default("not_started")
    .notNull(),
  owner: text("owner"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

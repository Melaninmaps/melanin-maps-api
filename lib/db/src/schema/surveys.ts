import { boolean, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const neighborhoodSurveysTable = pgTable("neighborhood_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  city: varchar("city", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 255 }),
  visitPurpose: varchar("visit_purpose", { length: 100 }).notNull(),
  visitFreq: varchar("visit_freq", { length: 50 }),
  daytimeSafety: integer("daytime_safety").notNull(),
  nighttimeSafety: integer("nighttime_safety").notNull(),
  walkability: integer("walkability"),
  transitSafety: integer("transit_safety"),
  atmosphere: varchar("atmosphere", { length: 50 }).notNull(),
  policeVisibility: varchar("police_visibility", { length: 50 }),
  policeImpact: varchar("police_impact", { length: 50 }),
  communityRating: integer("community_rating"),
  culturallyConnected: varchar("culturally_connected", { length: 50 }),
  linkedBusinessId: varchar("linked_business_id"),
  nominationName: varchar("nomination_name", { length: 255 }),
  nominationCategory: varchar("nomination_category", { length: 100 }),
  nominationSocialLink: varchar("nomination_social_link", { length: 500 }),
  accessibility: jsonb("accessibility").$type<string[]>().notNull().default([]),
  tips: jsonb("tips").$type<string[]>().notNull().default([]),
  comments: text("comments"),
  safetyScore: integer("safety_score").notNull().default(0),
  communityScore: integer("community_score").notNull().default(0),
  walkabilityScore: integer("walkability_score").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  moderatorNotes: text("moderator_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: varchar("reviewed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const safetyReportsTable = pgTable("safety_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id"),
  reporterName: varchar("reporter_name", { length: 255 }).notNull().default("Anonymous"),
  category: varchar("category", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull().default("business"),
  targetId: varchar("target_id"),
  targetName: varchar("target_name", { length: 255 }).notNull(),
  encounterType: varchar("encounter_type", { length: 50 }),
  incidentCity: varchar("incident_city", { length: 100 }),
  incidentRegion: varchar("incident_region", { length: 100 }),
  incidentArea: varchar("incident_area", { length: 255 }),
  incidentLocationSource: varchar("incident_location_source", { length: 30 }).notNull().default("manual_area"),
  incidentLocationPrecision: varchar("incident_location_precision", { length: 30 }).notNull().default("city"),
  description: text("description"),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  routingType: varchar("routing_type", { length: 20 }).notNull().default("moderation"),
  businessResponseRequested: boolean("business_response_requested").notNull().default(false),
  businessResponseDeadline: timestamp("business_response_deadline", { withTimezone: true }),
  businessResponseText: text("business_response_text"),
  autoEscalated: boolean("auto_escalated").notNull().default(false),
  incidentCategories: jsonb("incident_categories").$type<string[]>().notNull().default([]),
  incidentParties: jsonb("incident_parties").$type<string[]>().notNull().default([]),
  incidentSeverity: varchar("incident_severity", { length: 20 }),
  incidentDescription: text("incident_description"),
  evidenceLinks: text("evidence_links"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  moderatorNotes: text("moderator_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: varchar("reviewed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSurveySchema = createInsertSchema(neighborhoodSurveysTable).omit({
  id: true,
  createdAt: true,
  status: true,
  moderatorNotes: true,
  reviewedAt: true,
  reviewedBy: true,
});

export const selectSurveySchema = createSelectSchema(neighborhoodSurveysTable);

export const SAFETY_REPORT_CATEGORIES = [
  "safety",
  "sundown",
  "discrimination",
  "business",
  "resource",
  "positive",
  "police",
] as const;

export const SAFETY_REPORT_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const ROUTING_TYPES = ["private", "moderation", "priority"] as const;

export const insertSafetyReportSchema = createInsertSchema(safetyReportsTable, {
  category: z.enum(SAFETY_REPORT_CATEGORIES),
  severity: z.enum(SAFETY_REPORT_SEVERITIES).default("medium"),
  routingType: z.enum(ROUTING_TYPES).default("moderation"),
}).omit({
  id: true,
  createdAt: true,
  status: true,
  moderatorNotes: true,
  reviewedAt: true,
  reviewedBy: true,
  businessResponseDeadline: true,
  autoEscalated: true,
});

export const selectSafetyReportSchema = createSelectSchema(safetyReportsTable);

export const safetyIncidentsTable = pgTable("safety_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: varchar("city", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 255 }),
  category: varchar("category", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  reportCount: integer("report_count").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  notificationsSent: boolean("notifications_sent").notNull().default(false),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SafetyIncident = typeof safetyIncidentsTable.$inferSelect;

export type NeighborhoodSurvey = typeof neighborhoodSurveysTable.$inferSelect;
export type InsertNeighborhoodSurvey = z.infer<typeof insertSurveySchema>;
export type SafetyReport = typeof safetyReportsTable.$inferSelect;
export type InsertSafetyReport = z.infer<typeof insertSafetyReportSchema>;

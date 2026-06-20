import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
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
  policeVisibility: varchar("police_visibility", { length: 50 }).notNull(),
  policeImpact: varchar("police_impact", { length: 50 }).notNull(),
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
  description: text("description"),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
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
] as const;

export const SAFETY_REPORT_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const insertSafetyReportSchema = createInsertSchema(safetyReportsTable, {
  category: z.enum(SAFETY_REPORT_CATEGORIES),
  severity: z.enum(SAFETY_REPORT_SEVERITIES).default("medium"),
}).omit({
  id: true,
  createdAt: true,
  status: true,
  moderatorNotes: true,
  reviewedAt: true,
  reviewedBy: true,
});

export const selectSafetyReportSchema = createSelectSchema(safetyReportsTable);

export type NeighborhoodSurvey = typeof neighborhoodSurveysTable.$inferSelect;
export type InsertNeighborhoodSurvey = z.infer<typeof insertSurveySchema>;
export type SafetyReport = typeof safetyReportsTable.$inferSelect;
export type InsertSafetyReport = z.infer<typeof insertSafetyReportSchema>;

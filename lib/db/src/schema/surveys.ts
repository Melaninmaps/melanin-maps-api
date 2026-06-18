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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSurveySchema = createInsertSchema(neighborhoodSurveysTable).omit({
  id: true,
  createdAt: true,
});

export const selectSurveySchema = createSelectSchema(neighborhoodSurveysTable);

export type NeighborhoodSurvey = typeof neighborhoodSurveysTable.$inferSelect;
export type InsertNeighborhoodSurvey = z.infer<typeof insertSurveySchema>;

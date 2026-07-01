import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export type SafetySurveyResponses = {
  overallRating: number;
  feltWelcomed: "yes" | "somewhat" | "no";
  experiencedBias: boolean;
  biasDetails?: string;
  staffAttitude: number;
  wouldReturn: boolean;
  wouldRecommend: boolean;
  notes?: string;
};

export type EmployeeSurveyResponses = {
  employmentStatus: "current" | "former";
  overallRating: number;
  feltRespected: "yes" | "somewhat" | "no";
  payEquityConcerns: boolean;
  witnessedDiscrimination: boolean;
  discriminationDetails?: string;
  wouldRecommendWorking: boolean;
  notes?: string;
};

export const businessInsightSurveysTable = pgTable("business_insight_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id"),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessCity: varchar("business_city", { length: 100 }),
  businessCategory: varchar("business_category", { length: 100 }),
  businessAddress: varchar("business_address", { length: 500 }),
  isMinorityOwned: boolean("is_minority_owned").notNull().default(false),
  surveyType: varchar("survey_type", { length: 20 }).notNull(),
  submittedByUserId: varchar("submitted_by_user_id"),
  responses: jsonb("responses").$type<SafetySurveyResponses | EmployeeSurveyResponses>().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  moderatorNotes: text("moderator_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessInsightSurvey = typeof businessInsightSurveysTable.$inferSelect;
export const insertBusinessInsightSchema = createInsertSchema(businessInsightSurveysTable).omit({
  id: true,
  createdAt: true,
  status: true,
  moderatorNotes: true,
});
export const selectBusinessInsightSchema = createSelectSchema(businessInsightSurveysTable);

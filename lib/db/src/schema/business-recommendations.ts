import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const businessRecommendationsTable = pgTable("business_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recommenderUserId: varchar("recommender_user_id"),
  recommenderEmail: varchar("recommender_email", { length: 255 }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  category: varchar("category", { length: 100 }),
  note: text("note"),
  businessEmail: varchar("business_email", { length: 255 }),
  emailSentAt: timestamp("email_sent_at"),
  pointsAwarded: boolean("points_awarded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BusinessRecommendation = typeof businessRecommendationsTable.$inferSelect;

import { pgTable, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

export const globalRecommendationsTable = pgTable("global_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  businessId: varchar("business_id").references(() => businessesTable.id, { onDelete: "set null" }),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }),
  socialMedia: varchar("social_media", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull().default("other"),
  reason: text("reason"),
  personalConnection: text("personal_connection"),
  communities: jsonb("communities").$type<string[]>().default([]),
  badge: varchar("badge", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GlobalRecommendation = typeof globalRecommendationsTable.$inferSelect;
export type InsertGlobalRecommendation = typeof globalRecommendationsTable.$inferInsert;

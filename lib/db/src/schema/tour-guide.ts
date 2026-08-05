import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const tourGuideBusinessesTable = pgTable("tour_guide_businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  businessType: varchar("business_type", { length: 150 }),
  diasporaCommunity: varchar("diaspora_community", { length: 200 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  cityType: varchar("city_type", { length: 30 }).notNull().default("full_feature"), // full_feature | satellite
  parentHubCity: varchar("parent_hub_city", { length: 100 }), // null for full_feature cities
  neighborhood: varchar("neighborhood", { length: 200 }),
  address: text("address"),
  description: text("description"),
  contentOpportunity: text("content_opportunity"),
  // launch_enabled = false means hidden from app/web until founder gives greenlight
  // Used primarily for Asian & Pacific Islander businesses per founder instruction
  launchEnabled: boolean("launch_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTourGuideBusinessSchema = createInsertSchema(tourGuideBusinessesTable).omit({
  id: true,
  createdAt: true,
});
export const selectTourGuideBusinessSchema = createSelectSchema(tourGuideBusinessesTable);
export type TourGuideBusiness = typeof tourGuideBusinessesTable.$inferSelect;
export type InsertTourGuideBusiness = typeof tourGuideBusinessesTable.$inferInsert;

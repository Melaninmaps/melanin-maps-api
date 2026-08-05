import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const tourGuideBusinessesTable = pgTable("tour_guide_businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  businessType: varchar("business_type", { length: 150 }),
  diasporaCommunity: varchar("diaspora_community", { length: 200 }),
  // Extended community tag aligned with instructions doc taxonomy
  culturalCommunity: varchar("cultural_community", { length: 200 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  cityType: varchar("city_type", { length: 30 }).notNull().default("full_feature"), // full_feature | satellite
  parentHubCity: varchar("parent_hub_city", { length: 100 }), // null for full_feature cities
  neighborhood: varchar("neighborhood", { length: 200 }),
  address: text("address"),
  description: text("description"),
  contentOpportunity: text("content_opportunity"),
  // Category for filtering/search
  category: varchar("category", { length: 100 }),
  // Pin designation system (stored as comma-separated for compatibility)
  pinDesignations: varchar("pin_designations", { length: 500 }),
  primaryDesignation: varchar("primary_designation", { length: 50 }).default("business"),
  // Claim/data status
  listingStatus: varchar("listing_status", { length: 50 }).default("unclaimed"),
  dataSource: varchar("data_source", { length: 100 }).default("mwm_research"),
  // launch_enabled = false means hidden from app/web until founder gives greenlight
  // Used primarily for Asian & Pacific Islander businesses per founder instruction
  launchEnabled: boolean("launch_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// City regional dialect / Kinfolk phrase profiles
export const cityDialectProfilesTable = pgTable("city_dialect_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  // Comma-separated endorsement/Kinfolk phrases (AAVE + regional dialect)
  phrases: text("phrases").notNull(),
  // Natural-language context for KinfolkAI
  kinfolkContext: text("kinfolk_context"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTourGuideBusinessSchema = createInsertSchema(tourGuideBusinessesTable).omit({
  id: true,
  createdAt: true,
});
export const selectTourGuideBusinessSchema = createSelectSchema(tourGuideBusinessesTable);
export type TourGuideBusiness = typeof tourGuideBusinessesTable.$inferSelect;
export type InsertTourGuideBusiness = typeof tourGuideBusinessesTable.$inferInsert;

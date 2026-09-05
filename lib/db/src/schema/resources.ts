import { pgTable, text, varchar, boolean, integer, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const resourceCategoryEnum = pgEnum("resource_category", [
  "essential_support",
  "education",
  "jobs",
  "business",
  "housing",
  "safety_rights",
]);

export const resourceSourceTierEnum = pgEnum("resource_source_tier", [
  "official",
  "verified_org",
  "community_confirmed",
  "community_shared",
]);

export const resourcesTable = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  category: resourceCategoryEnum("category").notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  sourceTier: resourceSourceTierEnum("source_tier").notNull().default("community_shared"),
  organization: varchar("organization", { length: 200 }),
  url: text("url"),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  isNational: boolean("is_national").notNull().default(true),
  keywords: text("keywords").array(),
  applicationDeadline: timestamp("application_deadline"),
  expiresAt: timestamp("expires_at"),
  lastConfirmedAt: timestamp("last_confirmed_at"),
  isActive: boolean("is_active").notNull().default(true),
  reportCount: integer("report_count").notNull().default(0),
  canonicalKey: text("canonical_key"),
  normalizedTitle: text("normalized_title"),
  sourceCategory: text("source_category"),
  sourceSubcategory: text("source_subcategory"),
  sourceAddress: text("source_address"),
  publishedBy: text("published_by"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Resource = typeof resourcesTable.$inferSelect;
export type InsertResource = typeof resourcesTable.$inferInsert;

import { boolean, integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const culturalSitesTable = pgTable("cultural_sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("Heritage"),
  heritageCategory: varchar("heritage_category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  ethnicCommunity: varchar("ethnic_community", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  address: varchar("address", { length: 255 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  era: varchar("era", { length: 100 }),
  significance: text("significance"),
  imageUrl: varchar("image_url", { length: 500 }),
  externalUrl: varchar("external_url", { length: 500 }),
  isVerified: boolean("is_verified").notNull().default(true),
  yearEstablished: integer("year_established"),
  isAccessible: boolean("is_accessible").default(false),
  isFamilyFriendly: boolean("is_family_friendly").default(true),
  admissionFree: boolean("admission_free").default(true),
  audioGuide: boolean("audio_guide").default(false),
  verifiedSource: varchar("verified_source", { length: 255 }),
  country: varchar("country", { length: 100 }).default("United States"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCulturalSiteSchema = createInsertSchema(culturalSitesTable).omit({ id: true, createdAt: true });
export const selectCulturalSiteSchema = createSelectSchema(culturalSitesTable);

export type CulturalSite = typeof culturalSitesTable.$inferSelect;
export type InsertCulturalSite = typeof culturalSitesTable.$inferInsert;

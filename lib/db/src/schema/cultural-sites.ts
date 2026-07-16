import { boolean, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const culturalSitesTable = pgTable("cultural_sites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("Heritage"),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCulturalSiteSchema = createInsertSchema(culturalSitesTable).omit({ id: true, createdAt: true });
export const selectCulturalSiteSchema = createSelectSchema(culturalSitesTable);

export type CulturalSite = typeof culturalSitesTable.$inferSelect;
export type InsertCulturalSite = typeof culturalSitesTable.$inferInsert;

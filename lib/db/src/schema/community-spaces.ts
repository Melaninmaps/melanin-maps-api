import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communitySpaceListingsTable = pgTable("community_space_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postedById: varchar("posted_by_id").notNull(),
  postedByName: varchar("posted_by_name", { length: 200 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }),
  neighborhood: varchar("neighborhood", { length: 200 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  spaceType: varchar("space_type", { length: 30 }).notNull().default("rent"),
  priceLabel: varchar("price_label", { length: 100 }),
  sqft: integer("sqft"),
  listingUrl: varchar("listing_url", { length: 500 }),
  agentName: varchar("agent_name", { length: 200 }),
  agentPhone: varchar("agent_phone", { length: 30 }),
  agentEmail: varchar("agent_email", { length: 255 }),
  agentUrl: varchar("agent_url", { length: 500 }),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunitySpaceSchema = createInsertSchema(communitySpaceListingsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const selectCommunitySpaceSchema = createSelectSchema(communitySpaceListingsTable);

export type CommunitySpaceListing = typeof communitySpaceListingsTable.$inferSelect;
export type InsertCommunitySpaceListing = z.infer<typeof insertCommunitySpaceSchema>;

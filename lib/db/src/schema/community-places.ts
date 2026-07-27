import { boolean, integer, numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityPlacesTable = pgTable("community_places", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  venueName: varchar("venue_name", { length: 200 }),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("United States"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  postCount: integer("post_count").notNull().default(1),
  positivePostCount: integer("positive_post_count").notNull().default(0),
  communityRating: numeric("community_rating", { precision: 3, scale: 1 }).default("0"),
  addedByUserId: varchar("added_by_user_id"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunityPlaceSchema = createInsertSchema(communityPlacesTable).omit({ id: true, createdAt: true });
export const selectCommunityPlaceSchema = createSelectSchema(communityPlacesTable);

export type CommunityPlace = typeof communityPlacesTable.$inferSelect;
export type InsertCommunityPlace = z.infer<typeof insertCommunityPlaceSchema>;

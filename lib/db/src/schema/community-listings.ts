import { pgTable, text, varchar, boolean, integer, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const listingTypeEnum = pgEnum("listing_type", [
  "product", "service", "skill_trade", "digital", "free",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active", "sold", "traded", "reserved", "removed",
]);

export const listingConditionEnum = pgEnum("listing_condition", [
  "new", "like_new", "good", "fair", "trade_only",
]);

export const communityListingsTable = pgTable("community_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: listingTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: varchar("price", { length: 50 }),
  priceType: varchar("price_type", { length: 20 }).notNull().default("fixed"),
  category: varchar("category", { length: 100 }),
  condition: listingConditionEnum("condition"),
  tags: text("tags").array(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  isRemote: boolean("is_remote").notNull().default(false),
  contactPreference: varchar("contact_preference", { length: 30 }).notNull().default("app_message"),
  contactInfo: varchar("contact_info", { length: 200 }),
  status: listingStatusEnum("status").notNull().default("active"),
  viewCount: integer("view_count").notNull().default(0),
  savedCount: integer("saved_count").notNull().default(0),
  reportCount: integer("report_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CommunityListing = typeof communityListingsTable.$inferSelect;
export type InsertCommunityListing = typeof communityListingsTable.$inferInsert;

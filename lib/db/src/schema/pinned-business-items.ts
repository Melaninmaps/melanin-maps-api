import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const pinnedBusinessItemsTable = pgTable("pinned_business_items", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id").notNull(),
  itemType: varchar("item_type", { enum: ["review", "video"] }).notNull(),
  reviewId: varchar("review_id"),
  reviewText: text("review_text"),
  reviewAuthor: varchar("review_author", { length: 120 }),
  reviewRating: integer("review_rating"),
  reviewInitials: varchar("review_initials", { length: 4 }),
  reviewColor: varchar("review_color", { length: 12 }),
  reviewTimeAgo: varchar("review_time_ago", { length: 40 }),
  videoUrl: text("video_url"),
  videoTitle: varchar("video_title", { length: 200 }),
  pinnedAt: timestamp("pinned_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  notifiedExpiry: boolean("notified_expiry").notNull().default(false),
  status: varchar("status", { enum: ["active", "expired", "replaced"] }).notNull().default("active"),
});

export type PinnedBusinessItem = typeof pinnedBusinessItemsTable.$inferSelect;
export type InsertPinnedBusinessItem = typeof pinnedBusinessItemsTable.$inferInsert;

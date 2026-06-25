import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  businessId: varchar("business_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull().default("Community Member"),
  rating: integer("rating").notNull(),
  text: text("text"),
  wouldReturnAlone: boolean("would_return_alone"),
  socialHandle: varchar("social_handle", { length: 100 }),
  socialPlatform: varchar("social_platform", { length: 30 }),
  videoUrl: varchar("video_url", { length: 500 }),
  nonMinorityOwned: boolean("non_minority_owned").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});

export const selectReviewSchema = createSelectSchema(reviewsTable);

export type ReviewRow = typeof reviewsTable.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityAppreciationsTable = pgTable("community_appreciations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id"),
  businessId: varchar("business_id").notNull(),
  businessName: varchar("business_name", { length: 255 }),
  userId: varchar("user_id"),
  sharePreference: varchar("share_preference", { length: 20 }).notNull().default("private"),
  recognitionTags: text("recognition_tags").array().default(sql`ARRAY[]::text[]`),
  encouragementTags: text("encouragement_tags").array().default(sql`ARRAY[]::text[]`),
  commentOption: varchar("comment_option", { length: 20 }),
  reviewText: text("review_text"),
  appreciationNote: text("appreciation_note"),
  authorName: varchar("author_name", { length: 255 }),
  sentToBusiness: boolean("sent_to_business").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunityAppreciationSchema = createInsertSchema(communityAppreciationsTable).omit({
  id: true,
  createdAt: true,
});

export const selectCommunityAppreciationSchema = createSelectSchema(communityAppreciationsTable);

export type CommunityAppreciationRow = typeof communityAppreciationsTable.$inferSelect;
export type InsertCommunityAppreciation = z.infer<typeof insertCommunityAppreciationSchema>;

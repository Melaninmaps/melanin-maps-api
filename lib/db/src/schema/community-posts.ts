import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityPostsTable = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id"),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorInitials: varchar("author_initials", { length: 4 }).notNull(),
  authorColor: varchar("author_color", { length: 20 }).notNull().default("#3B1F0E"),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("general"),
  postType: varchar("post_type", { length: 30 }).notNull().default("community"),
  businessId: varchar("business_id"),
  businessName: varchar("business_name", { length: 150 }),
  businessLink: text("business_link"),
  mediaUrls: text("media_urls"),
  savedPlaceId: varchar("saved_place_id"),
  visibility: varchar("visibility", { length: 20 }).notNull().default("public"),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityPostCommentsTable = pgTable("community_post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  authorId: varchar("author_id"),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorInitials: varchar("author_initials", { length: 4 }).notNull(),
  authorColor: varchar("author_color", { length: 20 }).notNull().default("#3B1F0E"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({
  id: true,
  createdAt: true,
});

export const selectCommunityPostSchema = createSelectSchema(communityPostsTable);

export const insertCommunityPostCommentSchema = createInsertSchema(communityPostCommentsTable).omit({
  id: true,
  createdAt: true,
});

export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPostComment = typeof communityPostCommentsTable.$inferSelect;
export type InsertCommunityPostComment = z.infer<typeof insertCommunityPostCommentSchema>;

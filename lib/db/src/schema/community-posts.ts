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
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({
  id: true,
  createdAt: true,
});

export const selectCommunityPostSchema = createSelectSchema(communityPostsTable);

export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

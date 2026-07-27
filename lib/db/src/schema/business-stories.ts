import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessStoriesTable = pgTable("business_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  storyType: varchar("story_type", { length: 30 }).notNull().default("update"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessStorySchema = createInsertSchema(businessStoriesTable).omit({ id: true, createdAt: true });
export const selectBusinessStorySchema = createSelectSchema(businessStoriesTable);

export type BusinessStory = typeof businessStoriesTable.$inferSelect;
export type InsertBusinessStory = z.infer<typeof insertBusinessStorySchema>;

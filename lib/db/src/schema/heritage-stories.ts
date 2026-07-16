import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const heritageStoriesTable = pgTable("heritage_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  authorName: varchar("author_name", { length: 100 }),
  relationshipType: varchar("relationship_type", { length: 100 }).notNull(),
  content: text("content").notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isAmbassador: boolean("is_ambassador").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHeritageStorySchema = createInsertSchema(heritageStoriesTable).omit({
  id: true,
  createdAt: true,
});
export const selectHeritageStorySchema = createSelectSchema(heritageStoriesTable);

export type HeritageStory = typeof heritageStoriesTable.$inferSelect;
export type InsertHeritageStory = typeof heritageStoriesTable.$inferInsert;

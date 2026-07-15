import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hashtagsTable = pgTable("hashtags", {
  tag: varchar("tag", { length: 100 }).primaryKey(),
  postCount: integer("post_count").notNull().default(0),
  weeklyPostCount: integer("weekly_post_count").notNull().default(0),
  lastPostAt: timestamp("last_post_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHashtagSchema = createInsertSchema(hashtagsTable).omit({ createdAt: true });
export const selectHashtagSchema = createSelectSchema(hashtagsTable);

export type Hashtag = typeof hashtagsTable.$inferSelect;
export type InsertHashtag = z.infer<typeof insertHashtagSchema>;

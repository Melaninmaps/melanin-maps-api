import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const contentFilterViolationsTable = pgTable("content_filter_violations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  contentSnippet: text("content_snippet").notNull(),
  matchedKeywords: text("matched_keywords").array().notNull().default([]),
  wasBlocked: boolean("was_blocked").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ContentFilterViolation = typeof contentFilterViolationsTable.$inferSelect;

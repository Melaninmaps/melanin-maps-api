import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const contentReportsTable = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id"),
  targetType: varchar("target_type", { enum: ["review", "survey", "business", "post", "comment", "happening_story", "user"] }).notNull(),
  targetId: varchar("target_id").notNull(),
  reason: varchar("reason", {
    enum: ["spam", "fake", "inappropriate", "harassment", "incorrect_info", "suspicious", "other"],
  }).notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["pending", "reviewed", "dismissed", "actioned"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContentReport = typeof contentReportsTable.$inferSelect;
export type InsertContentReport = typeof contentReportsTable.$inferInsert;

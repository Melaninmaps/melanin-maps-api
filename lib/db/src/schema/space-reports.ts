import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const spaceReportsTable = pgTable("space_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id"),
  spaceName: varchar("space_name", { length: 200 }).notNull(),
  address: varchar("address", { length: 300 }),
  city: varchar("city", { length: 100 }).notNull(),
  category: varchar("category", {
    enum: ["restaurant", "store", "venue", "entertainment", "hotel", "other"],
  }).notNull(),
  concernTypes: text("concern_types").notNull(),
  description: text("description").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  status: varchar("status", { enum: ["pending", "reviewed", "dismissed", "actioned"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SpaceReport = typeof spaceReportsTable.$inferSelect;
export type InsertSpaceReport = typeof spaceReportsTable.$inferInsert;

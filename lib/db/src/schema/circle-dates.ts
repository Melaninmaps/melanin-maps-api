import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const circleImportantDates = pgTable("circle_important_dates", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull(),
  addedByUserId: text("added_by_user_id").notNull(),
  title: text("title").notNull(),
  dateType: text("date_type").notNull().default("event"),
  targetDate: text("target_date").notNull(),
  targetUserId: text("target_user_id"),
  targetUserName: text("target_user_name"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CircleImportantDate = typeof circleImportantDates.$inferSelect;
export type NewCircleImportantDate = typeof circleImportantDates.$inferInsert;

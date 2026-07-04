import { pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const kinfolkTasksTable = pgTable("kinfolk_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  listId: varchar("list_id", { length: 255 }),
  title: varchar("title", { length: 300 }).notNull(),
  notes: text("notes"),
  dueAt: timestamp("due_at"),
  dueTimeLabel: varchar("due_time_label", { length: 150 }),
  category: varchar("category", { length: 50 }),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type KinfolkTask = typeof kinfolkTasksTable.$inferSelect;

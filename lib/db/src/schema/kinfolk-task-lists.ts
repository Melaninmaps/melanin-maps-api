import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const kinfolkTaskListsTable = pgTable("kinfolk_task_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }).default("📋"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type KinfolkTaskList = typeof kinfolkTaskListsTable.$inferSelect;

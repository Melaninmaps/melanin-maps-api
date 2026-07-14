import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const kinfolkSearchEventsTable = pgTable("kinfolk_search_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  query: text("query").notNull(),
  category: varchar("category", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KinfolkSearchEvent = typeof kinfolkSearchEventsTable.$inferSelect;
export type InsertKinfolkSearchEvent = typeof kinfolkSearchEventsTable.$inferInsert;

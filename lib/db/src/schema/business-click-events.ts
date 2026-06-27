import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./auth";

export const businessClickEventsTable = pgTable("business_click_events", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  clickType: varchar("click_type", { length: 30 }).notNull(),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessClickEvent = typeof businessClickEventsTable.$inferSelect;

import { pgTable, text, varchar, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const resourceAlertsTable = pgTable("resource_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  query: text("query"),
  category: varchar("category", { length: 50 }),
  keywords: text("keywords").array(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ResourceAlert = typeof resourceAlertsTable.$inferSelect;
export type InsertResourceAlert = typeof resourceAlertsTable.$inferInsert;

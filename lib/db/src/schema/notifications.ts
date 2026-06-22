import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, text, boolean } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { enum: ["system", "review", "safety", "community", "promo"] })
    .notNull()
    .default("system"),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;

import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    type: varchar("type", {
      enum: ["system", "review", "safety", "community", "promo", "events", "knowledge", "travel", "health", "marketplace", "journey", "challenge", "business"],
    }).notNull().default("system"),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    entityId: varchar("entity_id"),
    entityType: varchar("entity_type", { length: 50 }),
    data: jsonb("data").$type<Record<string, unknown>>(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.read),
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const notificationPreferencesTable = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  topics: text("topics").array().notNull().default(sql`ARRAY['community','safety','events','business']::text[]`),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;
export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;

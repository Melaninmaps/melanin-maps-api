import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const BROADCAST_TYPES = ["event", "offer", "product", "update", "community", "emergency"] as const;
export type BroadcastType = typeof BROADCAST_TYPES[number];

// Monthly quota by marketplace tier (emergency broadcasts bypass this)
export const BROADCAST_QUOTA: Record<string, number> = {
  free: 2,
  growth: 8,
  premium: 20,
  enterprise: 50,
};

export const businessBroadcastsTable = pgTable("business_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20, enum: BROADCAST_TYPES }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  // Push delivery tracking
  recipientCount: integer("recipient_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  // Engagement (updated async)
  viewCount: integer("view_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per-user per-business notification preferences
export const businessNotificationPrefsTable = pgTable("business_notification_prefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  // Which notification types the user wants
  enabledTypes: jsonb("enabled_types").$type<BroadcastType[]>().notNull().default(["event", "offer", "community", "emergency"]),
  // Delivery frequency
  frequency: varchar("frequency", { length: 20, enum: ["immediate", "daily_digest", "weekly_digest", "never"] }).notNull().default("immediate"),
  // Temporary pause
  pausedUntil: timestamp("paused_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type BusinessBroadcast = typeof businessBroadcastsTable.$inferSelect;
export type BusinessNotificationPrefs = typeof businessNotificationPrefsTable.$inferSelect;

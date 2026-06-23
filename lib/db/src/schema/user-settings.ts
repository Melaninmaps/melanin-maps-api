import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  userId: varchar("user_id").primaryKey(),

  // ── Notification categories ──────────────────────────────────────────────
  notifEvents: boolean("notif_events").notNull().default(true),
  notifBusiness: boolean("notif_business").notNull().default(true),
  notifMessages: boolean("notif_messages").notNull().default(true),
  notifReviews: boolean("notif_reviews").notNull().default(true),
  notifCommunity: boolean("notif_community").notNull().default(false),
  notifPromotions: boolean("notif_promotions").notNull().default(false),
  notifDigest: boolean("notif_digest").notNull().default(true),
  notifTips: boolean("notif_tips").notNull().default(false),
  notifPostNudges: boolean("notif_post_nudges").notNull().default(true),

  // ── Quiet hours ───────────────────────────────────────────────────────────
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(true),
  quietHoursFrom: varchar("quiet_hours_from", { length: 10 }).notNull().default("10:00 PM"),
  quietHoursUntil: varchar("quiet_hours_until", { length: 10 }).notNull().default("8:00 AM"),

  // ── Profile & visibility ──────────────────────────────────────────────────
  profileVisibility: varchar("profile_visibility", { enum: ["public", "community", "private"] })
    .notNull().default("community"),
  showLocation: boolean("show_location").notNull().default(true),
  locationPrecision: varchar("location_precision", { enum: ["neighborhood", "exact"] })
    .notNull().default("neighborhood"),
  activityStatus: boolean("activity_status").notNull().default(true),

  // ── Data & AI ─────────────────────────────────────────────────────────────
  usageAnalytics: boolean("usage_analytics").notNull().default(true),
  personalisedSuggestions: boolean("personalised_suggestions").notNull().default(true),
  kinfolkMemoryEnabled: boolean("kinfolk_memory_enabled").notNull().default(true),
  profileViewTrackingEnabled: boolean("profile_view_tracking_enabled").notNull().default(true),

  // ── Business owner opt-outs ───────────────────────────────────────────────
  postNudgesEnabled: boolean("post_nudges_enabled").notNull().default(true),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable);
export const selectUserSettingsSchema = createSelectSchema(userSettingsTable);

export type UserSettings = typeof userSettingsTable.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

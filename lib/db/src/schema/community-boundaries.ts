import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityBoundariesTable = pgTable("community_boundaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: varchar("target_id").notNull(),
  targetName: varchar("target_name", { length: 255 }),
  boundaryTypes: jsonb("boundary_types").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const safeSpacePreferencesTable = pgTable("safe_space_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  hideNotInterested: boolean("hide_not_interested").notNull().default(true),
  hideUnresolvedAlerts: boolean("hide_unresolved_alerts").notNull().default(false),
  showWouldReturnAlone: boolean("show_would_return_alone").notNull().default(false),
  prioritizeMinorityOwned: boolean("prioritize_minority_owned").notNull().default(true),
  hidePreviouslyReported: boolean("hide_previously_reported").notNull().default(true),
  safetyAlertsOnlySaved: boolean("safety_alerts_only_saved").notNull().default(false),
  pauseDMs: boolean("pause_dms").notNull().default(false),
  requireFollowers: boolean("require_followers").notNull().default(false),
  disablePromoMessages: boolean("disable_promo_messages").notNull().default(false),
  verifiedUsersOnly: boolean("verified_users_only").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBoundarySchema = createInsertSchema(communityBoundariesTable, {
  targetType: z.enum(["user", "business"]),
  boundaryTypes: z.array(z.string()).min(1),
}).omit({ id: true, createdAt: true });

export const insertSafeSpacePrefsSchema = createInsertSchema(safeSpacePreferencesTable).omit({
  id: true,
  updatedAt: true,
});

export type CommunityBoundary = typeof communityBoundariesTable.$inferSelect;
export type SafeSpacePreferences = typeof safeSpacePreferencesTable.$inferSelect;

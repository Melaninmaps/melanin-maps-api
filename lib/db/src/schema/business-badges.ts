import { integer, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessBadgesTable = pgTable("business_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  badgeId: varchar("badge_id", { length: 50 }).notNull(),
  appreciationCount: integer("appreciation_count").notNull().default(1),
  earnedAt: timestamp("earned_at", { withTimezone: true }),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("uniq_biz_badge").on(table.businessId, table.badgeId)]);

export const selectBusinessBadgeSchema = createSelectSchema(businessBadgesTable);

export type BusinessBadgeRow = typeof businessBadgesTable.$inferSelect;
export type BadgeId =
  | "community_welcomed"
  | "respect_in_action"
  | "community_favorite"
  | "accessibility_champion"
  | "family_friendly"
  | "inclusive_workplace"
  | "community_connector";
export const BADGE_THRESHOLD = 3;

export type z_BusinessBadge = z.infer<typeof selectBusinessBadgeSchema>;

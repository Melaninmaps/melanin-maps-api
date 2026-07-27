import { pgTable, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

// ─── Hidden Gem Nominations ─────────────────────────────────────────────────
// Community members nominate businesses as Hidden Gems.
// Auto-award triggers when a business hits the threshold (10 nominations + 4.3+ rating).
// Gem status expires after 90 days; businesses may be re-nominated.

export const HIDDEN_GEM_REASONS = [
  "amazing_service",
  "exceptional_food",
  "community_impact",
  "welcoming_atmosphere",
  "unique_products",
  "family_owned",
  "great_value",
  "cultural_significance",
  "hidden_location",
  "other",
] as const;

export const HIDDEN_GEM_AUDIENCES = [
  "new_residents",
  "visitors",
  "families",
  "college_students",
  "professionals",
  "date_night",
  "solo_travelers",
  "community_shopping",
  "lgbtq_friendly",
  "wheelchair_accessible",
] as const;

export type HiddenGemReason = typeof HIDDEN_GEM_REASONS[number];
export type HiddenGemAudience = typeof HIDDEN_GEM_AUDIENCES[number];

export const hiddenGemNominationsTable = pgTable(
  "hidden_gem_nominations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
    businessId: varchar("business_id").references(() => businessesTable.id, { onDelete: "cascade" }).notNull(),
    reason: varchar("reason", { length: 50 }).notNull(),
    comment: text("comment"),
    audienceTypes: text("audience_types").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("hidden_gem_nominations_user_business_unique").on(t.userId, t.businessId)],
);

export type HiddenGemNomination = typeof hiddenGemNominationsTable.$inferSelect;
export type InsertHiddenGemNomination = typeof hiddenGemNominationsTable.$inferInsert;

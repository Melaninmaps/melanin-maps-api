import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const CULTURAL_PASSPORT_MOMENT_KINDS = [
  "place",
  "event",
  "food",
  "music",
  "story",
  "community_voice",
  "learning",
] as const;

export type CulturalPassportMomentKind = (typeof CULTURAL_PASSPORT_MOMENT_KINDS)[number];

/**
 * Private, member-confirmed moments for My Passport.
 *
 * This deliberately does not store points, levels, streaks, achievement state,
 * completion state, or inferred activity. A moment exists only after the member
 * explicitly chooses to keep it in their Passport.
 */
export const culturalPassportMomentsTable = pgTable(
  "cultural_passport_moments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    kind: varchar("kind", { length: 40 }).notNull().$type<CulturalPassportMomentKind>(),
    title: varchar("title", { length: 180 }).notNull(),
    note: text("note"),
    sourceLabel: varchar("source_label", { length: 180 }),
    sourceUrl: text("source_url"),
    memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (table) => ({
    ownerActiveCreatedIdx: index("cultural_passport_moments_owner_active_created_idx")
      .on(table.userId, table.removedAt, table.createdAt),
  }),
);

export type CulturalPassportMoment = typeof culturalPassportMomentsTable.$inferSelect;
export type NewCulturalPassportMoment = typeof culturalPassportMomentsTable.$inferInsert;

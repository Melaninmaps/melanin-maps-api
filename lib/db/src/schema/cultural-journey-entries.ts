import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * A member-owned reference to a published cultural site, saved only after an
 * explicit member action. It is not a progress tracker, a location trail, or
 * a source of inferred identity.
 */
export const culturalJourneyEntriesTable = pgTable(
  "cultural_journey_entries",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    culturalSiteId: varchar("cultural_site_id", { length: 128 }).notNull(),
    siteName: varchar("site_name", { length: 180 }).notNull(),
    sourceLabel: varchar("source_label", { length: 120 }).notNull(),
    libraryQuestion: varchar("library_question", { length: 500 }).notNull(),
    reflection: text("reflection"),
    encryptedReflection: text("encrypted_reflection"),
    reflectionEncryptionKeyId: varchar("reflection_encryption_key_id", { length: 64 }),
    memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    reflectionConfirmedAt: timestamp("reflection_confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (table) => ({
    ownerSiteActiveIdx: index("cultural_journey_entries_owner_site_active_idx")
      .on(table.userId, table.culturalSiteId, table.removedAt),
    ownerActiveCreatedIdx: index("cultural_journey_entries_owner_active_created_idx")
      .on(table.userId, table.removedAt, table.createdAt),
  }),
);

export type CulturalJourneyEntry = typeof culturalJourneyEntriesTable.$inferSelect;
export type NewCulturalJourneyEntry = typeof culturalJourneyEntriesTable.$inferInsert;

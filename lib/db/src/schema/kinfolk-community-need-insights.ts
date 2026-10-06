import { integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";

/**
 * An owner-facing threshold event. It intentionally has no member, session,
 * message, transcript, note, health, or location field. The owner can see only
 * a broad member-selected topic after enough distinct members ask for help.
 */
export const kinfolkCommunityNeedInsightsTable = pgTable(
  "kinfolk_community_need_insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: varchar("business_id", { length: 255 })
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    topicKey: varchar("topic_key", { length: 64 }).notNull(),
    threshold: integer("threshold").notNull().default(5),
    memberCount: integer("member_count").notNull().default(5),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    firstReachedAt: timestamp("first_reached_at", { withTimezone: true }).notNull().defaultNow(),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("kinfolk_community_need_insight_business_topic_threshold_unique").on(
      table.businessId,
      table.topicKey,
      table.threshold,
    ),
  ],
);

export type KinfolkCommunityNeedInsight = typeof kinfolkCommunityNeedInsightsTable.$inferSelect;

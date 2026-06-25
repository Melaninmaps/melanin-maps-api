import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const communitySignalsTable = pgTable(
  "community_signals",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id"),
    entityId: varchar("entity_id").notNull(),
    entityType: varchar("entity_type", {
      enum: ["business", "event", "creator", "neighborhood", "article", "collection", "journey", "challenge"],
    }).notNull(),
    signalType: varchar("signal_type", {
      enum: ["save", "view", "click", "review", "rsvp", "purchase", "list_add", "share", "follow", "journey_start", "step_complete"],
    }).notNull(),
    city: varchar("city", { length: 100 }),
    journeyType: varchar("journey_type", { length: 50 }),
    context: jsonb("context").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("community_signals_entity_idx").on(table.entityId, table.entityType),
    index("community_signals_city_signal_idx").on(table.city, table.signalType),
    index("community_signals_user_idx").on(table.userId),
    index("community_signals_journey_idx").on(table.journeyType, table.city),
  ],
);

export type CommunitySignal = typeof communitySignalsTable.$inferSelect;
export type InsertCommunitySignal = typeof communitySignalsTable.$inferInsert;

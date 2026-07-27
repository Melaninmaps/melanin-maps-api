import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const tripJournalsTable = pgTable("trip_journals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  cities: text("cities").array(),
  coverEmoji: text("cover_emoji").default("✈️"),
  isPublic: boolean("is_public").default(true).notNull(),
  savedCount: integer("saved_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TripJournal = typeof tripJournalsTable.$inferSelect;
export type NewTripJournal = typeof tripJournalsTable.$inferInsert;

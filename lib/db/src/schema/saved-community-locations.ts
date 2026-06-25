import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const savedCommunityLocationsTable = pgTable("saved_community_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  neighborhood: varchar("neighborhood", { length: 200 }),
  isMyComm: boolean("is_my_community").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SavedCommunityLocation = typeof savedCommunityLocationsTable.$inferSelect;
export type InsertSavedCommunityLocation = typeof savedCommunityLocationsTable.$inferInsert;

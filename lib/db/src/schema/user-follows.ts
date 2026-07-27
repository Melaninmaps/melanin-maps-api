import { pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userFollowsTable = pgTable(
  "user_follows",
  {
    id: serial("id").primaryKey(),
    followerId: varchar("follower_id").notNull(),
    followingId: varchar("following_id").notNull(),
    status: varchar("status", { enum: ["pending", "accepted"] }).notNull().default("accepted"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("user_follows_unique_idx").on(table.followerId, table.followingId)],
);

export type UserFollow = typeof userFollowsTable.$inferSelect;
export type InsertUserFollow = typeof userFollowsTable.$inferInsert;

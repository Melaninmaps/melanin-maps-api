import { pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

export const userHashtagFollowsTable = pgTable("user_hashtag_follows", {
  userId: varchar("user_id").notNull(),
  hashtag: varchar("hashtag", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.hashtag] })]);

export type UserHashtagFollow = typeof userHashtagFollowsTable.$inferSelect;

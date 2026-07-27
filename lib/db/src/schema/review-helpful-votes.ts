import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, unique } from "drizzle-orm/pg-core";

export const reviewHelpfulVotesTable = pgTable(
  "review_helpful_votes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    reviewId: varchar("review_id").notNull(),
    userId: varchar("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("review_helpful_votes_unique").on(table.reviewId, table.userId)],
);

export type ReviewHelpfulVote = typeof reviewHelpfulVotesTable.$inferSelect;

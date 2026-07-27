import { pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const threadReadsTable = pgTable("thread_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  postId: varchar("post_id").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.postId),
]);

export type ThreadRead = typeof threadReadsTable.$inferSelect;

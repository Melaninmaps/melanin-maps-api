import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const testerFeedbackTable = pgTable("tester_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // userId is nullable — feedback is stored even if session is invalidated
  userId: varchar("user_id"),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  expected: text("expected"),
  page: varchar("page", { length: 500 }),
  userAgent: varchar("user_agent", { length: 500 }),
  buildSha: varchar("build_sha", { length: 100 }),
  platform: varchar("platform", { length: 50 }).default("web"),
  status: varchar("status", { length: 50 }).default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

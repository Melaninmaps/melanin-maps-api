import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Short-lived, member-owned delivery state for a Kinfolk response.
 * This is deliberately separate from the session transcript: depth changes
 * apply to one answer, never to a user's entire conversation history.
 */
export const kinfolkAnswerPlansTable = pgTable("kinfolk_answer_plans", {
  id: uuid("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }),
  domainClass: varchar("domain_class", { length: 32 }).notNull(),
  isSensitive: boolean("is_sensitive").notNull().default(false),
  audienceBand: varchar("audience_band", { length: 16 }).notNull(),
  planJson: jsonb("plan_json").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KinfolkAnswerPlan = typeof kinfolkAnswerPlansTable.$inferSelect;
export type InsertKinfolkAnswerPlan = typeof kinfolkAnswerPlansTable.$inferInsert;
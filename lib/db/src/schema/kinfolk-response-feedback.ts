import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Member feedback on a Kinfolk answer, kept separate from feedback about an
 * individual recommended business. The table never stores the answer text.
 */
export const kinfolkResponseFeedbackTable = pgTable(
  "kinfolk_response_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 255 }),
    messageId: varchar("message_id", { length: 128 }).notNull(),
    reaction: varchar("reaction", { length: 16 }).notNull(),
    note: text("note"),
    intentClass: varchar("intent_class", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("kinfolk_response_feedback_user_message_unique").on(
      table.userId,
      table.messageId,
    ),
    index("kinfolk_response_feedback_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export type KinfolkResponseFeedback = typeof kinfolkResponseFeedbackTable.$inferSelect;
export type InsertKinfolkResponseFeedback = typeof kinfolkResponseFeedbackTable.$inferInsert;

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const safetyCheckinsTable = pgTable("safety_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  trustedContactName: varchar("trusted_contact_name", { length: 150 }).notNull(),
  // Legacy email Check-Ins retain their address. New in-app recipient Check-Ins
  // deliberately leave this null instead of storing a placeholder address.
  trustedContactEmail: varchar("trusted_contact_email", { length: 255 }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  note: text("note"),
  location: text("location"),
  city: varchar("city", { length: 100 }),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * A selected in-app recipient. trustedShareId refers to an existing accepted,
 * active Trusted Safety Share. The Check-In API never accepts a broad user ID
 * from the client as an emergency recipient.
 */
export const safetyCheckinRecipientsTable = pgTable(
  "safety_checkin_recipients",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    checkinId: integer("checkin_id")
      .notNull()
      .references(() => safetyCheckinsTable.id, { onDelete: "cascade" }),
    trustedShareId: varchar("trusted_share_id", { length: 36 }).notNull(),
    recipientUserId: varchar("recipient_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    recipientName: varchar("recipient_name", { length: 150 }).notNull(),
    notificationId: varchar("notification_id"),
    // These states record only durable in-app creation and provider submission
    // attempts. Neither is evidence that a device received the alert.
    deliveryStatus: varchar("delivery_status", {
      enum: [
        "pending",
        "in_app_created",
        "in_app_failed",
        "push_pending",
        "push_attempting",
        "push_failed",
        "push_submitted",
        "skipped",
      ],
    })
      .notNull()
      .default("pending"),
    inAppAttemptCount: integer("in_app_attempt_count").notNull().default(0),
    pushAttemptCount: integer("push_attempt_count").notNull().default(0),
    inAppAttemptedAt: timestamp("in_app_attempted_at", { withTimezone: true }),
    // The legacy notified_at field is retained for compatibility; this field is
    // the unambiguous timestamp for creation of the durable in-app record.
    inAppCreatedAt: timestamp("in_app_created_at", { withTimezone: true }),
    inAppFailedAt: timestamp("in_app_failed_at", { withTimezone: true }),
    pushAttemptedAt: timestamp("push_attempted_at", { withTimezone: true }),
    // A claim token prevents a stale worker from finalizing a newer retry.
    pushAttemptId: uuid("push_attempt_id"),
    pushSubmittedAt: timestamp("push_submitted_at", { withTimezone: true }),
    pushFailedAt: timestamp("push_failed_at", { withTimezone: true }),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    // Store a bounded internal code rather than provider or recipient details.
    lastErrorCode: varchar("last_error_code", { length: 80 }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("safety_checkin_recipients_checkin_share_idx").on(
      table.checkinId,
      table.trustedShareId,
    ),
    index("safety_checkin_recipients_pending_idx").on(
      table.checkinId,
      table.deliveryStatus,
      table.notifiedAt,
    ),
    index("safety_checkin_recipients_retry_idx").on(
      table.checkinId,
      table.deliveryStatus,
      table.nextRetryAt,
    ),
  ],
);

export type SafetyCheckin = typeof safetyCheckinsTable.$inferSelect;
export type SafetyCheckinRecipient = typeof safetyCheckinRecipientsTable.$inferSelect;

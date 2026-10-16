import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const meetupVerificationsTable = pgTable("meetup_verifications", {
  id: serial("id").primaryKey(),
  initiatorId: varchar("initiator_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  connectionId: integer("connection_id"),
  // City and public venue name only. Exact addresses and coordinates are not
  // accepted by the Meetup Verification flow.
  city: varchar("city", { length: 120 }),
  location: text("location"),
  scheduledFor: timestamp("scheduled_for"),
  note: text("note"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  initiatedAt: timestamp("initiated_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  declinedAt: timestamp("declined_at"),
  rescheduleRequestedAt: timestamp("reschedule_requested_at"),
  rescheduleNote: varchar("reschedule_note", { length: 300 }),
  consentAcknowledgedAt: timestamp("consent_acknowledged_at"),
  // Each participant explicitly acknowledges the other participant's current
  // identity-status signal. These are not verification results or safety scores.
  initiatorIdentityAcknowledgedAt: timestamp("initiator_identity_acknowledged_at"),
  initiatorIdentityStatusAcknowledged: varchar("initiator_identity_status_acknowledged", { length: 32 }),
  partnerIdentityAcknowledgedAt: timestamp("partner_identity_acknowledged_at"),
  partnerIdentityStatusAcknowledged: varchar("partner_identity_status_acknowledged", { length: 32 }),
  policyVersion: varchar("policy_version", { length: 64 }),
  expiresAt: timestamp("expires_at").notNull(),
  retentionDeleteAt: timestamp("retention_delete_at"),
  clearCode: varchar("clear_code", { length: 100 }),
  safetyWatcherId: varchar("safety_watcher_id").references(() => usersTable.id, { onDelete: "set null" }),
  safetyWatcherEmail: text("safety_watcher_email"),
  clearedAt: timestamp("cleared_at"),
  // Safety check-in fields (separate from the safety watcher — these alert a trusted friend, never the meetup partner)
  arrivalCheckAt: timestamp("arrival_check_at"),
  arrivalCheckedAt: timestamp("arrival_checked_at"),
  arrivalCheckStatus: varchar("arrival_check_status", { length: 20 }),
  arrivalAlertSentAt: timestamp("arrival_alert_sent_at"),
  homeCheckAt: timestamp("home_check_at"),
  homeCheckedAt: timestamp("home_checked_at"),
  homeCheckStatus: varchar("home_check_status", { length: 20 }),
  homeAlertSentAt: timestamp("home_alert_sent_at"),
  safetyFriendName: varchar("safety_friend_name", { length: 150 }),
  safetyFriendEmail: varchar("safety_friend_email", { length: 255 }),
});

export type MeetupVerification = typeof meetupVerificationsTable.$inferSelect;

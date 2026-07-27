import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const meetupVerificationsTable = pgTable("meetup_verifications", {
  id: serial("id").primaryKey(),
  initiatorId: varchar("initiator_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  partnerId: varchar("partner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  connectionId: integer("connection_id"),
  location: text("location"),
  note: text("note"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  initiatedAt: timestamp("initiated_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  expiresAt: timestamp("expires_at").notNull(),
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

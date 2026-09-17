import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
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
    deliveryStatus: varchar("delivery_status", {
      enum: ["pending", "delivered", "skipped"],
    })
      .notNull()
      .default("pending"),
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
  ],
);

export type SafetyCheckin = typeof safetyCheckinsTable.$inferSelect;
export type SafetyCheckinRecipient = typeof safetyCheckinRecipientsTable.$inferSelect;

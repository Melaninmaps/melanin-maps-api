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
});

export type MeetupVerification = typeof meetupVerificationsTable.$inferSelect;

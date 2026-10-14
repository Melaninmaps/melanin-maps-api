import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * APPROVAL REQUIRED — SOURCE ONLY. Manual, owner-only availability commitments.
 * Every member-entered label and time detail remains encrypted; the clear fields
 * retain only the generic placeholder and no external-calendar/provider state.
 */
export const kinfolkPrivateAvailabilityBlocksTable = pgTable("kinfolk_private_availability_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("[Encrypted private memory]"),
  encryptedLabel: text("encrypted_label").notNull(),
  labelEncryptionKeyId: varchar("label_encryption_key_id", { length: 64 }).notNull(),
  startAt: text("start_at").notNull().default("[Encrypted private memory]"),
  encryptedStartAt: text("encrypted_start_at").notNull(),
  startAtEncryptionKeyId: varchar("start_at_encryption_key_id", { length: 64 }).notNull(),
  endAt: text("end_at").notNull().default("[Encrypted private memory]"),
  encryptedEndAt: text("encrypted_end_at").notNull(),
  endAtEncryptionKeyId: varchar("end_at_encryption_key_id", { length: 64 }).notNull(),
  timeZone: text("time_zone").notNull().default("[Encrypted private memory]"),
  encryptedTimeZone: text("encrypted_time_zone").notNull(),
  timeZoneEncryptionKeyId: varchar("time_zone_encryption_key_id", { length: 64 }).notNull(),
  planningOptIn: boolean("planning_opt_in").notNull().default(false),
  memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("kinfolk_private_availability_blocks_owner_updated_idx").on(table.userId, table.updatedAt),
  check("kinfolk_private_availability_blocks_label_encrypted_check", sql`${table.label} = '[Encrypted private memory]'`),
  check("kinfolk_private_availability_blocks_start_at_encrypted_check", sql`${table.startAt} = '[Encrypted private memory]'`),
  check("kinfolk_private_availability_blocks_end_at_encrypted_check", sql`${table.endAt} = '[Encrypted private memory]'`),
  check("kinfolk_private_availability_blocks_time_zone_encrypted_check", sql`${table.timeZone} = '[Encrypted private memory]'`),
]);

export type KinfolkPrivateAvailabilityBlock = typeof kinfolkPrivateAvailabilityBlocksTable.$inferSelect;
export type InsertKinfolkPrivateAvailabilityBlock = typeof kinfolkPrivateAvailabilityBlocksTable.$inferInsert;

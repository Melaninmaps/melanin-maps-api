import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * A private, owner-only travel Trip. This intentionally contains no itinerary,
 * provider, calendar, flight, hotel, document, reminder, sharing, analytics,
 * chat-memory, address, coordinate, or recipient relation.
 */
export const kinfolkTripsTable = pgTable("kinfolk_trips", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("[Encrypted private memory]"),
  encryptedTitle: text("encrypted_title").notNull(),
  titleEncryptionKeyId: varchar("title_encryption_key_id", { length: 64 }).notNull(),
  destination: text("destination").notNull().default("[Encrypted private memory]"),
  encryptedDestination: text("encrypted_destination").notNull(),
  destinationEncryptionKeyId: varchar("destination_encryption_key_id", { length: 64 }).notNull(),
  note: text("note").notNull().default("[Encrypted private memory]"),
  encryptedNote: text("encrypted_note").notNull(),
  noteEncryptionKeyId: varchar("note_encryption_key_id", { length: 64 }).notNull(),
  memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("kinfolk_trips_owner_updated_idx").on(table.userId, table.updatedAt),
  // Supports composite owner-scoped foreign keys if a separately approved relation is ever added.
  index("kinfolk_trips_id_owner_idx").on(table.id, table.userId),
  check("kinfolk_trips_title_encrypted_check", sql`${table.title} = '[Encrypted private memory]'`),
  check("kinfolk_trips_destination_encrypted_check", sql`${table.destination} = '[Encrypted private memory]'`),
  check("kinfolk_trips_note_encrypted_check", sql`${table.note} = '[Encrypted private memory]'`),
]);

export type KinfolkTrip = typeof kinfolkTripsTable.$inferSelect;
export type InsertKinfolkTrip = typeof kinfolkTripsTable.$inferInsert;

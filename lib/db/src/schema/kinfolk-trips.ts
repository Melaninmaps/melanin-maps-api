import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
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
  // Matches the approved Trip migration and anchors the owner-scoped child relation.
  uniqueIndex("kinfolk_trips_id_owner_key").on(table.id, table.userId),
  check("kinfolk_trips_title_encrypted_check", sql`${table.title} = '[Encrypted private memory]'`),
  check("kinfolk_trips_destination_encrypted_check", sql`${table.destination} = '[Encrypted private memory]'`),
  check("kinfolk_trips_note_encrypted_check", sql`${table.note} = '[Encrypted private memory]'`),
]);

export type KinfolkTrip = typeof kinfolkTripsTable.$inferSelect;
export type InsertKinfolkTrip = typeof kinfolkTripsTable.$inferInsert;

/**
 * A private, manual day-by-day organizer. All member-authored display content,
 * including the date/time labels, remains encrypted; only durable owner-scoped
 * ordering metadata is stored in the clear. There are no location fields.
 */
export const kinfolkTripItineraryEntriesTable = pgTable("kinfolk_trip_itinerary_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid("trip_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  dayLabel: text("day_label").notNull().default("[Encrypted private memory]"),
  encryptedDayLabel: text("encrypted_day_label").notNull(),
  dayLabelEncryptionKeyId: varchar("day_label_encryption_key_id", { length: 64 }).notNull(),
  dayOrder: integer("day_order").notNull(),
  startTimeLabel: text("start_time_label").notNull().default("[Encrypted private memory]"),
  encryptedStartTimeLabel: text("encrypted_start_time_label").notNull(),
  startTimeLabelEncryptionKeyId: varchar("start_time_label_encryption_key_id", { length: 64 }).notNull(),
  endTimeLabel: text("end_time_label").notNull().default("[Encrypted private memory]"),
  encryptedEndTimeLabel: text("encrypted_end_time_label").notNull(),
  endTimeLabelEncryptionKeyId: varchar("end_time_label_encryption_key_id", { length: 64 }).notNull(),
  title: text("title").notNull().default("[Encrypted private memory]"),
  encryptedTitle: text("encrypted_title").notNull(),
  titleEncryptionKeyId: varchar("title_encryption_key_id", { length: 64 }).notNull(),
  note: text("note").notNull().default("[Encrypted private memory]"),
  encryptedNote: text("encrypted_note").notNull(),
  noteEncryptionKeyId: varchar("note_encryption_key_id", { length: 64 }).notNull(),
  memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.tripId, table.userId],
    foreignColumns: [kinfolkTripsTable.id, kinfolkTripsTable.userId],
    name: "kinfolk_trip_itinerary_entries_owner_trip_fk",
  }).onDelete("cascade"),
  uniqueIndex("kinfolk_trip_itinerary_entries_trip_order_key").on(table.tripId, table.dayOrder),
  index("kinfolk_trip_itinerary_entries_owner_trip_order_idx").on(table.userId, table.tripId, table.dayOrder, table.createdAt, table.id),
  check("kinfolk_trip_itinerary_entries_day_label_encrypted_check", sql`${table.dayLabel} = '[Encrypted private memory]'`),
  check("kinfolk_trip_itinerary_entries_start_time_label_encrypted_check", sql`${table.startTimeLabel} = '[Encrypted private memory]'`),
  check("kinfolk_trip_itinerary_entries_end_time_label_encrypted_check", sql`${table.endTimeLabel} = '[Encrypted private memory]'`),
  check("kinfolk_trip_itinerary_entries_title_encrypted_check", sql`${table.title} = '[Encrypted private memory]'`),
  check("kinfolk_trip_itinerary_entries_note_encrypted_check", sql`${table.note} = '[Encrypted private memory]'`),
  check("kinfolk_trip_itinerary_entries_day_order_check", sql`${table.dayOrder} >= 1`),
]);

export type KinfolkTripItineraryEntry = typeof kinfolkTripItineraryEntriesTable.$inferSelect;
export type InsertKinfolkTripItineraryEntry = typeof kinfolkTripItineraryEntriesTable.$inferInsert;

import { foreignKey, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { kinfolkTripsTable } from "./kinfolk-trips";

export const travelFlights = pgTable("travel_flights", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  // Legacy plaintext rows may remain unlinked until an explicit member correction.
  tripId: uuid("trip_id"),
  // Keep established column limits intact. New encrypted writes use a short
  // generic marker that fits the narrowest legacy column rather than widening
  // or rewriting member records.
  flightNumber: varchar("flight_number", { length: 20 }).notNull(),
  encryptedFlightNumber: text("encrypted_flight_number"),
  flightNumberEncryptionKeyId: varchar("flight_number_encryption_key_id", { length: 64 }),
  airline: varchar("airline", { length: 100 }),
  encryptedAirline: text("encrypted_airline"),
  airlineEncryptionKeyId: varchar("airline_encryption_key_id", { length: 64 }),
  departureDate: varchar("departure_date", { length: 10 }).notNull(),
  encryptedDepartureDate: text("encrypted_departure_date"),
  departureDateEncryptionKeyId: varchar("departure_date_encryption_key_id", { length: 64 }),
  origin: varchar("origin", { length: 10 }),
  encryptedOrigin: text("encrypted_origin"),
  originEncryptionKeyId: varchar("origin_encryption_key_id", { length: 64 }),
  destination: varchar("destination", { length: 10 }),
  encryptedDestination: text("encrypted_destination"),
  destinationEncryptionKeyId: varchar("destination_encryption_key_id", { length: 64 }),
  notes: text("notes"),
  encryptedNotes: text("encrypted_notes"),
  notesEncryptionKeyId: varchar("notes_encryption_key_id", { length: 64 }),
  memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  // The composite relationship prevents a member from attaching a flight to another owner's Trip.
  // The approved SQL migration uses PostgreSQL's column-list `ON DELETE SET NULL
  // (trip_id)` action so deleting a Trip detaches its flights without nulling the
  // non-null owner. Drizzle's DSL cannot represent that column list safely here.
  foreignKey({
    columns: [table.tripId, table.userId],
    foreignColumns: [kinfolkTripsTable.id, kinfolkTripsTable.userId],
    name: "travel_flights_owner_trip_fk",
  }),
]);

export type TravelFlight = typeof travelFlights.$inferSelect;
export type InsertTravelFlight = typeof travelFlights.$inferInsert;

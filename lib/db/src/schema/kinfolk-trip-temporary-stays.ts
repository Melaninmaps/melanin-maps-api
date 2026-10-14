import { sql } from "drizzle-orm";
import { foreignKey, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { kinfolkTemporaryStaysTable } from "./kinfolk-temporary-stays";
import { kinfolkTripsTable } from "./kinfolk-trips";

/**
 * APPROVAL REQUIRED — SOURCE ONLY. A deliberately confirmed, owner-only reference
 * between an existing private Trip and an existing Temporary Stay. This relation
 * stores no location/address/coordinates, encrypted payload, provider result,
 * booking identifier, or itinerary content.
 */
export const kinfolkTripTemporaryStaysTable = pgTable("kinfolk_trip_temporary_stays", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: uuid("trip_id").notNull(),
  temporaryStayId: uuid("temporary_stay_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.tripId, table.userId],
    foreignColumns: [kinfolkTripsTable.id, kinfolkTripsTable.userId],
    name: "kinfolk_trip_temporary_stays_owner_trip_fk",
  }).onDelete("cascade"),
  // Requires the additive (id, user_id) unique declaration on Temporary Stays.
  foreignKey({
    columns: [table.temporaryStayId, table.userId],
    foreignColumns: [kinfolkTemporaryStaysTable.id, kinfolkTemporaryStaysTable.userId],
    name: "kinfolk_trip_temporary_stays_owner_temporary_stay_fk",
  }).onDelete("cascade"),
  uniqueIndex("kinfolk_trip_temporary_stays_trip_stay_key").on(table.tripId, table.temporaryStayId),
  index("kinfolk_trip_temporary_stays_owner_trip_idx").on(table.userId, table.tripId, table.createdAt),
]);

export type KinfolkTripTemporaryStay = typeof kinfolkTripTemporaryStaysTable.$inferSelect;
export type InsertKinfolkTripTemporaryStay = typeof kinfolkTripTemporaryStaysTable.$inferInsert;

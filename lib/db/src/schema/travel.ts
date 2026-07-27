import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const travelFlights = pgTable("travel_flights", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  flightNumber: varchar("flight_number", { length: 20 }).notNull(),
  airline: varchar("airline", { length: 100 }),
  departureDate: varchar("departure_date", { length: 10 }).notNull(),
  origin: varchar("origin", { length: 10 }),
  destination: varchar("destination", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TravelFlight = typeof travelFlights.$inferSelect;
export type InsertTravelFlight = typeof travelFlights.$inferInsert;

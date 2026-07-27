import { numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userLocationsTable = pgTable("user_locations", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserLocation = typeof userLocationsTable.$inferSelect;

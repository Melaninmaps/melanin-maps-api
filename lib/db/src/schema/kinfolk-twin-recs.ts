import { pgTable, serial, varchar, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

export const kinfolkTwinRecsTable = pgTable("kinfolk_twin_recs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  businessId: varchar("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  score: real("score").notNull().default(0),
  twinCount: integer("twin_count").notNull().default(1),
  twinCities: jsonb("twin_cities").$type<string[]>().default([]),
  reason: varchar("reason", { length: 255 }),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KinfolkTwinRec = typeof kinfolkTwinRecsTable.$inferSelect;

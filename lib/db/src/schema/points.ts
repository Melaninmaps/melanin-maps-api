import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const POINTS_VALUES = {
  review: 10,
  checkin: 5,
  survey: 15,
  referral: 25,
} as const;

export type PointsAction = keyof typeof POINTS_VALUES;

export const pointsLedgerTable = pgTable("points_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  points: integer("points").notNull(),
  entityId: varchar("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPointsEntrySchema = createInsertSchema(pointsLedgerTable).omit({
  id: true,
  createdAt: true,
});

export const selectPointsEntrySchema = createSelectSchema(pointsLedgerTable);

export type PointsEntry = typeof pointsLedgerTable.$inferSelect;
export type InsertPointsEntry = z.infer<typeof insertPointsEntrySchema>;

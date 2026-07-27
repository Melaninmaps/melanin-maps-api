import { boolean, numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checkInsTable = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessId: varchar("business_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // ── GPS verification ──────────────────────────────────────────────────────
  userLat: numeric("user_lat", { precision: 10, scale: 7 }),
  userLng: numeric("user_lng", { precision: 10, scale: 7 }),
  verifiedLocation: boolean("verified_location").notNull().default(false),
});

export const insertCheckInSchema = createInsertSchema(checkInsTable).omit({
  id: true,
  createdAt: true,
});

export const selectCheckInSchema = createSelectSchema(checkInsTable);

export type CheckIn = typeof checkInsTable.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

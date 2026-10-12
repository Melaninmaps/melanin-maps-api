import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Legacy physical user_lat/user_lng columns are intentionally not mapped here.
 * They remain retained in existing databases for non-destructive audit purposes,
 * but application code cannot select, return, or write them.
 */
export const checkInsTable = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessId: varchar("business_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedLocation: boolean("verified_location").notNull().default(false),
});

export const insertCheckInSchema = createInsertSchema(checkInsTable).omit({
  id: true,
  createdAt: true,
});

export const selectCheckInSchema = createSelectSchema(checkInsTable);

export type CheckIn = typeof checkInsTable.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

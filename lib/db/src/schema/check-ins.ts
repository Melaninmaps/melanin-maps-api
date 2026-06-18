import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checkInsTable = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessId: varchar("business_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCheckInSchema = createInsertSchema(checkInsTable).omit({
  id: true,
  createdAt: true,
});

export const selectCheckInSchema = createSelectSchema(checkInsTable);

export type CheckIn = typeof checkInsTable.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

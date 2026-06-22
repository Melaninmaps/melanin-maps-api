import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashDealsTable = pgTable("flash_deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
  discountText: varchar("discount_text", { length: 60 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlashDealSchema = createInsertSchema(flashDealsTable).omit({ id: true, createdAt: true });
export const selectFlashDealSchema = createSelectSchema(flashDealsTable);

export type FlashDeal = typeof flashDealsTable.$inferSelect;
export type InsertFlashDeal = z.infer<typeof insertFlashDealSchema>;

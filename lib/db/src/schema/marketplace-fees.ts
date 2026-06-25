import { boolean, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const marketplaceFeeConfigTable = pgTable("marketplace_fee_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tier: varchar("tier", { length: 20 }).notNull().unique(), // community | growth | premium
  tierLabel: varchar("tier_label", { length: 50 }).notNull(),
  standardFee: numeric("standard_fee", { precision: 5, scale: 4 }).notNull().default("0.1000"),
  promotionalFee: numeric("promotional_fee", { precision: 5, scale: 4 }).notNull().default("0.0700"),
  foundingFee: numeric("founding_fee", { precision: 5, scale: 4 }).notNull().default("0.0500"),
  promoActive: boolean("promo_active").notNull().default(false),
  promoStartDate: timestamp("promo_start_date", { withTimezone: true }),
  promoEndDate: timestamp("promo_end_date", { withTimezone: true }),
  promoDescription: varchar("promo_description", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 100 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  notes: text("notes"),
});

export type MarketplaceFeeConfig = typeof marketplaceFeeConfigTable.$inferSelect;

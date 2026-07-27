import { sql } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const businessPromotionsTable = pgTable("business_promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  type: varchar("type", {
    enum: [
      "priority_search",
      "category_featured",
      "city_featured",
      "cultural_spotlight",
      "event_featured",
      "grand_opening",
      "new_location",
      "anniversary",
      "product_launch",
      "hiring",
      "seasonal_sale",
      "event_promo",
      "community_event",
      "local_cause",
      "giveaway",
      "launch_package",
      "community_spotlight",
    ],
  }).notNull(),
  status: varchar("status", {
    enum: ["pending", "active", "expired", "cancelled"],
  }).notNull().default("pending"),
  targetCategory: varchar("target_category"),
  targetCity: varchar("target_city"),
  targetNeighborhood: varchar("target_neighborhood"),
  targetEvent: varchar("target_event"),
  campaignLabel: varchar("campaign_label"),
  campaignNote: varchar("campaign_note", { length: 500 }),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  stripeSessionId: varchar("stripe_session_id"),
  priceUsdCents: integer("price_usd_cents"),
  durationDays: integer("duration_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type BusinessPromotion = typeof businessPromotionsTable.$inferSelect;
export type InsertBusinessPromotion = typeof businessPromotionsTable.$inferInsert;
export type PromotionType = BusinessPromotion["type"];

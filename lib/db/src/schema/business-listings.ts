import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const businessListingsTable = pgTable("business_listings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: varchar("business_id").notNull(),
  stripeProductId: varchar("stripe_product_id"),
  stripePriceId: varchar("stripe_price_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceInCents: integer("price_in_cents").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("usd"),
  imageUrl: varchar("image_url", { length: 512 }),
  category: varchar("category", { length: 100 }),
  listingType: varchar("listing_type", {
    enum: ["physical", "digital", "event_ticket", "gift_card", "service"],
  }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBusinessListingSchema = createInsertSchema(businessListingsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectBusinessListingSchema = createSelectSchema(businessListingsTable);
export type BusinessListing = typeof businessListingsTable.$inferSelect;
export type NewBusinessListing = typeof businessListingsTable.$inferInsert;

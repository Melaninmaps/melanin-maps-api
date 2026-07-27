import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const familyAiUsageTable = pgTable("family_ai_usage", {
  circleId: varchar("circle_id", { length: 255 }).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(),
  requestsUsed: integer("requests_used").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const familyAddOnSeatsTable = pgTable("family_add_on_seats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id", { length: 255 }).notNull(),
  stripeSubscriptionItemId: varchar("stripe_subscription_item_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  seatCount: integer("seat_count").notNull().default(1),
  status: varchar("status", { length: 30 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type FamilyAiUsage = typeof familyAiUsageTable.$inferSelect;
export type FamilyAddOnSeat = typeof familyAddOnSeatsTable.$inferSelect;

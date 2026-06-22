import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const REDEMPTION_REWARDS = [
  { id: "free_month", title: "1 Month Free Membership", pointsCost: 500, description: "Upgrade or extend your membership by one month, on us." },
  { id: "featured_badge", title: "Featured Explorer Badge", pointsCost: 200, description: "Show off a special badge on your community profile for 30 days." },
  { id: "city_guide", title: "Premium City Guide PDF", pointsCost: 150, description: "Download an AI-curated Mapping with Melanin™ city guide." },
  { id: "partner_discount", title: "10% Partner Discount", pointsCost: 100, description: "One-time 10% discount code for a partner business of your choice." },
] as const;

export const pointsRedemptionsTable = pgTable("points_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  rewardId: varchar("reward_id", { length: 60 }).notNull(),
  rewardTitle: varchar("reward_title", { length: 120 }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
});

export const insertPointsRedemptionSchema = createInsertSchema(pointsRedemptionsTable).omit({ id: true, createdAt: true, fulfilledAt: true });
export const selectPointsRedemptionSchema = createSelectSchema(pointsRedemptionsTable);

export type PointsRedemption = typeof pointsRedemptionsTable.$inferSelect;
export type InsertPointsRedemption = z.infer<typeof insertPointsRedemptionSchema>;

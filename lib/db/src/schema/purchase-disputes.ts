import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const purchaseDisputesTable = pgTable("purchase_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessId: varchar("business_id").notNull(),
  listingId: varchar("listing_id"),
  stripeSessionId: varchar("stripe_session_id"),
  disputeType: varchar("dispute_type", {
    enum: ["not_received", "not_as_described", "fraud", "defective", "other"],
  }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", {
    enum: ["open", "investigating", "resolved", "rejected"],
  }).notNull().default("open"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PurchaseDispute = typeof purchaseDisputesTable.$inferSelect;
export type InsertPurchaseDispute = typeof purchaseDisputesTable.$inferInsert;

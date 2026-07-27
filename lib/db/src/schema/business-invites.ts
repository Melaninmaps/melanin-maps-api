import { pgTable, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessInvitesTable = pgTable("business_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id"),
  invitedByUserId: varchar("invited_by_user_id"),
  businessId: varchar("business_id"),
  businessName: varchar("business_name", { length: 255 }),
  socialHandle: varchar("social_handle", { length: 100 }).notNull(),
  socialPlatform: varchar("social_platform", { length: 30 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  trialStartDate: timestamp("trial_start_date", { withTimezone: true }).notNull().defaultNow(),
  trialEndDate: timestamp("trial_end_date", { withTimezone: true }).notNull().default(sql`now() + interval '60 days'`),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessInviteSchema = createInsertSchema(businessInvitesTable).omit({
  id: true,
  createdAt: true,
  trialStartDate: true,
  trialEndDate: true,
});

export const selectBusinessInviteSchema = createSelectSchema(businessInvitesTable);

export type BusinessInviteRow = typeof businessInvitesTable.$inferSelect;
export type InsertBusinessInvite = z.infer<typeof insertBusinessInviteSchema>;

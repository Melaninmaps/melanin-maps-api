import { boolean, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type OwnerOnboardingOffering = {
  name: string;
  detail: string;
};

export type OwnerOnboardingPricing = {
  model: "not_listed" | "starting_at" | "range" | "contact_for_quote";
  detail: string;
};

export type OwnerOnboardingAvailability = {
  useWeeklySchedule: boolean;
  note: string;
};

export type OwnerOnboardingMedia = {
  confirmedRights: boolean;
  confirmedReview: boolean;
};

export type OwnerOnboardingCommunication = {
  channels: Array<"email" | "phone" | "website" | "social">;
  responseWindow: string;
};

/**
 * Private, owner-scoped launch-checklist data. This table deliberately does
 * not alter the public business row, the directory, media storage, payments,
 * or member messaging. An owner must deliberately edit the existing public
 * profile surfaces to make any public change.
 */
export const businessOwnerOnboardingTable = pgTable("business_owner_onboarding", {
  businessId: varchar("business_id", { length: 255 }).primaryKey(),
  lastUpdatedByUserId: varchar("last_updated_by_user_id", { length: 255 }).notNull(),
  identityReviewed: boolean("identity_reviewed").notNull().default(false),
  offerings: jsonb("offerings").$type<OwnerOnboardingOffering[]>().notNull().default(sql`'[]'::jsonb`),
  pricing: jsonb("pricing").$type<OwnerOnboardingPricing>().notNull().default(sql`'{"model":"not_listed","detail":""}'::jsonb`),
  availability: jsonb("availability").$type<OwnerOnboardingAvailability>().notNull().default(sql`'{"useWeeklySchedule":false,"note":""}'::jsonb`),
  media: jsonb("media").$type<OwnerOnboardingMedia>().notNull().default(sql`'{"confirmedRights":false,"confirmedReview":false}'::jsonb`),
  communication: jsonb("communication").$type<OwnerOnboardingCommunication>().notNull().default(sql`'{"channels":[],"responseWindow":""}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessOwnerOnboarding = typeof businessOwnerOnboardingTable.$inferSelect;

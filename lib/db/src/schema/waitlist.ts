import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const waitlistTable = pgTable("waitlist_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  isBusinessOwner: boolean("is_business_owner").notNull().default(false),
  websiteUrl: varchar("website_url", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  referralCode: varchar("referral_code", { length: 20 }),
  referredBy: varchar("referred_by", { length: 20 }),
  familyGroupId: varchar("family_group_id", { length: 36 }),
  notes: text("notes"),
  cityNomination: varchar("city_nomination", { length: 150 }),
  welcomeEmailSent: boolean("welcome_email_sent").notNull().default(false),
  launchEmailSent: boolean("launch_email_sent").notNull().default(false),
  betaEmailSent: boolean("beta_email_sent").notNull().default(false),
  approvedAt: timestamp("approved_at"),
  lastNudgeSentAt: timestamp("last_nudge_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  importBatchId: varchar("import_batch_id", { length: 100 }),
  previewChoice: varchar("preview_choice", { length: 50 }),
  niche: varchar("niche", { length: 100 }),
  platforms: text("platforms"),
  safetyPriorities: text("safety_priorities"),
});

export type WaitlistEntry = typeof waitlistTable.$inferSelect;

export const businessSuggestionsTable = pgTable("business_suggestions", {
  id: serial("id").primaryKey(),
  waitlistId: varchar("waitlist_id", { length: 36 }).references(() => waitlistTable.id),
  referralCode: varchar("referral_code", { length: 50 }),
  businessName: varchar("business_name", { length: 255 }),
  category: varchar("category", { length: 100 }),
  city: varchar("city", { length: 100 }),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlistSafetyReportsTable = pgTable("waitlist_safety_reports", {
  id: serial("id").primaryKey(),
  waitlistId: varchar("waitlist_id", { length: 36 }).references(() => waitlistTable.id),
  referralCode: varchar("referral_code", { length: 50 }),
  concernType: varchar("concern_type", { length: 100 }),
  description: text("description"),
  city: varchar("city", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BusinessSuggestion = typeof businessSuggestionsTable.$inferSelect;
export type WaitlistSafetyReport = typeof waitlistSafetyReportsTable.$inferSelect;

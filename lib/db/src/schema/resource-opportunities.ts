import { pgTable, text, varchar, boolean, integer, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "job",
  "housing",
  "scholarship",
  "grant",
  "training",
  "volunteer",
  "other",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "active",
  "expired",
  "filled",
  "removed",
]);

export const opportunitySourceTierEnum = pgEnum("opportunity_source_tier", [
  "community_shared",
  "source_confirmed",
  "organization_confirmed",
  "mwm_reviewed",
]);

export const resourceOpportunitiesTable = pgTable("resource_opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  submittedByUserId: text("submitted_by_user_id"),
  type: opportunityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  organization: varchar("organization", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  isRemote: boolean("is_remote").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(false),
  description: text("description"),
  payRange: varchar("pay_range", { length: 100 }),
  scheduleType: varchar("schedule_type", { length: 50 }),
  leaseLength: varchar("lease_length", { length: 100 }),
  rent: varchar("rent", { length: 50 }),
  bedrooms: integer("bedrooms"),
  bathrooms: varchar("bathrooms", { length: 20 }),
  applicationLink: text("application_link"),
  contactMethod: varchar("contact_method", { length: 200 }),
  deadline: timestamp("deadline"),
  availableDate: timestamp("available_date"),
  submitterRole: varchar("submitter_role", { length: 50 }),
  isPubliclyPosted: boolean("is_publicly_posted").default(false),
  isSecondChance: boolean("is_second_chance").default(false),
  accessibilityFeatures: text("accessibility_features"),
  benefits: text("benefits"),
  personalNote: text("personal_note"),
  sourceTier: opportunitySourceTierEnum("opportunity_source_tier").notNull().default("community_shared"),
  status: opportunityStatusEnum("opportunity_status").notNull().default("active"),
  reportCount: integer("report_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  lastConfirmedAt: timestamp("last_confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ResourceOpportunity = typeof resourceOpportunitiesTable.$inferSelect;
export type InsertResourceOpportunity = typeof resourceOpportunitiesTable.$inferInsert;

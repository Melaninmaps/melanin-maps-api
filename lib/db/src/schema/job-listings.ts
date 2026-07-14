import { boolean, jsonb, numeric, pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Job types: full_time | part_time | contract | gig | internship | volunteer | collaboration
// payType: hourly | salary | fixed | unpaid
// status: active | filled | paused | expired

export const jobListingsTable = pgTable("job_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessId: varchar("business_id"),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("full_time"),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  isRemote: boolean("is_remote").notNull().default(false),
  isHybrid: boolean("is_hybrid").notNull().default(false),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  description: text("description").notNull(),
  requirements: text("requirements"),
  // Legacy varchar salary kept for compat — prefer payMin/payMax/payType
  salary: varchar("salary", { length: 100 }),
  payMin: numeric("pay_min", { precision: 10, scale: 2 }),
  payMax: numeric("pay_max", { precision: 10, scale: 2 }),
  payType: varchar("pay_type", { length: 20 }), // hourly | salary | fixed | unpaid
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  applicationUrl: varchar("application_url", { length: 500 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  postedById: varchar("posted_by_id"),
  postedByName: varchar("posted_by_name", { length: 200 }),
  industry: varchar("industry", { length: 100 }),
  isPersonalReferral: boolean("is_personal_referral").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertJobListingSchema = createInsertSchema(jobListingsTable).omit({ id: true, createdAt: true });
export const selectJobListingSchema = createSelectSchema(jobListingsTable);
export type JobListing = typeof jobListingsTable.$inferSelect;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;

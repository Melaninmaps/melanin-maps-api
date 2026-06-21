import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobListingsTable = pgTable("job_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessId: varchar("business_id"),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("full-time"),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  salary: varchar("salary", { length: 100 }),
  applicationUrl: varchar("application_url", { length: 500 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  postedById: varchar("posted_by_id"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertJobListingSchema = createInsertSchema(jobListingsTable).omit({ id: true, createdAt: true });
export const selectJobListingSchema = createSelectSchema(jobListingsTable);
export type JobListing = typeof jobListingsTable.$inferSelect;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;

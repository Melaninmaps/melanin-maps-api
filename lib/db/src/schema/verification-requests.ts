import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, text, integer } from "drizzle-orm/pg-core";

export const verificationRequestsTable = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submitterId: varchar("submitter_id"),
  businessName: varchar("business_name").notNull(),
  businessType: varchar("business_type", {
    enum: ["restaurant", "retail", "salon", "health", "professional_services", "entertainment", "tech", "nonprofit", "other"],
  }).notNull(),
  ownerName: varchar("owner_name").notNull(),
  websiteUrl: varchar("website_url"),
  instagramHandle: varchar("instagram_handle"),
  yearsInBusiness: integer("years_in_business"),
  city: varchar("city"),
  state: varchar("state"),
  message: text("message"),
  submitterEmail: varchar("submitter_email").notNull(),
  status: varchar("status", { enum: ["pending", "under_review", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type VerificationRequest = typeof verificationRequestsTable.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequestsTable.$inferInsert;

import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, text, integer, boolean } from "drizzle-orm/pg-core";

export const verificationRequestsTable = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submitterId: varchar("submitter_id"),
  businessId: varchar("business_id"),
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

  // Level 2: Ownership Verification
  verificationLevel: varchar("verification_level", {
    enum: ["basic", "ownership", "certified"],
  }).notNull().default("basic"),
  ownershipPercentage: integer("ownership_percentage"),
  einNumber: varchar("ein_number"),
  documentsProvided: text("documents_provided"),  // JSON array of doc-type strings
  documentUrls: text("document_urls"),  // JSON array of {type, name, url, size} objects
  businessLicenseProvided: boolean("business_license_provided").default(false),

  // Level 3: Third-Party Certification
  certificationOrg: varchar("certification_org"),
  certificationUrl: varchar("certification_url"),
  certificationNumber: varchar("certification_number"),

  status: varchar("status", { enum: ["pending", "under_review", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type VerificationRequest = typeof verificationRequestsTable.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequestsTable.$inferInsert;

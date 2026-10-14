import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessClaimsTable = pgTable("business_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  userId: varchar("user_id"),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: varchar("role", { length: 50 }).default("owner"),
  claimType: varchar("claim_type", { length: 64 }).notNull().default("ownership_control"),
  verificationMethod: varchar("verification_method", { length: 64 }),
  evidenceUrl: varchar("evidence_url", { length: 500 }),
  evidenceSummary: varchar("evidence_summary", { length: 255 }),
  attestedAt: timestamp("attested_at", { withTimezone: true }),
  decisionReason: varchar("decision_reason", { length: 1000 }),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  website: varchar("website", { length: 255 }),
  instagramHandle: varchar("instagram_handle", { length: 100 }),
  additionalInfo: text("additional_info"),
  status: varchar("status", { length: 20 }).default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessClaimSchema = createInsertSchema(businessClaimsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectBusinessClaimSchema = createSelectSchema(businessClaimsTable);

export type BusinessClaimRow = typeof businessClaimsTable.$inferSelect;
export type InsertBusinessClaim = z.infer<typeof insertBusinessClaimSchema>;

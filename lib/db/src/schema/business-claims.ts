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

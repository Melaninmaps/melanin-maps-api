import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const identityVerificationsTable = pgTable("identity_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: varchar("reviewed_by"),
});

export type IdentityVerification = typeof identityVerificationsTable.$inferSelect;
export type InsertIdentityVerification = typeof identityVerificationsTable.$inferInsert;

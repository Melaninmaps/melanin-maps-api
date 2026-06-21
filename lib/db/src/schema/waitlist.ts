import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const waitlistTable = pgTable("waitlist_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  isBusinessOwner: boolean("is_business_owner").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  referralCode: varchar("referral_code", { length: 20 }),
  referredBy: varchar("referred_by", { length: 20 }),
  notes: text("notes"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WaitlistEntry = typeof waitlistTable.$inferSelect;

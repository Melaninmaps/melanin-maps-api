import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const waitlistTable = pgTable("waitlist_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  referralCode: varchar("referral_code", { length: 20 }),
  referredBy: varchar("referred_by", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

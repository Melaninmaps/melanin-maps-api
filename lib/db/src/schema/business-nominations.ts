import { pgTable, varchar, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

export const businessNominationsTable = pgTable("business_nominations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nominatedByUserId: varchar("nominated_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  nominatorEmail: varchar("nominator_email", { length: 255 }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  website: varchar("website", { length: 255 }),
  ownerName: varchar("owner_name", { length: 255 }),
  ownerContact: varchar("owner_contact", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  matchedBusinessId: varchar("matched_business_id").references(() => businessesTable.id, { onDelete: "set null" }),
  referralCredited: boolean("referral_credited").notNull().default(false),
  blackOwned: boolean("black_owned").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessNomination = typeof businessNominationsTable.$inferSelect;
export type InsertBusinessNomination = typeof businessNominationsTable.$inferInsert;

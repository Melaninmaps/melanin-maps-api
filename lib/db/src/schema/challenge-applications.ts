import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const challengeApplications = pgTable("challenge_applications", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id", { length: 100 }).notNull(),
  businessName: text("business_name").notNull(),
  businessCity: varchar("business_city", { length: 80 }),
  businessCategory: varchar("business_category", { length: 80 }),
  challengeId: varchar("challenge_id", { length: 60 }).notNull(),
  challengeName: text("challenge_name").notNull(),
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

export type ChallengeApplication = typeof challengeApplications.$inferSelect;
export type NewChallengeApplication = typeof challengeApplications.$inferInsert;

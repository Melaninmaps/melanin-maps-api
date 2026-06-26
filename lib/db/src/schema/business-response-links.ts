import { pgTable, serial, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const businessResponseLinksTable = pgTable("business_response_links", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  reportId: varchar("report_id").notNull(),
  reportCategory: varchar("report_category", { length: 64 }),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  businessEmail: varchar("business_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  responseStatement: text("response_statement"),
  correctiveActions: text("corrective_actions"),
  trustPlan: text("trust_plan"),
  disputesFacts: boolean("disputes_facts").default(false),
  disputeDetails: text("dispute_details"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

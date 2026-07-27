import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const flaggedOfficersTable = pgTable("flagged_officers", {
  id: serial("id").primaryKey(),
  officerName: varchar("officer_name", { length: 200 }).notNull(),
  badgeNumber: varchar("badge_number", { length: 50 }),
  department: varchar("department", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  offenseType: varchar("offense_type", { length: 100 }),
  offenseDescription: text("offense_description").notNull(),
  offenseDate: varchar("offense_date", { length: 50 }),
  sourceUrl: text("source_url"),
  status: varchar("status", { enum: ["pending", "verified", "rejected"] }).notNull().default("pending"),
  submittedBy: varchar("submitted_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officerTransfersTable = pgTable("officer_transfers", {
  id: serial("id").primaryKey(),
  officerId: serial("officer_id").references(() => flaggedOfficersTable.id, { onDelete: "cascade" }),
  fromDepartment: varchar("from_department", { length: 200 }),
  fromCity: varchar("from_city", { length: 100 }),
  fromState: varchar("from_state", { length: 100 }),
  toDepartment: varchar("to_department", { length: 200 }).notNull(),
  toCity: varchar("to_city", { length: 100 }).notNull(),
  toState: varchar("to_state", { length: 100 }).notNull(),
  transferDate: varchar("transfer_date", { length: 50 }),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  status: varchar("status", { enum: ["pending", "verified"] }).notNull().default("pending"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  submittedBy: varchar("submitted_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FlaggedOfficer = typeof flaggedOfficersTable.$inferSelect;
export type OfficerTransfer = typeof officerTransfersTable.$inferSelect;

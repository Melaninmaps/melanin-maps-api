import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const safetyCheckinsTable = pgTable("safety_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  trustedContactName: varchar("trusted_contact_name", { length: 150 }).notNull(),
  trustedContactEmail: varchar("trusted_contact_email", { length: 255 }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  note: text("note"),
  location: text("location"),
  city: varchar("city", { length: 100 }),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SafetyCheckin = typeof safetyCheckinsTable.$inferSelect;

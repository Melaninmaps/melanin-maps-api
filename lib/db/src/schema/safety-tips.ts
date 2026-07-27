import { boolean, integer, pgTable, real, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const safetyTipsTable = pgTable("safety_tips", {
  id: serial("id").primaryKey(),
  submittedById: varchar("submitted_by_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  businessName: varchar("business_name", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("violence"),
  confirmationCount: integer("confirmation_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  alertsSent: boolean("alerts_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const safetyTipConfirmationsTable = pgTable("safety_tip_confirmations", {
  id: serial("id").primaryKey(),
  tipId: integer("tip_id").notNull().references(() => safetyTipsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  userLat: real("user_lat"),
  userLng: real("user_lng"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SafetyTip = typeof safetyTipsTable.$inferSelect;
export type SafetyTipConfirmation = typeof safetyTipConfirmationsTable.$inferSelect;

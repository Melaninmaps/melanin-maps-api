import { boolean, doublePrecision, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const locationSharesTable = pgTable("location_shares", {
  id: serial("id").primaryKey(),
  sharerId: varchar("sharer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  shareToken: varchar("share_token", { length: 64 }).notNull().unique(),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientUserId: varchar("recipient_user_id"),
  label: varchar("label", { length: 150 }).notNull().default("Live Location"),
  currentLat: doublePrecision("current_lat"),
  currentLng: doublePrecision("current_lng"),
  lastUpdatedAt: timestamp("last_updated_at"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LocationShare = typeof locationSharesTable.$inferSelect;

import { boolean, integer, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const communityAlertsTable = pgTable("community_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 30 }).notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  description: text("description"),
  reportedBy: varchar("reported_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  confirmedCount: integer("confirmed_count").notNull().default(0),
  clearedCount: integer("cleared_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CommunityAlert = typeof communityAlertsTable.$inferSelect;

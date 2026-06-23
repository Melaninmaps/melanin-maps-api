import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./auth";

export const businessProfileViewsTable = pgTable("business_profile_views", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
});

export type BusinessProfileView = typeof businessProfileViewsTable.$inferSelect;

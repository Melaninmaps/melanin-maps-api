import { pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

export const savedPlacesTable = pgTable(
  "saved_places",
  {
    userId: varchar("user_id").notNull(),
    businessId: varchar("business_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.businessId] })],
);

export type SavedPlace = typeof savedPlacesTable.$inferSelect;

import { pgTable, text, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";

export const marketplaceSavedTable = pgTable("marketplace_saved", {
  userId: text("user_id").notNull(),
  listingId: uuid("listing_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.listingId] })]);

export type MarketplaceSaved = typeof marketplaceSavedTable.$inferSelect;

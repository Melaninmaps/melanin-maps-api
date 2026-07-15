import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./auth";

// Tracks every outbound link click on a Community Reference listing.
// source: where on the platform the user clicked from
// sourceId: the specific post ID, space ID, etc. that drove the click
// referrerUserId: the community member whose post/space surfaced the reference
export const referenceLinkClicksTable = pgTable("reference_link_clicks", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  source: varchar("source", { length: 30 }).notNull().default("direct"),
  // community_post | saved_space | search | business_profile | map | direct
  sourceId: varchar("source_id", { length: 255 }),
  referrerUserId: varchar("referrer_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ReferenceLinkClick = typeof referenceLinkClicksTable.$inferSelect;

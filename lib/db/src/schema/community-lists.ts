import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const communityListsTable = pgTable("community_lists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 60 }),
  coverEmoji: text("cover_emoji").default("📍"),
  isPublic: boolean("is_public").default(true).notNull(),
  savedCount: integer("saved_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityListItemsTable = pgTable("community_list_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  businessId: varchar("business_id").notNull(),
  businessName: text("business_name").notNull(),
  city: varchar("city", { length: 80 }),
  note: text("note"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export type CommunityList = typeof communityListsTable.$inferSelect;
export type CommunityListItem = typeof communityListItemsTable.$inferInsert;

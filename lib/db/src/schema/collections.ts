import { pgTable, varchar, text, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";

export const collectionsTable = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  coverEmoji: varchar("cover_emoji", { length: 10 }).notNull().default("📌"),
  topicId: varchar("topic_id", { length: 100 }),
  isPublic: boolean("is_public").notNull().default(true),
  followCount: integer("follow_count").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collectionItemsTable = pgTable("collection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id", { length: 100 }).notNull().references(() => collectionsTable.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 30 }).notNull(),
  itemId: varchar("item_id", { length: 100 }).notNull(),
  itemName: varchar("item_name", { length: 300 }),
  itemEmoji: varchar("item_emoji", { length: 10 }),
  note: text("note"),
  displayOrder: integer("display_order").notNull().default(0),
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("collection_items_unique").on(table.collectionId, table.itemType, table.itemId),
]);

export const collectionFollowsTable = pgTable("collection_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  collectionId: varchar("collection_id", { length: 100 }).notNull().references(() => collectionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("collection_follows_unique").on(table.userId, table.collectionId),
]);

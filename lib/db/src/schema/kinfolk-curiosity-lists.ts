import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Member-authored learning notes. The display fields are encrypted placeholders;
 * raw names and item text are only opened after an owner-scoped server query.
 */
export const kinfolkCuriosityListsTable = pgTable("kinfolk_curiosity_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("[Encrypted private memory]"),
  encryptedName: text("encrypted_name").notNull(),
  encryptionKeyId: varchar("encryption_key_id", { length: 64 }).notNull(),
  /** Never enables use by default; it only authorizes a separately explicit request. */
  allowKinfolkUse: boolean("allow_kinfolk_use").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("kinfolk_curiosity_lists_id_owner_key").on(table.id, table.userId),
  index("kinfolk_curiosity_lists_owner_updated_idx").on(table.userId, table.updatedAt),
  check("kinfolk_curiosity_lists_name_encrypted_check", sql`${table.name} = '[Encrypted private memory]'`),
]);

/** Ordered private topics, cultures, or questions belonging to exactly one owner/list pair. */
export const kinfolkCuriosityListItemsTable = pgTable("kinfolk_curiosity_list_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  listId: uuid("list_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  itemText: text("item_text").notNull().default("[Encrypted private memory]"),
  encryptedItemText: text("encrypted_item_text").notNull(),
  encryptionKeyId: varchar("encryption_key_id", { length: 64 }).notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.listId, table.userId],
    foreignColumns: [kinfolkCuriosityListsTable.id, kinfolkCuriosityListsTable.userId],
    name: "kinfolk_curiosity_list_items_owner_list_fk",
  }).onDelete("cascade"),
  uniqueIndex("kinfolk_curiosity_list_items_list_position_key").on(table.listId, table.position),
  index("kinfolk_curiosity_list_items_owner_list_idx").on(table.userId, table.listId, table.position),
  check("kinfolk_curiosity_list_items_text_encrypted_check", sql`${table.itemText} = '[Encrypted private memory]'`),
  check("kinfolk_curiosity_list_items_position_check", sql`${table.position} >= 0`),
]);

export type KinfolkCuriosityList = typeof kinfolkCuriosityListsTable.$inferSelect;
export type KinfolkCuriosityListItem = typeof kinfolkCuriosityListItemsTable.$inferSelect;

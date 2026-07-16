import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const heritageSupportLinksTable = pgTable("heritage_support_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteId: varchar("site_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default("giving"),
  isVerified: boolean("is_verified").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHeritageSupportLinkSchema = createInsertSchema(heritageSupportLinksTable).omit({
  id: true,
  createdAt: true,
});
export const selectHeritageSupportLinkSchema = createSelectSchema(heritageSupportLinksTable);

export type HeritageSupportLink = typeof heritageSupportLinksTable.$inferSelect;
export type InsertHeritageSupportLink = typeof heritageSupportLinksTable.$inferInsert;

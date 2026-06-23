import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const familyLinksTable = pgTable("family_links", {
  id: serial("id").primaryKey(),
  parentUserId: varchar("parent_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  childUserId: varchar("child_user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  childEmail: varchar("child_email", { length: 255 }),
  inviteToken: varchar("invite_token", { length: 64 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

export const contentFilterRulesTable = pgTable("content_filter_rules", {
  id: serial("id").primaryKey(),
  familyLinkId: integer("family_link_id").notNull().references(() => familyLinksTable.id, { onDelete: "cascade" }),
  keywords: text("keywords").array().notNull().default([]),
  blockContent: boolean("block_content").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contentFilterViolationsTable = pgTable("content_filter_violations", {
  id: serial("id").primaryKey(),
  familyLinkId: integer("family_link_id").references(() => familyLinksTable.id, { onDelete: "set null" }),
  childUserId: varchar("child_user_id").notNull(),
  parentUserId: varchar("parent_user_id").notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  contentSnippet: text("content_snippet").notNull(),
  matchedKeywords: text("matched_keywords").array().notNull().default([]),
  wasBlocked: boolean("was_blocked").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FamilyLink = typeof familyLinksTable.$inferSelect;
export type ContentFilterRule = typeof contentFilterRulesTable.$inferSelect;
export type ContentFilterViolation = typeof contentFilterViolationsTable.$inferSelect;

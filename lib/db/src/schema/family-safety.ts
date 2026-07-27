import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const familySettingsTable = pgTable("family_settings", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  allowEveryone: boolean("allow_everyone").notNull().default(true),
  allowTeen: boolean("allow_teen").notNull().default(true),
  allowYoungAdult: boolean("allow_young_adult").notNull().default(true),
  allowAdult: boolean("allow_adult").notNull().default(true),
  familyModeEnabled: boolean("family_mode_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export type FamilySettings = typeof familySettingsTable.$inferSelect;

export const contentFilterViolationsTable = pgTable("content_filter_violations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(),
  contentSnippet: text("content_snippet").notNull(),
  matchedKeywords: text("matched_keywords").array().notNull().default([]),
  wasBlocked: boolean("was_blocked").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ContentFilterViolation = typeof contentFilterViolationsTable.$inferSelect;

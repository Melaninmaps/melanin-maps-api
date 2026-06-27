import { boolean, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export interface CreatorPlatform {
  platform: string;
  handle: string;
  url: string;
}

export const creatorProfilesTable = pgTable("creator_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  bio: text("bio"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  platforms: jsonb("platforms").$type<CreatorPlatform[]>().notNull().default([]),
  primaryPlatform: varchar("primary_platform", { length: 30 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type CreatorProfile = typeof creatorProfilesTable.$inferSelect;

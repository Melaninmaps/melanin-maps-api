import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPreferencesTable = pgTable("user_preferences", {
  userId: varchar("user_id").primaryKey(),
  favoriteCategories: jsonb("favorite_categories").$type<string[]>().default([]),
  favoriteCities: jsonb("favorite_cities").$type<string[]>().default([]),
  avoidCategories: jsonb("avoid_categories").$type<string[]>().default([]),
  budgetRange: varchar("budget_range", { length: 20 }).default("any"),
  tripStyle: jsonb("trip_style").$type<string[]>().default([]),
  travelCompanion: varchar("travel_companion", { length: 30 }).default("solo"),
  dietaryNotes: text("dietary_notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferencesTable);
export const selectUserPreferencesSchema = createSelectSchema(userPreferencesTable);

export type UserPreferencesRow = typeof userPreferencesTable.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

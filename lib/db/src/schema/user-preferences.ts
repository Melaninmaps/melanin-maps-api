import { boolean, jsonb, pgTable, smallint, text, timestamp, varchar } from "drizzle-orm/pg-core";
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
  communicationStyle: varchar("communication_style", { length: 20 }).default("friendly"),
  personalityMode: varchar("personality_mode", { length: 30 }).default("neighborhood_guide"),
  emojiLevel: varchar("emoji_level", { length: 10 }).default("some"),
  humorLevel: varchar("humor_level", { length: 10 }).default("light"),
  culturalInterests: jsonb("cultural_interests").$type<string[]>().default([]),
  knowBeforeYouGo: boolean("know_before_you_go").default(true),
  regionalFlavor: varchar("regional_flavor", { length: 30 }).default("off"),
  kinfolkVoice: varchar("kinfolk_voice", { length: 20 }).notNull().default("onyx"),
  autoSpeak: boolean("auto_speak").notNull().default(false),
  preferredOwnershipTypes: jsonb("preferred_ownership_types").$type<string[]>().default([]),
  diasporaCountries: jsonb("diaspora_countries").$type<string[]>().default([]),
  lifestyleServices: jsonb("lifestyle_services").$type<string[]>().default([]),
  searchHistory: jsonb("search_history").$type<Array<{ query: string; type: string; categories: string[]; ts: number }>>().default([]),
  aaveLevel: smallint("aave_level").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferencesTable);
export const selectUserPreferencesSchema = createSelectSchema(userPreferencesTable);

export type UserPreferencesRow = typeof userPreferencesTable.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const showLoveNominationsTable = pgTable("show_love_nominations", {
  id: serial("id").primaryKey(),
  nominatorId: varchar("nominator_id"),
  nomineeType: varchar("nominee_type", { length: 50 }).notNull().default("person"),
  nomineeName: varchar("nominee_name", { length: 200 }).notNull(),
  nomineeUserId: varchar("nominee_user_id"),
  nomineeBusinessId: varchar("nominee_business_id"),
  nomineeHandle: varchar("nominee_handle", { length: 100 }),
  nomineeImageUrl: varchar("nominee_image_url", { length: 512 }),
  category: varchar("category", { length: 80 }).notNull(),
  whatKnownFor: text("what_known_for").array().notNull().default([]),
  reason: text("reason").notNull(),
  experience: text("experience"),
  city: varchar("city", { length: 100 }),
  isPublic: boolean("is_public").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  showLoveCount: integer("show_love_count").notNull().default(0),
  supportCount: integer("support_count").notNull().default(0),
  savedCount: integer("saved_count").notNull().default(0),
  visitedCount: integer("visited_count").notNull().default(0),
  spotlightMonth: varchar("spotlight_month", { length: 7 }),
  spotlightType: varchar("spotlight_type", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const showLoveReactionsTable = pgTable("show_love_reactions", {
  id: serial("id").primaryKey(),
  nominationId: integer("nomination_id").notNull(),
  userId: varchar("user_id").notNull(),
  reactionType: varchar("reaction_type", { length: 30 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShowLoveNominationSchema = createInsertSchema(showLoveNominationsTable, {
  reason: z.string().min(20).max(500),
  experience: z.string().max(500).optional(),
  nomineeName: z.string().min(1).max(200),
});

export const selectShowLoveNominationSchema = createSelectSchema(showLoveNominationsTable);

export type ShowLoveNomination = typeof showLoveNominationsTable.$inferSelect;
export type InsertShowLoveNomination = typeof showLoveNominationsTable.$inferInsert;
export type ShowLoveReaction = typeof showLoveReactionsTable.$inferSelect;

import { integer, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const communityRequestsTable = pgTable("community_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  description: text("description"),
  upvotes: integer("upvotes").notNull().default(0),
  helperCount: integer("helper_count").notNull().default(0),
  status: varchar("status", { length: 30 }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const helpOffersTable = pgTable("help_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  userId: varchar("user_id").notNull(),
  offerTypes: json("offer_types").$type<string[]>().notNull().default([]),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const requestUpvotesTable = pgTable("request_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CommunityRequest = typeof communityRequestsTable.$inferSelect;
export type HelpOffer = typeof helpOffersTable.$inferSelect;

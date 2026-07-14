import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  memberCount: integer("member_count").notNull().default(0),
  maxMembers: integer("max_members").notNull().default(8),
  isPrivate: boolean("is_private").notNull().default(false),
  isAgeRestricted: boolean("is_age_restricted").notNull().default(false),
  createdBy: text("created_by"),
  city: text("city"),
  state: text("state"),
  imageUrl: text("image_url"),
  audiencePreferences: jsonb("audience_preferences").$type<string[]>().default([]),
  rules: jsonb("rules").$type<string[]>().default([]),
  profanityLevel: text("profanity_level").notNull().default("moderate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const groupInvites = pgTable("group_invites", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  invitedBy: text("invited_by").notNull(),
  invitedUserId: text("invited_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export type ItineraryDay = {
  day: string;
  theme: string;
  activities: { time: string; title: string; description: string; location?: string }[];
  meals: { meal: string; restaurant: string; cuisine: string; note?: string }[];
};

export type ItineraryOption = {
  id: number;
  title: string;
  destination: string;
  dates: string;
  theme: string;
  budget: string;
  whyItWorks: string;
  safetyNote: string;
  days: ItineraryDay[];
};

export type GroupItineraryContent = {
  summary: string;
  memberCount: number;
  sharedInterests: string[];
  options: ItineraryOption[];
  generatedAt: string;
};

export const groupItineraries = pgTable("group_itineraries", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  destination: text("destination"),
  content: jsonb("content").$type<GroupItineraryContent>(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupSuggestions = pgTable("group_suggestions", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  type: text("type").notNull().default("location"),
  value: text("value").notNull(),
  notes: text("notes"),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupReports = pgTable("group_reports", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  reportedBy: text("reported_by").notNull(),
  targetType: text("target_type").notNull().default("group"),
  targetId: text("target_id"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupInvite = typeof groupInvites.$inferSelect;
export type GroupItinerary = typeof groupItineraries.$inferSelect;
export type GroupSuggestion = typeof groupSuggestions.$inferSelect;
export type InsertGroupSuggestion = typeof groupSuggestions.$inferInsert;
export type GroupReport = typeof groupReports.$inferSelect;

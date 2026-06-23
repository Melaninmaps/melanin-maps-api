import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  memberCount: integer("member_count").notNull().default(0),
  maxMembers: integer("max_members").notNull().default(8),
  isPrivate: boolean("is_private").notNull().default(false),
  createdBy: text("created_by"),
  city: text("city"),
  state: text("state"),
  imageUrl: text("image_url"),
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

export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupInvite = typeof groupInvites.$inferSelect;
export type GroupItinerary = typeof groupItineraries.$inferSelect;

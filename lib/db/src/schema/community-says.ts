import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const COMMUNITY_SAYS_TAGS = [
  { id: "must_support", label: "Must Support", emoji: "🤎" },
  { id: "its_a_vibe", label: "It's a Vibe", emoji: "✨" },
  { id: "great_hospitality", label: "Great Hospitality", emoji: "🍽️" },
  { id: "safe_space", label: "Safe Space", emoji: "🛡️" },
  { id: "community_pillar", label: "Community Pillar", emoji: "🏛️" },
  { id: "hidden_gem", label: "Hidden Gem", emoji: "💎" },
  { id: "family_friendly", label: "Family Friendly", emoji: "👨‍👩‍👧" },
  { id: "black_excellence", label: "Black Excellence", emoji: "✊🏾" },
  { id: "veteran_owned", label: "Veteran Owned", emoji: "🎖️" },
  { id: "women_led", label: "Women Led", emoji: "💕" },
  { id: "accessible", label: "Accessible", emoji: "♿" },
  { id: "culturally_rich", label: "Culturally Rich", emoji: "🎨" },
] as const;

export type CommunitySaysTagId = typeof COMMUNITY_SAYS_TAGS[number]["id"];

export const communitySaysTable = pgTable("community_says", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  userId: varchar("user_id").notNull(),
  tag: varchar("tag", { length: 60 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loveNotesTable = pgTable("love_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  userId: varchar("user_id").notNull(),
  note: text("note").notNull(),
  contentLink: varchar("content_link", { length: 512 }),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CommunitySays = typeof communitySaysTable.$inferSelect;
export type LoveNote = typeof loveNotesTable.$inferSelect;

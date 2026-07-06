import { pgTable, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const payItForwardGuidesTable = pgTable("pay_it_forward_guides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  personalStory: text("personal_story"),
  subjectName: varchar("subject_name", { length: 200 }).notNull(),
  storyType: varchar("story_type", { length: 50 }).notNull().default("general"),
  subjectEmoji: varchar("subject_emoji", { length: 10 }).notNull().default("✨"),
  experienceContext: varchar("experience_context", { length: 150 }),
  city: varchar("city", { length: 100 }),
  isPublic: boolean("is_public").notNull().default(true),
  followCount: integer("follow_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  sectionCount: integer("section_count").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guideSectionsTable = pgTable("guide_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  sectionEmoji: varchar("section_emoji", { length: 10 }).notNull().default("📌"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guideItemsTable = pgTable("guide_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar("guide_id", { length: 100 }).notNull(),
  sectionId: varchar("section_id", { length: 100 }).notNull(),
  itemType: varchar("item_type", { length: 30 }).notNull().default("tip"),
  businessId: varchar("business_id", { length: 100 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  externalUrl: varchar("external_url", { length: 500 }),
  externalLabel: varchar("external_label", { length: 100 }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guideFollowsTable = pgTable("guide_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(),
  guideId: varchar("guide_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

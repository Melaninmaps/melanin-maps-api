import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const cityArchivesTable = pgTable("city_archives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  tagline: text("tagline"),
  description: text("description"),
  heroImageUrl: text("hero_image_url"),
  tourVisitedAt: timestamp("tour_visited_at"),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"),
  contributionCount: integer("contribution_count").notNull().default(0),
  nominationCount: integer("nomination_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const archiveContributionsTable = pgTable("archive_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  archiveId: varchar("archive_id").notNull().references(() => cityArchivesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id"),
  contributorName: varchar("contributor_name", { length: 150 }),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  businessId: varchar("business_id"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  isApproved: boolean("is_approved").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CityArchive = typeof cityArchivesTable.$inferSelect;
export type ArchiveContribution = typeof archiveContributionsTable.$inferSelect;

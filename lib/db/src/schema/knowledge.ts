import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";

export const knowledgeArticlesTable = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 250 }).notNull(),
  slug: varchar("slug", { length: 250 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  topicId: varchar("topic_id", { length: 100 }),
  tier: varchar("tier", { length: 20 }).notNull().default("free"),
  authorId: varchar("author_id", { length: 100 }),
  authorName: varchar("author_name", { length: 150 }).notNull().default("Editorial"),
  authorBadge: varchar("author_badge", { length: 100 }),
  authorAvatar: varchar("author_avatar", { length: 500 }),
  tags: text("tags").array(),
  imageUrl: varchar("image_url", { length: 500 }),
  readTimeMinutes: integer("read_time_minutes").default(4),
  audienceRating: varchar("audience_rating", { length: 20 }).notNull().default("everyone"),
  ratingReason: varchar("rating_reason", { length: 200 }),
  disclaimer: text("disclaimer"),
  featured: boolean("featured").default(false),
  viewCount: integer("view_count").default(0),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const expertProfilesTable = pgTable("expert_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  specialty: varchar("specialty", { length: 100 }).notNull(),
  badge: varchar("badge", { length: 100 }).notNull(),
  bio: text("bio"),
  credentials: varchar("credentials", { length: 300 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  location: varchar("location", { length: 100 }),
  verificationStatus: varchar("verification_status", { length: 20 }).notNull().default("pending"),
  followCount: integer("follow_count").default(0),
  articleCount: integer("article_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const knowledgeBookmarksTable = pgTable("knowledge_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(),
  articleId: varchar("article_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expertFollowsTable = pgTable("expert_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id", { length: 100 }).notNull(),
  expertId: varchar("expert_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const knowledgeTopicsTable = pgTable("knowledge_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicName: varchar("topic_name", { length: 200 }).notNull(),
  canonicalName: varchar("canonical_name", { length: 200 }),
  category: varchar("category", { length: 50 }).notNull(),
  parentCategory: varchar("parent_category", { length: 50 }),
  entityType: varchar("entity_type", { length: 50 }),
  ownershipType: varchar("ownership_type", { length: 30 }),
  isMinorityOwned: boolean("is_minority_owned"),
  description: text("description"),
  keywords: text("keywords").array(),
  synonyms: text("synonyms").array(),
  trustedSources: jsonb("trusted_sources"),
  notificationPriority: varchar("notification_priority", { length: 20 }).notNull().default("standard"),
  tier: varchar("tier", { length: 20 }).notNull().default("free"),
  searchFrequencyDays: integer("search_frequency_days").notNull().default(7),
  lastSearchedAt: timestamp("last_searched_at"),
  enabled: boolean("enabled").notNull().default(true),
  topicType: varchar("topic_type", { length: 30 }).notNull().default("general"),
  isUserCreated: boolean("is_user_created").notNull().default(false),
  createdByUserId: varchar("created_by_user_id", { length: 100 }),
  credibilityScore: integer("credibility_score").notNull().default(50),
  credibilityTier: varchar("credibility_tier", { length: 30 }).notNull().default("community"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topicCredibilitySignalsTable = pgTable("topic_credibility_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 100 }).references(() => usersTable.id, { onDelete: "set null" }),
  signalType: varchar("signal_type", { length: 30 }).notNull(),
  weight: integer("weight").notNull().default(1),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userTopicFollowsTable = pgTable("user_topic_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(),
  topicId: varchar("topic_id", { length: 100 }).notNull(),
  isPinnedToProfile: boolean("is_pinned_to_profile").notNull().default(false),
  hubIntent: varchar("hub_intent", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_topic_follows_unique").on(table.userId, table.topicId),
]);

export const knowledgeArticleReadsTable = pgTable("knowledge_article_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull(),
  articleId: varchar("article_id", { length: 100 }).notNull(),
  topicId: varchar("topic_id", { length: 100 }),
  readAt: timestamp("read_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("knowledge_article_reads_unique").on(table.userId, table.articleId),
]);

export const userDeliveryPreferencesTable = pgTable("user_delivery_preferences", {
  userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  digestMode: varchar("digest_mode", { length: 30 }).notNull().default("weekly"),
  scope: varchar("scope", { length: 20 }).notNull().default("all"),
  includeSavedCities: boolean("include_saved_cities").notNull().default(false),
  includeSavedBusinesses: boolean("include_saved_businesses").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const topicIssuesTable = pgTable("topic_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  keywords: text("keywords").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userIssueFollowsTable = pgTable("user_issue_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  issueId: varchar("issue_id", { length: 100 }).notNull(),
  isPinnedToProfile: boolean("is_pinned_to_profile").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("user_issue_follows_unique").on(table.userId, table.issueId),
]);

export const happeningNowStoriesTable = pgTable("happening_now_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary").notNull(),
  category: varchar("category", { length: 50 }).notNull().default("other"),
  sourceUrl: varchar("source_url", { length: 500 }),
  submittedBy: varchar("submitted_by", { length: 100 }).references(() => usersTable.id, { onDelete: "set null" }),
  submitterName: varchar("submitter_name", { length: 150 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  confirmCount: integer("confirm_count").notNull().default(0),
  isAdminPost: boolean("is_admin_post").notNull().default(false),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const storyConfirmationsTable = pgTable("story_confirmations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id", { length: 100 }).notNull().references(() => happeningNowStoriesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("story_confirmations_unique").on(table.storyId, table.userId),
]);

export const userBadgesTable = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id", { length: 100 }),
  badgeType: varchar("badge_type", { length: 50 }).notNull(),
  badgeName: varchar("badge_name", { length: 200 }).notNull(),
  badgeEmoji: varchar("badge_emoji", { length: 10 }).notNull().default("✦"),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  isVolunteered: boolean("is_volunteered").notNull().default(false),
  yearsOfExperience: integer("years_of_experience"),
  experienceNote: text("experience_note"),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const badgeHelpfulVotesTable = pgTable("badge_helpful_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  badgeId: varchar("badge_id", { length: 100 }).notNull().references(() => userBadgesTable.id, { onDelete: "cascade" }),
  voterId: varchar("voter_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("badge_helpful_votes_unique").on(table.badgeId, table.voterId),
]);

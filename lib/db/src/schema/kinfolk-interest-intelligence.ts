import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { circleSuggestions, kinfolkCircles } from "./circles";

/**
 * Member-controlled, non-sensitive interest records used only by the governed
 * Kinfolk recommendation surfaces. These records intentionally contain no chat
 * transcript, private-memory content, identity inference, or third-party data.
 */
export const kinfolkMemberInterestsTable = pgTable(
  "kinfolk_member_interests",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    source: varchar("source", { length: 32 }).notNull().default("explicit"),
    state: varchar("state", { length: 24 }).notNull().default("confirmed"),
    observationCount: integer("observation_count").notNull().default(1),
    confidence: integer("confidence").notNull().default(100),
    isTemporary: boolean("is_temporary").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_member_interests_user_label_unique").on(table.userId, table.label)],
);

/** A member's response to one recommendation. Feedback never changes a profile automatically. */
export const kinfolkInterestRecommendationFeedbackTable = pgTable(
  "kinfolk_interest_recommendation_feedback",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    recommendationId: integer("recommendation_id").notNull(),
    feedback: varchar("feedback", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_interest_feedback_user_recommendation_unique").on(table.userId, table.recommendationId)],
);

/**
 * A short-lived ledger for shown recommendations. It makes dismissal, save, and
 * relevance feedback inspectable without adding the underlying member data to a
 * general-purpose Kinfolk memory system.
 */
export const kinfolkInterestRecommendationsTable = pgTable(
  "kinfolk_interest_recommendations",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    resourceType: varchar("resource_type", { length: 32 }).notNull(),
    resourceId: varchar("resource_id", { length: 255 }).notNull(),
    resourceCategory: varchar("resource_category", { length: 100 }),
    interestLabel: varchar("interest_label", { length: 100 }).notNull(),
    source: varchar("source", { length: 32 }).notNull().default("interest"),
    reason: text("reason").notNull(),
    rank: integer("rank").notNull().default(0),
    status: varchar("status", { length: 24 }).notNull().default("shown"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_interest_recommendations_user_resource_unique").on(table.userId, table.resourceType, table.resourceId)],
);

/**
 * Circle participation is deliberately item-level opt-in. Neither membership,
 * saves, reviews, search history, nor a private interest is shared by default.
 */
export const kinfolkCircleInterestSharesTable = pgTable(
  "kinfolk_circle_interest_shares",
  {
    id: serial("id").primaryKey(),
    circleId: integer("circle_id").notNull().references(() => kinfolkCircles.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    interestId: integer("interest_id").notNull().references(() => kinfolkMemberInterestsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_circle_interest_share_unique").on(table.circleId, table.userId, table.interestId)],
);

/** Explicit hard requirements for this separate recommendation surface only. */
export const kinfolkInterestDiscoveryConstraintsTable = pgTable(
  "kinfolk_interest_discovery_constraints",
  {
    userId: varchar("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
    crowdPreference: varchar("crowd_preference", { length: 32 }).notNull().default("any"),
    accessibilityRequirements: jsonb("accessibility_requirements").$type<string[]>().notNull().default([]),
    maximumPrice: varchar("maximum_price", { length: 8 }).notNull().default("any"),
    agePreference: varchar("age_preference", { length: 24 }).notNull().default("member_default"),
    excludedCategories: jsonb("excluded_categories").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/** Compact scopes make feedback effective without changing a broad profile silently. */
export const kinfolkInterestFeedbackScopesTable = pgTable(
  "kinfolk_interest_feedback_scopes",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    scopeType: varchar("scope_type", { length: 32 }).notNull(),
    scopeValue: varchar("scope_value", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_interest_feedback_scope_unique").on(table.userId, table.scopeType, table.scopeValue)],
);

/**
 * A citation-backed external opportunity is separate from an MWM listing. It
 * stores source identity and freshness metadata, not a personal search query,
 * raw response, or any assertion that MWM verified the opportunity.
 */
export const kinfolkExternalOpportunitiesTable = pgTable(
  "kinfolk_external_opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    interestLabel: varchar("interest_label", { length: 100 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    sourceHost: varchar("source_host", { length: 255 }).notNull(),
    sourceProvider: varchar("source_provider", { length: 32 }).notNull(),
    sourcePublishedAt: timestamp("source_published_at", { withTimezone: true }),
    startsOn: timestamp("starts_on", { withTimezone: true }).notNull(),
    verificationState: varchar("verification_state", { length: 32 }).notNull().default("source_confirmed"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_external_opportunities_member_source_unique").on(table.userId, table.canonicalUrl)],
);

/** An opportunity becomes a real existing Circle suggestion only after approval. */
export const kinfolkCircleOpportunitySharesTable = pgTable(
  "kinfolk_circle_opportunity_shares",
  {
    id: serial("id").primaryKey(),
    circleId: integer("circle_id").notNull().references(() => kinfolkCircles.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    recommendationId: integer("recommendation_id").notNull().references(() => kinfolkInterestRecommendationsTable.id, { onDelete: "cascade" }),
    suggestionId: integer("suggestion_id").notNull().references(() => circleSuggestions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("kinfolk_circle_opportunity_share_unique").on(table.circleId, table.userId, table.recommendationId)],
);

export type KinfolkMemberInterest = typeof kinfolkMemberInterestsTable.$inferSelect;
export type KinfolkInterestRecommendation = typeof kinfolkInterestRecommendationsTable.$inferSelect;

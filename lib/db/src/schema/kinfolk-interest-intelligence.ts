import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { kinfolkCircles } from "./circles";

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

export type KinfolkMemberInterest = typeof kinfolkMemberInterestsTable.$inferSelect;
export type KinfolkInterestRecommendation = typeof kinfolkInterestRecommendationsTable.$inferSelect;

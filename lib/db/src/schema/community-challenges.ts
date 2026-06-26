import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const communityChallengesTable = pgTable("community_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 10 }).notNull().default("🏆"),
  challengeType: varchar("challenge_type", { length: 60 }).notNull(),
  targetCount: integer("target_count").notNull().default(1),
  pointsReward: integer("points_reward").notNull().default(50),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  completionCount: integer("completion_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const challengeProgressTable = pgTable("challenge_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  challengeId: varchar("challenge_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completedAt: timestamp("completed_at"),
  pointsAwarded: boolean("points_awarded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CommunityChallenge = typeof communityChallengesTable.$inferSelect;
export type ChallengeProgress = typeof challengeProgressTable.$inferSelect;

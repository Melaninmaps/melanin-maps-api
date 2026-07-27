import { json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const ACHIEVEMENT_DEFINITIONS = {
  first_review: { title: "First Review", icon: "⭐", desc: "Wrote your first community review" },
  local_guide_10: { title: "Local Guide", icon: "🗺️", desc: "Written 10 reviews" },
  first_recommendation: { title: "Community Builder", icon: "🤎", desc: "Recommended your first business to join" },
  community_builder_5: { title: "Community Champion", icon: "🏆", desc: "Recommended 5 businesses" },
  first_checkin: { title: "Explorer", icon: "📍", desc: "Checked in to your first business" },
  explorer_25: { title: "Super Explorer", icon: "🌍", desc: "Discovered 25 businesses" },
  safety_sentinel: { title: "Safety Sentinel", icon: "🛡️", desc: "Submitted 5 safety reports" },
  first_request: { title: "Voice of the Community", icon: "🙋", desc: "Posted your first community request" },
  first_helper: { title: "Kinfolk Helper", icon: "🤝", desc: "Offered to help someone for the first time" },
  helper_10: { title: "Community Mentor", icon: "👑", desc: "Helped 10 community members" },
  relocation_expert: { title: "Relocation Expert", icon: "🏠", desc: "Helped someone relocate" },
  accessibility_advocate: { title: "Accessibility Advocate", icon: "♿", desc: "Submitted 3 accessibility requests" },
  first_circle: { title: "Circle Starter", icon: "⭐", desc: "Created your first Kinfolk Circle" },
  kinfolk_star: { title: "Kinfolk Star", icon: "✨", desc: "Created 3 Kinfolk Circles" },
  challenge_complete: { title: "Challenge Accepted", icon: "🎯", desc: "Completed your first community challenge" },
  challenge_streak_3: { title: "On Fire", icon: "🔥", desc: "Completed 3 challenges in a row" },
} as const;

export type AchievementType = keyof typeof ACHIEVEMENT_DEFINITIONS;

export const userAchievementsTable = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  achievementType: varchar("achievement_type", { length: 60 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export type UserAchievement = typeof userAchievementsTable.$inferSelect;

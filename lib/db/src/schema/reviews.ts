import { boolean, integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  businessId: varchar("business_id").notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull().default("Community Member"),
  rating: integer("rating").notNull(),
  text: text("text"),
  wouldReturnAlone: boolean("would_return_alone"),
  socialHandle: varchar("social_handle", { length: 100 }),
  socialPlatform: varchar("social_platform", { length: 30 }),
  videoUrl: varchar("video_url", { length: 500 }),
  nonMinorityOwned: boolean("non_minority_owned").default(false),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  recommendsAsEmployer: boolean("recommends_as_employer").default(false),
  nowHiringUrl: varchar("now_hiring_url", { length: 500 }),
  communitySupport: integer("community_support"),
  website: varchar("website", { length: 500 }),
  location: varchar("location", { length: 255 }),
  weight: numeric("weight", { precision: 4, scale: 2 }).notNull().default("1.00"),
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  verifiedCheckin: boolean("verified_checkin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // ── Photos ──────────────────────────────────────────────────────────────────
  photos: text("photos").array(),
  // ── Moderation & lifecycle ────────────────────────────────────────────────
  // posted                = live immediately
  // auto_approved         = all 5★, no video — posted immediately, owner alerted
  // pending_video         = has a video URL — held for admin video approval
  // pending_verification  = high-risk review for minority-owned business — held for human verification
  // rejected              = hidden from public view
  status: varchar("status", { length: 30 }).notNull().default("posted"),
  // ── Risk scoring ──────────────────────────────────────────────────────────
  // riskScore         = 0–100 composite risk score
  // moderationLevel   = 'low' | 'medium' | 'high'
  // moderationReasons = human-readable reasons the review was flagged
  // verificationBadge = badge to display once approved: 'safety_report_verified' | 'verified_experience'
  riskScore: integer("risk_score").notNull().default(0),
  moderationLevel: varchar("moderation_level", { length: 20 }).notNull().default("low"),
  moderationReasons: text("moderation_reasons").array(),
  verificationBadge: varchar("verification_badge", { length: 40 }),
  // ── Owner public response ─────────────────────────────────────────────────
  ownerResponse: text("owner_response"),
  ownerRespondedAt: timestamp("owner_responded_at", { withTimezone: true }),
  // ── Customer edit after owner response ───────────────────────────────────
  customerEditedAt: timestamp("customer_edited_at", { withTimezone: true }),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});

export const selectReviewSchema = createSelectSchema(reviewsTable);

export type ReviewRow = typeof reviewsTable.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

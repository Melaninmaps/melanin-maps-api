import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: varchar("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  blackOwned: boolean("black_owned").notNull().default(false),
  ownershipDesignations: jsonb("ownership_designations").$type<string[]>().notNull().default([]),
  verifiedDesignations: jsonb("verified_designations").$type<string[]>().notNull().default([]),
  diasporaCountries: jsonb("diaspora_countries").$type<string[]>().default([]),
  confidenceScore: integer("confidence_score").notNull().default(0),
  safetyRating: numeric("safety_rating", { precision: 3, scale: 1 }),
  wouldReturnAlone: integer("would_return_alone"),
  recommendationRate: integer("recommendation_rate"),
  description: text("description").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  reviews: jsonb("reviews").$type<Review[]>().notNull().default([]),
  phone: varchar("phone", { length: 30 }),
  website: varchar("website", { length: 255 }),
  hours: varchar("hours", { length: 255 }),
  priceRange: varchar("price_range", { length: 10 }),
  imageUrl: varchar("image_url", { length: 512 }),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  pendingPhotos: jsonb("pending_photos").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<string[]>().notNull().default([]),
  instagram: varchar("instagram", { length: 255 }),
  tiktok: varchar("tiktok", { length: 255 }),
  facebook: varchar("facebook", { length: 255 }),
  twitter: varchar("twitter", { length: 255 }),
  youtube: varchar("youtube", { length: 255 }),
  pinterest: varchar("pinterest", { length: 255 }),
  primarySocialPlatform: varchar("primary_social_platform", { length: 30 }),
  businessTagline: varchar("business_tagline", { length: 255 }),
  ownerName: varchar("owner_name", { length: 150 }),
  ownerBio: text("owner_bio"),
  ownerStory: text("owner_story"),
  currentLocationSince: varchar("current_location_since", { length: 20 }),
  businessFoundedDate: varchar("business_founded_date", { length: 20 }),
  trustBadges: jsonb("trust_badges").$type<string[]>().notNull().default([]),
  feedbackOptIn: boolean("feedback_opt_in").notNull().default(false),
  promotedUntil: timestamp("promoted_until", { withTimezone: true }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  submittedById: varchar("submitted_by_id"),
  stripeConnectAccountId: varchar("stripe_connect_account_id"),
  returnPolicy: text("return_policy"),
  sellerAgreementAcceptedAt: timestamp("seller_agreement_accepted_at", { withTimezone: true }),
  marketplaceTier: varchar("marketplace_tier", { length: 20 }).notNull().default("free"),
  foundingBusiness: boolean("founding_business").notNull().default(false),
  foundingNumber: integer("founding_number"),
  foundingGrantedAt: timestamp("founding_granted_at", { withTimezone: true }),
  businessTrialStartedAt: timestamp("business_trial_started_at", { withTimezone: true }),
  // ── Marketplace Fee Engine ────────────────────────────────────────────────
  businessStatus: varchar("business_status", { length: 20 }).notNull().default("community"), // community | growth | premium
  marketplaceFeeLocked: boolean("marketplace_fee_locked").notNull().default(false),
  lockedFee: numeric("locked_fee", { precision: 5, scale: 4 }),
  lockedUntil: timestamp("locked_until", { withTimezone: true }), // null = lifetime
  feeSource: varchar("fee_source", { length: 30 }), // founding_program | promotional | standard
  promotionEligible: boolean("promotion_eligible").notNull().default(true),
  promotionExpirationDate: timestamp("promotion_expiration_date", { withTimezone: true }),
  membershipRenewalDate: timestamp("membership_renewal_date", { withTimezone: true }),
  referredByCode: varchar("referred_by_code", { length: 30 }),
  // ── Owner intro video (hosted on platform, ≤ 2 min) ─────────────────────
  introVideoUrl: varchar("intro_video_url", { length: 512 }),
  // ── Featured pinned social video ─────────────────────────────────────────
  featuredVideoUrl: varchar("featured_video_url", { length: 512 }),
  featuredVideoTitle: varchar("featured_video_title", { length: 150 }),
  featuredVideoPurpose: varchar("featured_video_purpose", { length: 60 }),
  // ── Weekly availability calendar ─────────────────────────────────────────
  // Format: { mon: { open: "9:00 AM", close: "5:00 PM" } | null, tue: ..., ... }
  weeklySchedule: jsonb("weekly_schedule").$type<Record<string, { open: string; close: string } | null>>(),
  showAvailability: boolean("show_availability").notNull().default(false),
  // Community dispute system ("fake business" flagging)
  flagCount: integer("flag_count").notNull().default(0),
  flagStatus: varchar("flag_status", { length: 20 }).notNull().default("none"), // none | under_review | confirmed_fake | cleared
  // ── AI target audience (set by business owner) ───────────────────────────
  targetAudience: jsonb("target_audience").$type<{
    keywords?: string[];
    demographics?: string[];
    occasions?: string[];
    ageRanges?: string[];
    primaryCity?: string;
    primaryState?: string;
    description?: string;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export interface Review {
  id: string;
  author: string;
  initials: string;
  color: string;
  rating: number;
  text: string;
  timeAgo: string;
  wouldReturnAlone?: boolean;
}

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const selectBusinessSchema = createSelectSchema(businessesTable);

export type Business = typeof businessesTable.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

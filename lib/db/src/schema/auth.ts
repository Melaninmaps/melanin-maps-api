import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  pushToken: varchar("push_token"),
  approved: boolean("approved").notNull().default(true),
  role: varchar("role", { enum: ["user", "tester", "admin"] }).notNull().default("user"),
  memberType: varchar("member_type", { enum: ["individual", "navigator", "trailblazer", "community_builder", "legacy_member", "business", "founding", "beta", "business_referral"] }).default("individual"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  foundingMemberNumber: integer("founding_member_number"),
  username: varchar("username", { length: 30 }).unique(),
  referralCode: varchar("referral_code").unique(),
  referralCount: integer("referral_count").notNull().default(0),
  referredByCode: varchar("referred_by_code"),
  industry: varchar("industry", { length: 100 }),
  jobTitle: varchar("job_title", { length: 150 }),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: false }),
  kinfolkQueryMonth: varchar("kinfolk_query_month", { length: 7 }),
  kinfolkQueriesThisMonth: integer("kinfolk_queries_this_month").notNull().default(0),
  trustLevel: integer("trust_level").notNull().default(1),
  reputationScore: integer("reputation_score").notNull().default(0),
  identityVerified: boolean("identity_verified").notNull().default(false),
  identityVerifiedAt: timestamp("identity_verified_at", { withTimezone: true }),
  policyViolationsCount: integer("policy_violations_count").notNull().default(0),
  helpfulReviewsCount: integer("helpful_reviews_count").notNull().default(0),
  isPrivate: boolean("is_private").notNull().default(false),
  followersCount: integer("followers_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  bio: varchar("bio", { length: 300 }),
  homeCity: varchar("home_city", { length: 100 }),
  passwordHash: varchar("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires", { withTimezone: true }),
  agreeToTerms: boolean("agree_to_terms").notNull().default(false),
  showCity: boolean("show_city").notNull().default(true),
  allowDm: boolean("allow_dm").notNull().default(true),
  displayNameFormat: varchar("display_name_format", { enum: ["full", "first_only", "first_last_initial"] }).default("full"),
  isBusinessOwner: boolean("is_business_owner").notNull().default(false),
  isContentCreator: boolean("is_content_creator").notNull().default(false),
  isCommunityOrganizer: boolean("is_community_organizer").notNull().default(false),
  profileSetupComplete: boolean("profile_setup_complete").notNull().default(false),
  appleId: varchar("apple_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

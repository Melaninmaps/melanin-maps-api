import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
  approved: boolean("approved").notNull().default(false),
  role: varchar("role", { enum: ["user", "tester", "admin"] }).notNull().default("user"),
  memberType: varchar("member_type", { enum: ["individual", "navigator", "trailblazer", "community_builder", "legacy_member", "business", "founding", "beta", "business_referral"] }).default("individual"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  trialReminder3DaySentAt: timestamp("trial_reminder_3day_sent_at", { withTimezone: true }),
  trialReminder1DaySentAt: timestamp("trial_reminder_1day_sent_at", { withTimezone: true }),
  trialExpiredEmailSentAt: timestamp("trial_expired_email_sent_at", { withTimezone: true }),
  winBackEmailSentAt: timestamp("win_back_email_sent_at", { withTimezone: true }),
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
  isInfluencer: boolean("is_influencer").notNull().default(false),
  isBusinessOwner: boolean("is_business_owner").notNull().default(false),
  isContentCreator: boolean("is_content_creator").notNull().default(false),
  isCommunityOrganizer: boolean("is_community_organizer").notNull().default(false),
  profileSetupComplete: boolean("profile_setup_complete").notNull().default(false),
  appleId: varchar("apple_id").unique(),
  appleRefreshToken: text("apple_refresh_token"),
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  notifEvents: boolean("notif_events").notNull().default(true),
  notifBusiness: boolean("notif_business").notNull().default(true),
  notifMessages: boolean("notif_messages").notNull().default(true),
  notifReviews: boolean("notif_reviews").notNull().default(true),
  notifCommunity: boolean("notif_community").notNull().default(false),
  notifPromotions: boolean("notif_promotions").notNull().default(false),
  notifDigest: boolean("notif_digest").notNull().default(true),
  notifTips: boolean("notif_tips").notNull().default(false),
  notifPostNudges: boolean("notif_post_nudges").notNull().default(true),
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(true),
  quietHoursFrom: varchar("quiet_hours_from", { length: 10 }).notNull().default("10:00 PM"),
  quietHoursUntil: varchar("quiet_hours_until", { length: 10 }).notNull().default("8:00 AM"),
  marketingOptOut: boolean("marketing_opt_out").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  // ── Tester entitlement — separate from permanent memberType/subscription ──
  // testerStatus tracks whether the user has an active testing entitlement.
  // This is an access status, not a membership tier. Removing it returns the
  // user to their normal memberType/subscription state without touching any
  // saves, history, profile, or Kinfolk context.
  testerStatus: varchar("tester_status", { enum: ["active", "inactive"] }),
  testerAccessSource: varchar("tester_access_source", { enum: ["testflight", "android_test", "admin_invite", "website_test"] }),
  testerGrantedAt: timestamp("tester_granted_at", { withTimezone: true }),
  testerGrantedBy: varchar("tester_granted_by"),  // admin user ID
  testingEntitlementEndsAt: timestamp("testing_entitlement_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

export const authEventsTable = pgTable(
  "auth_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id"),
    event: varchar("event", { length: 60 }).notNull(),
    ipAddress: varchar("ip_address", { length: 100 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("IDX_auth_events_user_id").on(t.userId), index("IDX_auth_events_created_at").on(t.createdAt)],
);

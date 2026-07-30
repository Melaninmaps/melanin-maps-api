import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type ChecklistSection = {
  pre_launch: {
    businesses_seeded: boolean;
    cultural_sites: boolean;
    historical_sites: boolean;
    community_resources: boolean;
    events: boolean;
    city_imagery: boolean;
    moderation_review: boolean;
    kinfolk_city_context: boolean;
    search_validation: boolean;
    map_validation: boolean;
    analytics_enabled: boolean;
  };
  community: {
    founding_members: boolean;
    founding_businesses: boolean;
    ambassadors: boolean;
    creators: boolean;
    volunteers: boolean;
    local_organizations: boolean;
  };
  marketing: {
    city_landing_page: boolean;
    launch_announcement: boolean;
    social_assets: boolean;
    founder_interview_prompts: boolean;
    local_press_checklist: boolean;
    city_hashtags: boolean;
    referral_campaign: boolean;
  };
  operations: {
    feature_flags: boolean;
    rollout_percentage: boolean;
    monitoring: boolean;
    crash_dashboard: boolean;
    waitlist_activation: boolean;
    rollback_plan: boolean;
  };
};

export const DEFAULT_CHECKLIST: ChecklistSection = {
  pre_launch: {
    businesses_seeded: false,
    cultural_sites: false,
    historical_sites: false,
    community_resources: false,
    events: false,
    city_imagery: false,
    moderation_review: false,
    kinfolk_city_context: false,
    search_validation: false,
    map_validation: false,
    analytics_enabled: false,
  },
  community: {
    founding_members: false,
    founding_businesses: false,
    ambassadors: false,
    creators: false,
    volunteers: false,
    local_organizations: false,
  },
  marketing: {
    city_landing_page: false,
    launch_announcement: false,
    social_assets: false,
    founder_interview_prompts: false,
    local_press_checklist: false,
    city_hashtags: false,
    referral_campaign: false,
  },
  operations: {
    feature_flags: false,
    rollout_percentage: false,
    monitoring: false,
    crash_dashboard: false,
    waitlist_activation: false,
    rollback_plan: false,
  },
};

export const cityLaunchesTable = pgTable("city_launches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  sequenceOrder: integer("sequence_order").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("planning"),
  launchDate: timestamp("launch_date"),
  checklist: jsonb("checklist").$type<ChecklistSection>().notNull().default(DEFAULT_CHECKLIST),
  notes: text("notes"),
  rolloutPercentage: integer("rollout_percentage").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CityLaunch = typeof cityLaunchesTable.$inferSelect;
export type NewCityLaunch = typeof cityLaunchesTable.$inferInsert;

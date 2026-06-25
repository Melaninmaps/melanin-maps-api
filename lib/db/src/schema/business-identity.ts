import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const businessIdentityTable = pgTable("business_identity", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: varchar("business_id", { length: 255 }).notNull().unique(),

  // Section 1: About (narrative)
  businessStory: text("business_story"),
  missionStatement: text("mission_statement"),
  whyStarted: text("why_started"),
  whatCustomersShouldKnow: text("what_customers_should_know"),

  // Section 2: Ownership badges (multiselect)
  ownershipBadges: jsonb("ownership_badges").$type<string[]>().notNull().default([]),

  // Section 3: Community values (up to 5)
  communityValues: jsonb("community_values").$type<string[]>().notNull().default([]),

  // Section 4: Who you serve (multiselect)
  audiencesServed: jsonb("audiences_served").$type<string[]>().notNull().default([]),

  // Section 5: Accessibility features
  accessibilityFeatures: jsonb("accessibility_features").$type<string[]>().notNull().default([]),

  // Section 6: Business vibe / personality
  vibes: jsonb("vibes").$type<string[]>().notNull().default([]),

  // Section 7: Team
  employeeCount: integer("employee_count"),
  isHiring: boolean("is_hiring").notNull().default(false),
  hasInternships: boolean("has_internships").notNull().default(false),
  hasVolunteerOpportunities: boolean("has_volunteer_opportunities").notNull().default(false),

  // Section 8: Current business highlights
  currentHighlights: jsonb("current_highlights").$type<string[]>().notNull().default([]),

  // Section 9: Giving back / community initiatives
  communityInitiatives: jsonb("community_initiatives").$type<string[]>().notNull().default([]),

  // Growth goals (for KinfolkAI personalization)
  growthGoals: jsonb("growth_goals").$type<string[]>().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

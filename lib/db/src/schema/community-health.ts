import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Predefined health topics ──────────────────────────────────────────────────
export const HEALTH_TOPICS = [
  { id: "pediatric", label: "Pediatric Health", emoji: "🧒", description: "Child health, development, and care" },
  { id: "diabetes", label: "Diabetes & Blood Sugar", emoji: "🩸", description: "Type 1, Type 2, prediabetes management" },
  { id: "womens-health", label: "Women's Health", emoji: "💜", description: "Reproductive health, hormones, gynecology" },
  { id: "mens-health", label: "Men's Health", emoji: "💙", description: "Prostate health, testosterone, male wellness" },
  { id: "mental-health", label: "Mental Health", emoji: "🧠", description: "Therapy, anxiety, depression, trauma" },
  { id: "heart-health", label: "Heart Health", emoji: "❤️", description: "Cardiology, blood pressure, cholesterol" },
  { id: "nutrition", label: "Nutrition & Diet", emoji: "🥗", description: "Healthy eating, supplements, gut health" },
  { id: "fitness", label: "Fitness & Movement", emoji: "💪", description: "Exercise, mobility, physical therapy" },
  { id: "cancer", label: "Cancer Awareness", emoji: "🎗️", description: "Prevention, screening, treatment updates" },
  { id: "maternal", label: "Maternal Health", emoji: "🤱", description: "Pregnancy, postpartum, birth outcomes" },
  { id: "hypertension", label: "Hypertension", emoji: "💊", description: "High blood pressure management" },
  { id: "sickle-cell", label: "Sickle Cell", emoji: "🔬", description: "Sickle cell disease research and care" },
  { id: "elder-care", label: "Elder Care", emoji: "👴", description: "Aging, dementia, senior wellness" },
  { id: "hiv-aids", label: "HIV/AIDS Awareness", emoji: "🔴", description: "Prevention, treatment, stigma reduction" },
  { id: "substance-recovery", label: "Substance Recovery", emoji: "🌿", description: "Addiction, recovery resources, harm reduction" },
  { id: "reproductive", label: "Reproductive Health", emoji: "🌸", description: "Family planning, fertility, sexual health" },
  { id: "kidney", label: "Kidney Health", emoji: "🫘", description: "Chronic kidney disease, dialysis, prevention" },
  { id: "respiratory", label: "Respiratory Health", emoji: "🫁", description: "Asthma, COVID, lung disease" },
  { id: "dental", label: "Oral & Dental Health", emoji: "🦷", description: "Dental care, gum disease, oral health" },
  { id: "vision", label: "Vision & Eye Health", emoji: "👁️", description: "Eye care, glaucoma, vision preservation" },
] as const;

export type HealthTopicId = typeof HEALTH_TOPICS[number]["id"];

// ─── User follows health topics ────────────────────────────────────────────────
export const userHealthTopicFollowsTable = pgTable("user_health_topic_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  topicIds: jsonb("topic_ids").$type<HealthTopicId[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Physician profiles (verification) ────────────────────────────────────────
export const physicianProfilesTable = pgTable("physician_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  credentials: varchar("credentials", { length: 100 }).notNull(), // e.g. "MD", "DO", "NP", "RN"
  specialty: varchar("specialty", { length: 150 }).notNull(),
  institution: varchar("institution", { length: 200 }),
  licenseState: varchar("license_state", { length: 50 }),
  licenseNumber: varchar("license_number", { length: 100 }), // stored but not displayed
  bio: text("bio"),
  // Verification status
  status: varchar("status", { length: 20, enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Health posts (physician-curated articles) ─────────────────────────────────
export const healthPostsTable = pgTable("health_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  physicianId: uuid("physician_id").notNull(), // references physicianProfilesTable.id
  authorUserId: varchar("author_user_id", { length: 255 }).notNull(),
  // Content
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary").notNull(),
  url: varchar("url", { length: 2000 }).notNull(),
  source: varchar("source", { length: 200 }).notNull(), // e.g. "New England Journal of Medicine", "CDC", "Johns Hopkins"
  // Topic tagging (multiple topics per post)
  topicIds: jsonb("topic_ids").$type<HealthTopicId[]>().notNull().default([]),
  // Engagement
  likeCount: integer("like_count").notNull().default(0),
  // Moderation
  status: varchar("status", { length: 20, enum: ["active", "removed"] }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Health post likes ─────────────────────────────────────────────────────────
export const healthPostLikesTable = pgTable("health_post_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PhysicianProfile = typeof physicianProfilesTable.$inferSelect;
export type HealthPost = typeof healthPostsTable.$inferSelect;
export type UserHealthTopicFollows = typeof userHealthTopicFollowsTable.$inferSelect;

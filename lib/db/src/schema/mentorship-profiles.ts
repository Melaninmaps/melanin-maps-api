import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Mentors/mentees can register profiles. Discoverable by specialty, city, or near-me GPS.
// role: 'mentor' | 'mentee' | 'both'
// sessionType: 'free' | 'paid' | 'donation'

export const mentorshipProfilesTable = pgTable("mentorship_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  bio: text("bio"),
  industry: varchar("industry", { length: 80 }),
  role: varchar("role", { length: 20 }).notNull().default("mentor"),
  expertise: text("expertise"),
  // Structured specialties array e.g. ['entrepreneurship', 'finance', 'tech']
  specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
  city: varchar("city", { length: 80 }),
  state: varchar("state", { length: 50 }),
  isRemote: boolean("is_remote").notNull().default(true),
  // Coordinates for near-me filtering
  latitude: varchar("latitude", { length: 30 }),
  longitude: varchar("longitude", { length: 30 }),
  available: boolean("available").notNull().default(true),
  sessionType: varchar("session_type", { length: 20 }).notNull().default("free"),
  sessionRate: varchar("session_rate", { length: 100 }),
  linkedinUrl: text("linkedin_url"),
  calendlyUrl: text("calendly_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMentorshipProfileSchema = createInsertSchema(mentorshipProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMentorshipProfileSchema = createSelectSchema(mentorshipProfilesTable);

export type MentorshipProfile = typeof mentorshipProfilesTable.$inferSelect;
export type InsertMentorshipProfile = z.infer<typeof insertMentorshipProfileSchema>;

import { boolean, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mentorshipProfilesTable = pgTable("mentorship_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  bio: text("bio"),
  industry: varchar("industry", { length: 80 }),
  role: varchar("role", { length: 20 }).notNull().default("mentor"),
  expertise: text("expertise"),
  city: varchar("city", { length: 80 }),
  available: boolean("available").notNull().default(true),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMentorshipProfileSchema = createInsertSchema(mentorshipProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMentorshipProfileSchema = createSelectSchema(mentorshipProfilesTable);

export type MentorshipProfile = typeof mentorshipProfilesTable.$inferSelect;
export type InsertMentorshipProfile = z.infer<typeof insertMentorshipProfileSchema>;

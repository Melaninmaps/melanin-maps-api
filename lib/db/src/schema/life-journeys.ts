import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export interface JourneyStep {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

export interface JourneyPhase {
  id: string;
  title: string;
  icon: string;
  description: string;
  categories: string[];
  status: "upcoming" | "active" | "completed";
  steps: JourneyStep[];
  aiInsight?: string;
}

export const lifeJourneysTable = pgTable("life_journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  journeyType: varchar("journey_type", {
    enum: ["moving", "new-baby", "career-change", "new-to-city", "retirement", "getting-married", "starting-business", "college"],
  }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  status: varchar("status", { enum: ["active", "paused", "completed"] }).notNull().default("active"),
  phases: jsonb("phases").$type<JourneyPhase[]>().notNull().default(sql`'[]'::jsonb`),
  aiContext: varchar("ai_context", { length: 2000 }),
  kinfolkSessionId: varchar("kinfolk_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type LifeJourney = typeof lifeJourneysTable.$inferSelect;
export type InsertLifeJourney = typeof lifeJourneysTable.$inferInsert;

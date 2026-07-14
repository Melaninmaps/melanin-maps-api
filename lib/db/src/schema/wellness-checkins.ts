import { pgTable, text, integer, numeric, boolean, timestamp, uuid, date, varchar } from "drizzle-orm/pg-core";

export const wellnessCheckinsTable = pgTable("wellness_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  mood: integer("mood"),
  energyLevel: integer("energy_level"),
  stressLevel: integer("stress_level"),
  sleepHours: numeric("sleep_hours", { precision: 4, scale: 1 }),
  gratitude: text("gratitude"),
  intention: text("intention"),
  note: text("note"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wellnessGoalsTable = pgTable("wellness_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: numeric("target_value", { precision: 8, scale: 2 }),
  currentValue: numeric("current_value", { precision: 8, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 30 }),
  frequency: varchar("frequency", { length: 20 }).notNull().default("daily"),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  isActive: boolean("is_active").notNull().default(true),
  isPrivate: boolean("is_private").notNull().default(false),
  streakCount: integer("streak_count").notNull().default(0),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WellnessCheckin = typeof wellnessCheckinsTable.$inferSelect;
export type InsertWellnessCheckin = typeof wellnessCheckinsTable.$inferInsert;
export type WellnessGoal = typeof wellnessGoalsTable.$inferSelect;
export type InsertWellnessGoal = typeof wellnessGoalsTable.$inferInsert;

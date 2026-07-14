import { pgTable, text, varchar, boolean, integer, timestamp, uuid, date, jsonb, numeric, pgEnum } from "drizzle-orm/pg-core";

export const financialGoalTypeEnum = pgEnum("financial_goal_type", [
  "savings", "debt_payoff", "investment", "emergency_fund", "business", "education", "home", "other",
]);

export const financialGoalsTable = pgTable("financial_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: financialGoalTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  deadline: date("deadline"),
  isAchieved: boolean("is_achieved").notNull().default(false),
  isPrivate: boolean("is_private").notNull().default(true),
  motivationNote: text("motivation_note"),
  milestones: jsonb("milestones").$type<Array<{ amount: number; label: string; achievedAt?: string }>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const financialCheckinsTable = pgTable("financial_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  goalId: uuid("goal_id").references(() => financialGoalsTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FinancialGoal = typeof financialGoalsTable.$inferSelect;
export type InsertFinancialGoal = typeof financialGoalsTable.$inferInsert;
export type FinancialCheckin = typeof financialCheckinsTable.$inferSelect;

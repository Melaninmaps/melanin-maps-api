import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const businessImprovementPlansTable = pgTable("business_improvement_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  issueType: varchar("issue_type", { length: 100 }),
  issueDescription: text("issue_description"),
  ownershipPreferences: jsonb("ownership_preferences").$type<string[]>().default([]).notNull(),
  serviceTypes: jsonb("service_types").$type<string[]>().default([]).notNull(),
  budget: varchar("budget", { length: 50 }),
  timeline: varchar("timeline", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  planData: jsonb("plan_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

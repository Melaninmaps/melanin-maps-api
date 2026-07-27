import { jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const businessAiPlanCacheTable = pgTable("business_ai_plan_cache", {
  id: serial("id").primaryKey(),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 30 }).notNull().default("navigator"),
  planData: jsonb("plan_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BusinessAiPlanCache = typeof businessAiPlanCacheTable.$inferSelect;

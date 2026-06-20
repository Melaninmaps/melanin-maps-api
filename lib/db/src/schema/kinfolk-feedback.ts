import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kinfolkFeedbackTable = pgTable("kinfolk_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id"),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  city: varchar("city", { length: 100 }),
  reaction: varchar("reaction", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKinfolkFeedbackSchema = createInsertSchema(kinfolkFeedbackTable).omit({
  id: true,
  createdAt: true,
});

export const selectKinfolkFeedbackSchema = createSelectSchema(kinfolkFeedbackTable);

export type KinfolkFeedbackRow = typeof kinfolkFeedbackTable.$inferSelect;
export type InsertKinfolkFeedback = z.infer<typeof insertKinfolkFeedbackSchema>;

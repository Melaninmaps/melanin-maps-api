import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pushTokensTable = pgTable("push_tokens", {
  userId: varchar("user_id").primaryKey(),
  token: varchar("token", { length: 500 }).notNull(),
  platform: varchar("platform", { length: 20 }).default("unknown"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPushTokenSchema = createInsertSchema(pushTokensTable);
export const selectPushTokenSchema = createSelectSchema(pushTokensTable);

export type PushTokenRow = typeof pushTokensTable.$inferSelect;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;

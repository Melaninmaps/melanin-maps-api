import { pgTable, serial, text, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  participantIds: jsonb("participant_ids").$type<string[]>().default([]).notNull(),
  businessId: text("business_id"),
  type: varchar("type", { enum: ["dm", "business", "ai"] }).notNull().default("business"),
  requestStatus: varchar("request_status", { enum: ["pending", "accepted"] }),
  requestedBy: text("requested_by"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  lastMessagePreview: text("last_message_preview"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

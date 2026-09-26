import { boolean, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SessionMessage = {
  role: "user" | "assistant";
  content: string;
  recommendations?: Record<string, unknown> | null;
  followUpSuggestions?: string[];
  /** A private, optional companion-note offer; never a persisted memory by itself. */
  companionMemoryOffer?: { label: string; prompt: string } | null;
  sources?: Array<{ title: string; url: string }>;
  timestamp: string;
};

export const kinfolkSessionsTable = pgTable("kinfolk_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 255 }),
  destination: varchar("destination", { length: 255 }),
  vibes: jsonb("vibes").$type<string[]>().default([]),
  messages: jsonb("messages").$type<SessionMessage[]>().default([]),
  shareId: varchar("share_id", { length: 64 }),
  // Archive and pin are reversible organization controls. They do not delete
  // source messages or alter their owner.
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  pinnedAt: timestamp("pinned_at", { withTimezone: true }),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKinfolkSessionSchema = createInsertSchema(kinfolkSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectKinfolkSessionSchema = createSelectSchema(kinfolkSessionsTable);

export type KinfolkSessionRow = typeof kinfolkSessionsTable.$inferSelect;
export type InsertKinfolkSession = z.infer<typeof insertKinfolkSessionSchema>;

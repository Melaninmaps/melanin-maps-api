import { boolean, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const founderProductKnowledgeTable = pgTable("founder_product_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: varchar("question", { length: 500 }).notNull(),
  answer: varchar("answer", { length: 6000 }).notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  approved: boolean("approved").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdByUserId: varchar("created_by_user_id").notNull(),
  updatedByUserId: varchar("updated_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const founderProductKnowledgeAuditTable = pgTable("founder_product_knowledge_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  knowledgeId: varchar("knowledge_id").notNull(),
  actorUserId: varchar("actor_user_id").notNull(),
  action: varchar("action", {
    enum: ["created", "updated", "approved", "unapproved", "archived", "restored"],
  }).notNull(),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFounderProductKnowledgeSchema = createInsertSchema(founderProductKnowledgeTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectFounderProductKnowledgeSchema = createSelectSchema(founderProductKnowledgeTable);
export type FounderProductKnowledge = typeof founderProductKnowledgeTable.$inferSelect;
export type InsertFounderProductKnowledge = z.infer<typeof insertFounderProductKnowledgeSchema>;

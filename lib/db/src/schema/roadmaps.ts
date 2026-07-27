import { pgTable, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./auth";

export const roadmapsTable = pgTable("roadmaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  topicId: varchar("topic_id", { length: 100 }),
  topicName: varchar("topic_name", { length: 200 }),
  intent: varchar("intent", { length: 100 }),
  coverEmoji: varchar("cover_emoji", { length: 10 }).notNull().default("🗺️"),
  isPublic: boolean("is_public").notNull().default(false),
  isAiGenerated: boolean("is_ai_generated").notNull().default(true),
  totalSteps: integer("total_steps").notNull().default(0),
  completedSteps: integer("completed_steps").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const roadmapStepsTable = pgTable("roadmap_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roadmapId: varchar("roadmap_id", { length: 100 }).notNull().references(() => roadmapsTable.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  categoryEmoji: varchar("category_emoji", { length: 10 }).notNull().default("📋"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isComplete: boolean("is_complete").notNull().default(false),
  completedAt: timestamp("completed_at"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  externalUrl: varchar("external_url", { length: 500 }),
  externalLabel: varchar("external_label", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

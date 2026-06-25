import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const knowledgeChannelsTable = pgTable("knowledge_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const channelFollowsTable = pgTable(
  "channel_follows",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    channelSlug: varchar("channel_slug", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("channel_follows_unique").on(t.userId, t.channelSlug)],
);

export type KnowledgeChannel = typeof knowledgeChannelsTable.$inferSelect;
export type ChannelFollow = typeof channelFollowsTable.$inferSelect;

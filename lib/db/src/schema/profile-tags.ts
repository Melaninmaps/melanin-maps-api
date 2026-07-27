import { pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const profileTagsTable = pgTable(
  "profile_tags",
  {
    id: serial("id").primaryKey(),
    taggerId: varchar("tagger_id").notNull(),
    taggedUserId: varchar("tagged_user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("profile_tags_tagger_tagged_idx").on(table.taggerId, table.taggedUserId)],
);

export type ProfileTag = typeof profileTagsTable.$inferSelect;
export type InsertProfileTag = typeof profileTagsTable.$inferInsert;

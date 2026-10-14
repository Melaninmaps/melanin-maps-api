import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/** Member-confirmed temporary context; never a preference, profile or generic memory. */
export const kinfolkCurrentChaptersTable = pgTable("kinfolk_current_chapters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 32 }).notNull(),
  note: text("note").notNull().default("[Encrypted private memory]"),
  encryptedContent: text("encrypted_content").notNull(),
  encryptionKeyId: varchar("encryption_key_id", { length: 64 }).notNull(),
  isSensitive: boolean("is_sensitive").notNull(),
  allowRelevantUse: boolean("allow_relevant_use").notNull().default(false),
  memberConfirmedAt: timestamp("member_confirmed_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("kinfolk_current_chapters_owner_history_idx").on(table.userId, table.endedAt, table.startedAt),
  check("kinfolk_current_chapters_kind_check", sql`${table.kind} IN ('career_change','relocation','caregiving','family_change','health_support','fertility','pregnancy','pregnancy_loss','later_pregnancy','grief','other')`),
  check("kinfolk_current_chapters_note_check", sql`${table.note} = '[Encrypted private memory]'`),
  check("kinfolk_current_chapters_sensitive_check", sql`${table.isSensitive} = (${table.kind} IN ('health_support','fertility','pregnancy','pregnancy_loss','later_pregnancy','grief'))`),
  check("kinfolk_current_chapters_dates_check", sql`${table.endedAt} IS NULL OR ${table.endedAt} >= ${table.startedAt}`),
]);
export type KinfolkCurrentChapter = typeof kinfolkCurrentChaptersTable.$inferSelect;

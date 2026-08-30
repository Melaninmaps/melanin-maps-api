import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const kinfolkPrivateMemoriesTable = pgTable(
  "kinfolk_private_memories",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 100 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    purpose: varchar("purpose", { length: 40 }).notNull().default("personalization"),
    sourceSessionId: varchar("source_session_id", { length: 100 }),
    isSensitive: boolean("is_sensitive").notNull().default(false),
    consentGrantedAt: timestamp("consent_granted_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("kinfolk_private_memories_user_active_idx").on(table.userId, table.revokedAt, table.expiresAt),
  ],
);

export type KinfolkPrivateMemory = typeof kinfolkPrivateMemoriesTable.$inferSelect;
export type InsertKinfolkPrivateMemory = typeof kinfolkPrivateMemoriesTable.$inferInsert;

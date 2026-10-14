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
    /** New ordinary writes use a nonsecret placeholder in content, never plaintext. */
    encryptedContent: text("encrypted_content"),
    encryptionKeyId: varchar("encryption_key_id", { length: 64 }),
    /** Owner-bound keyed duplicate token; internal only, never returned to clients. */
    contentFingerprint: varchar("content_fingerprint", { length: 64 }),
    purpose: varchar("purpose", { length: 40 }).notNull().default("personalization"),
    sourceSessionId: varchar("source_session_id", { length: 100 }),
    isSensitive: boolean("is_sensitive").notNull().default(false),
    consentGrantedAt: timestamp("consent_granted_at", { withTimezone: true }).notNull().defaultNow(),
    /** Null for pre-v2 sensitive memories until the member confirms the individual item again. */
    sensitiveConsentGrantedAt: timestamp("sensitive_consent_granted_at", { withTimezone: true }),
    /** Legacy-compatible AES-256-GCM sensitive-vault representation, unchanged. */
    sensitiveEncryptedContent: text("sensitive_encrypted_content"),
    /** Key identifier only; key material lives exclusively in server-side secret storage. */
    sensitiveEncryptionKeyId: varchar("sensitive_encryption_key_id", { length: 64 }),
    /** Sensitive details default to vault-only use and are never applied proactively. */
    sensitiveRestricted: boolean("sensitive_restricted").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** Explicit member pause; distinct from a member-chosen expiry date. */
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("kinfolk_private_memories_user_active_idx").on(table.userId, table.revokedAt, table.expiresAt),
    index("kinfolk_private_memories_user_review_idx").on(
      table.userId,
      table.revokedAt,
      table.pausedAt,
      table.expiresAt,
      table.createdAt,
    ),
  ],
);

export type KinfolkPrivateMemory = typeof kinfolkPrivateMemoriesTable.$inferSelect;
export type InsertKinfolkPrivateMemory = typeof kinfolkPrivateMemoriesTable.$inferInsert;

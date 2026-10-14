import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Separate, member-controlled setting for broad behavioral interaction evidence.
 * This is deliberately not a preference, current chapter, session, memory, or analytics table.
 */
export const kinfolkBehavioralEvidenceSettingsTable = pgTable(
  "kinfolk_behavioral_evidence_settings",
  {
    userId: varchar("user_id", { length: 100 })
      .primaryKey()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    mode: varchar("mode", { length: 12 }).notNull().default("off"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "kinfolk_behavioral_evidence_settings_mode_check",
      sql`${table.mode} IN ('off', 'review', 'on')`,
    ),
  ],
);

/**
 * Fixed-key, reviewable interaction patterns only. No messages, notes, locations,
 * sessions, response content, member facts, or identifiers other than the owner are stored.
 */
export const kinfolkBehavioralEvidenceTable = pgTable(
  "kinfolk_behavioral_evidence",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 100 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    signalKey: varchar("signal_key", { length: 64 }).notNull(),
    stance: varchar("stance", { length: 16 }).notNull(),
    count: integer("count").notNull().default(1),
    status: varchar("status", { length: 16 }).notNull(),
    provenance: varchar("provenance", { length: 48 }).notNull(),
    firstObservedAt: timestamp("first_observed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("kinfolk_behavioral_evidence_owner_signal_stance_key").on(
      table.userId,
      table.signalKey,
      table.stance,
    ),
    index("kinfolk_behavioral_evidence_owner_review_idx").on(
      table.userId,
      table.status,
      table.updatedAt,
    ),
    index("kinfolk_behavioral_evidence_owner_active_signal_idx").on(
      table.userId,
      table.status,
      table.signalKey,
    ),
    check(
      "kinfolk_behavioral_evidence_signal_key_check",
      sql`${table.signalKey} IN ('business_discovery', 'culture_entertainment', 'travel_planning', 'education_discovery', 'hobby_lifestyle')`,
    ),
    check(
      "kinfolk_behavioral_evidence_stance_check",
      sql`${table.stance} IN ('helpful', 'not_helpful')`,
    ),
    check(
      "kinfolk_behavioral_evidence_status_check",
      sql`${table.status} IN ('pending', 'active')`,
    ),
    check(
      "kinfolk_behavioral_evidence_count_check",
      sql`${table.count} > 0 AND ${table.count} <= 1000000`,
    ),
    check(
      "kinfolk_behavioral_evidence_provenance_check",
      sql`${table.provenance} = 'response_feedback_v1'`,
    ),
  ],
);

export type KinfolkBehavioralEvidence =
  typeof kinfolkBehavioralEvidenceTable.$inferSelect;

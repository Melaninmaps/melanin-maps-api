import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Governed, source-backed reference data for place names and pronunciation.
 * No member data is seeded by this schema. A reference is usable only when the
 * corresponding runtime query requires review_status = approved.
 */
export const kinfolkPlaceLanguageReferencesTable = pgTable(
  "kinfolk_place_language_references",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    canonicalId: varchar("canonical_id", { length: 160 }).notNull().unique(),
    writtenName: varchar("written_name", { length: 200 }).notNull(),
    aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
    languageCode: varchar("language_code", { length: 16 })
      .notNull()
      .default("en"),
    regionalProfile: varchar("regional_profile", { length: 64 }),
    locality: varchar("locality", { length: 120 }),
    region: varchar("region", { length: 120 }),
    countryCode: varchar("country_code", { length: 8 }),
    pronunciationGuidance: varchar("pronunciation_guidance", { length: 500 }),
    reviewStatus: varchar("review_status", { length: 24 })
      .notNull()
      .default("pending"),
    currentVersion: integer("current_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

/** Source receipts are separate from the usable reference so unreviewed evidence cannot affect voice behavior. */
export const kinfolkPlaceLanguageEvidenceTable = pgTable(
  "kinfolk_place_language_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceId: uuid("reference_id")
      .notNull()
      .references(() => kinfolkPlaceLanguageReferencesTable.id, {
        onDelete: "cascade",
      }),
    sourceType: varchar("source_type", { length: 48 }).notNull(),
    sourceLocator: text("source_locator").notNull(),
    sourceTitle: varchar("source_title", { length: 300 }),
    evidenceSummary: varchar("evidence_summary", { length: 1200 }).notNull(),
    reviewStatus: varchar("review_status", { length: 24 })
      .notNull()
      .default("pending"),
    reviewedBy: varchar("reviewed_by", { length: 255 }).references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

/** Versioned snapshots make reviewed reference changes auditable without storing member conversations. */
export const kinfolkPlaceLanguageReferenceRevisionsTable = pgTable(
  "kinfolk_place_language_reference_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceId: uuid("reference_id")
      .notNull()
      .references(() => kinfolkPlaceLanguageReferencesTable.id, {
        onDelete: "cascade",
      }),
    version: integer("version").notNull(),
    changeReason: varchar("change_reason", { length: 500 }).notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    changedBy: varchar("changed_by", { length: 255 }).references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

/** Private-by-default member pronunciation corrections; never a community training corpus. */
export const kinfolkMemberPronunciationCorrectionsTable = pgTable(
  "kinfolk_member_pronunciation_corrections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    referenceId: uuid("reference_id").references(
      () => kinfolkPlaceLanguageReferencesTable.id,
      { onDelete: "set null" },
    ),
    writtenForm: varchar("written_form", { length: 200 }).notNull(),
    pronunciationGuidance: varchar("pronunciation_guidance", {
      length: 500,
    }).notNull(),
    scope: varchar("scope", { length: 24 }).notNull().default("member_only"),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 24 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

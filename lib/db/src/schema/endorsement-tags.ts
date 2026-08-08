import { integer, jsonb, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { businessesTable } from "./businesses";

/**
 * Master endorsement tag definitions.
 * Seeded from endorsement_tags_seed.json v1.0 via POST /admin/seed-endorsement-tags.
 * 340 tags across 22 categories; never mutated by user actions.
 */
export const endorsementTagsTable = pgTable("endorsement_tags", {
  id: serial("id").primaryKey(),
  tagKey: varchar("tag_key", { length: 100 }).notNull().unique(),
  tagFamily: varchar("tag_family", { length: 100 }),
  tagType: varchar("tag_type", { length: 20 }).notNull(), // universal | adaptive | specific
  defaultLabel: varchar("default_label", { length: 200 }).notNull(),
  helperText: text("helper_text"),
  categoryIds: jsonb("category_ids").$type<number[]>().notNull().default([]),
  subcategoryKeys: jsonb("subcategory_keys").$type<string[]>().notNull().default([]),
  sortWeight: integer("sort_weight").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Cultural/linguistic variants of adaptive tag families.
 * Resolution order: (family, community, subcategory) → (family, community, NULL) → tag default_label.
 * Seeded from endorsement_tag_variants_seed.json v1.0.
 */
export const endorsementTagVariantsTable = pgTable(
  "endorsement_tag_variants",
  {
    id: serial("id").primaryKey(),
    tagFamily: varchar("tag_family", { length: 100 }).notNull(),
    communityCode: varchar("community_code", { length: 50 }).notNull(),
    displayLabel: varchar("display_label", { length: 200 }).notNull(),
    saidVerb: varchar("said_verb", { length: 50 }).notNull().default("said"),
    subcategoryKey: varchar("subcategory_key", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uniq_variant_family_community_sub").on(t.tagFamily, t.communityCode, t.subcategoryKey)],
);

/**
 * Per-user endorsement taps on a business.
 * One tap per user per tag per business. Aggregated count drives display.
 * Display threshold: 10 taps → tag becomes visible on the business profile.
 */
export const businessEndorsementTapsTable = pgTable(
  "business_endorsement_taps",
  {
    id: serial("id").primaryKey(),
    businessId: varchar("business_id")
      .notNull()
      .references(() => businessesTable.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tagKey: varchar("tag_key", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("uniq_biz_user_tagkey").on(t.businessId, t.userId, t.tagKey)],
);

export type EndorsementTag = typeof endorsementTagsTable.$inferSelect;
export type EndorsementTagVariant = typeof endorsementTagVariantsTable.$inferSelect;
export type BusinessEndorsementTap = typeof businessEndorsementTapsTable.$inferSelect;
export type InsertBusinessEndorsementTap = typeof businessEndorsementTapsTable.$inferInsert;

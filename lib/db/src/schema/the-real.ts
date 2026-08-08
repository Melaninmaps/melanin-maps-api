import { pgTable, text, timestamp, unique, integer, index } from "drizzle-orm/pg-core";

/**
 * THE REAL — Professional Trust Signal DB Tables
 *
 * Separate from endorsement_tags (which covers experience/retail/community categories).
 * THE REAL applies to professional/service categories: Health (clinical), Legal,
 * Financial, Professional Services, Home & Property, Automotive, Technology, Pets, Other.
 */

/** Master table of all 151 THE REAL tag definitions */
export const theRealTagsTable = pgTable("the_real_tags", {
  tagKey: text("tag_key").primaryKey(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(), // "real-specific" | "real-adaptive"
  adaptiveFamily: text("adaptive_family"),
  subcategoryScope: text("subcategory_scope").notNull().default("all"),
  helperText: text("helper_text").notNull().default(""),
  sortWeight: integer("sort_weight").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Community taps on THE REAL tags.
 * One tap per user per tag per business — unique constraint enforced.
 * Taps are additive (praise only). Concerns route to the safety/report flow.
 */
export const theRealTapsTable = pgTable(
  "the_real_taps",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id").notNull(),
    userId: text("user_id").notNull(),
    tagKey: text("tag_key").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // One tap per user per tag per business
    uniqueTap: unique("the_real_taps_business_user_tag").on(
      table.businessId,
      table.userId,
      table.tagKey
    ),
    businessIdx: index("the_real_taps_business_idx").on(table.businessId),
  })
);

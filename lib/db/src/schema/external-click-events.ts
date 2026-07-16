import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Tracks every outbound click to an external institution — cultural heritage sites,
 * hotels, employers, job boards, museums, nonprofits, etc.
 *
 * PRIVACY RULE: isSafetyRelated = true means this click context originated from a safety
 * report or employee safety story. This flag MUST be checked before sharing ANY data
 * with the institution. Aggregate click stats are only sent to institutions when
 * isSafetyRelated is FALSE.
 *
 * Distinction:
 *   - Employee safety tips / employee stories about employers → isSafetyRelated = true (never shared)
 *   - User clicking "Visit Website" on a cultural site → isSafetyRelated = false (trackable)
 *   - User applying to a job on Indeed → isSafetyRelated = false (trackable)
 *   - User tapping a support/giving link → isSafetyRelated = false (trackable)
 *   - User positively tagging an employer → isSafetyRelated = false (trackable)
 */
export const externalClickEventsTable = pgTable("external_click_events", {
  id: serial("id").primaryKey(),

  /** Human-readable name of the institution (e.g. "Howard University", "Hyatt", "Indeed") */
  institutionName: varchar("institution_name", { length: 255 }).notNull(),

  /**
   * Type of institution.
   * employer | university | museum | heritage_site | hotel | restaurant
   * | job_board | nonprofit | cultural_org | other
   */
  institutionType: varchar("institution_type", { length: 50 }).notNull().default("other"),

  /** The URL that was opened */
  institutionUrl: varchar("institution_url", { length: 500 }),

  /**
   * What kind of interaction triggered this click.
   * cultural_heritage_visit | job_apply | support_link | community_tag
   * | map_click | safety_hub | direct
   */
  referenceType: varchar("reference_type", { length: 50 }).notNull().default("direct"),

  /** ID of the related record (cultural site ID, job ID, etc.) */
  referenceId: varchar("reference_id", { length: 255 }),

  /** Where in the app the click happened */
  source: varchar("source", { length: 50 }).notNull().default("unknown"),
  // cultural_heritage | jobs | safety_hub | businesses | map | library | community

  /**
   * If TRUE: this click occurred in a safety/employee context.
   * Data MUST NEVER be shared with the institution.
   * If FALSE: aggregate stats may be reported to institution partners.
   */
  isSafetyRelated: boolean("is_safety_related").notNull().default(false),

  /** Nullable — anonymous clicks are still tracked for aggregate stats */
  userId: varchar("user_id", { length: 255 }),

  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),

  clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExternalClickEvent = typeof externalClickEventsTable.$inferSelect;
export type InsertExternalClickEvent = typeof externalClickEventsTable.$inferInsert;

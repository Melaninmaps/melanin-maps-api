import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * member_agreements — server-authoritative record of Community Agreement acceptance.
 *
 * Every member must have an active record here for their account to be treated
 * as a full member of the community. AsyncStorage on mobile acts only as a
 * local convenience cache; this table is the canonical source of truth.
 *
 * Rows are created automatically on signup and re-created when a new agreement
 * version is published.  Prior records are set active=false on re-acceptance;
 * they are never deleted (audit trail).
 */
export const memberAgreementsTable = pgTable("member_agreements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  agreementVersion: varchar("agreement_version", { length: 20 }).notNull().default("v1"),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  /** ios | android | web */
  platform: varchar("platform", { length: 20 }).notNull().default("web"),
  active: boolean("active").notNull().default(true),
  revokedAt: timestamp("revoked_at"),
});

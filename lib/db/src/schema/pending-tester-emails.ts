import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Approved tester emails waiting for account creation.
 *
 * When an admin approves a tester email before they have an account, the email
 * is recorded here. On registration (any auth path), the email is normalized,
 * checked against this table, and — if matched — the tester entitlement is
 * automatically applied to the new user row. The record is then marked applied.
 *
 * This allows:
 *   Admin approves email → tester registers later → entitlement auto-attaches
 * rather than requiring a manual second step.
 */
export const pendingTesterEmailsTable = pgTable(
  "pending_tester_emails",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Normalized (lowercase, trimmed) email address
    email: varchar("email").notNull().unique(),
    testerAccessSource: varchar("tester_access_source", {
      enum: ["testflight", "android_test", "admin_invite", "website_test"],
    }).notNull().default("admin_invite"),
    grantedBy: varchar("granted_by"),  // admin user ID
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    // Optional expiry — null means no expiry during testing period
    entitlementEndsAt: timestamp("entitlement_ends_at", { withTimezone: true }),
    // Set when an existing or newly-registered user is matched and updated
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    appliedToUserId: varchar("applied_to_user_id"),
  },
  (t) => [
    index("IDX_pending_tester_emails_email").on(t.email),
  ],
);

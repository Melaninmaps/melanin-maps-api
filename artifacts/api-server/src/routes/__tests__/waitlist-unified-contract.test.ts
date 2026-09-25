import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("unified waitlist and recovery contract", () => {
  const waitlistRoute = source("../waitlist.ts");
  const phoneAuthRoute = source("../phone-auth.ts");
  const authRoute = source("../auth.ts");
  const testerRoute = source("../admin-testers.ts");
  const approvalGate = source("../../lib/approvalGate.ts");
  const accessLedger = source("../../../../web/src/components/AdminAccessLedger.tsx");
  const schema = source("../../../../../lib/db/src/schema/waitlist.ts");

  it("keeps one email-keyed waitlist record and records only allowed join surfaces", () => {
    expect(schema).toContain('signupSources: text("signup_sources")');
    expect(waitlistRoute).toContain('const WAITLIST_SIGNUP_SOURCES = ["web", "ios", "android"]');
    expect(waitlistRoute).toContain("appendWaitlistSignupSource");
    expect(waitlistRoute).toContain("onConflictDoNothing()");
    expect(waitlistRoute).toContain("signupSource?: string");
  });

  it("keeps a member rollout city across repeat joins and recovers only clear earlier city answers", () => {
    expect(waitlistRoute).toContain("function normalizeWaitlistCity");
    expect(waitlistRoute).toContain("function parseStoredCityNomination");
    expect(waitlistRoute).toContain("city: priorEntry.city?.trim() ? priorEntry.city : normalizedCity");
    expect(waitlistRoute).toContain('"/admin/waitlist/recover-city-answers"');
    expect(waitlistRoute).toContain("ADMIN_WAITLIST_CITY_ANSWERS_RECOVERED");
    expect(waitlistRoute).toContain("heldForReview");
    expect(waitlistRoute).toContain("city_nomination for audit and restoration");
  });

  it("hides marked synthetic fixtures from the default people list", () => {
    const migrations = source("../../lib/startup-migrations.ts");
    expect(schema).toContain('isSyntheticTest: boolean("is_synthetic_test")');
    expect(waitlistRoute).toContain('syntheticFilter = String(req.query.synthetic ?? "people")');
    expect(waitlistRoute).toContain("eq(waitlistTable.isSyntheticTest, false)");
    expect(waitlistRoute).toContain('"/admin/waitlist/synthetic-tests/cleanup"');
    expect(waitlistRoute).toContain('"REMOVE SYNTHETIC TEST WAITLIST ENTRIES"');
    expect(migrations).toContain("lower(email) LIKE '%@example.com'");
    expect(migrations).toContain("lower(email) LIKE '%@testmwm.dev'");
    expect(migrations).not.toContain("test|smoke|regression|synthetic");
  });

  it("filters, exports, and bulk-approves the same selected city", () => {
    expect(waitlistRoute).toContain('const cityFilter = String(req.query.city ?? "").trim().slice(0, 120)');
    expect(waitlistRoute).toContain("cityOptions:");
    expect(waitlistRoute).toContain("cityParam = String(req.query.city ?? \"\").trim().toLowerCase()");
    expect(waitlistRoute).toContain("filter?: { status?: string; city?: string; synthetic?: \"people\" | \"only\" }");
    expect(waitlistRoute).toContain("filterCity");
  });

  it("returns city and platform rollout aggregates without adding a second person-level list", () => {
    expect(waitlistRoute).toContain("cityRollupResult, retainedTotalResult, archivedCountResult");
    expect(waitlistRoute).toContain("cityRollup:");
    expect(waitlistRoute).toContain("'[city not recorded]'");
    expect(waitlistRoute).toContain("sourceNotRecorded");
    expect(waitlistRoute).toContain("signupSources}, '') ~ '(^|,)ios(,|$)'");
    expect(accessLedger).toContain("Bulk tester access — paste or upload emails");
  });

  it("keeps App Store registrations in the same source-labelled waitlist and archives rather than deletes entries", () => {
    expect(waitlistRoute).toContain('"/admin/waitlist/reconcile-ios-registrations"');
    expect(waitlistRoute).toContain('signupSources: "ios"');
    expect(waitlistRoute).toContain("ADMIN_WAITLIST_IOS_RECONCILED");
    expect(waitlistRoute).toContain('status: "pending"');
    expect(waitlistRoute).toContain("status = 'archived'");
    expect(waitlistRoute).toContain('"archived"');
    expect(waitlistRoute).not.toContain("DELETE FROM waitlist_signups WHERE id = $1");
    expect(waitlistRoute).toContain('showingArchived');
    expect(waitlistRoute).toContain('retainedTotal');
    expect(waitlistRoute).toContain('archivedCount');
  });

  it("permits phone password recovery only for an already verified phone", () => {
    expect(phoneAuthRoute).toContain('"/auth/phone/forgot-password/send"');
    expect(phoneAuthRoute).toContain('"/auth/phone/reset-password"');
    expect(phoneAuthRoute).toContain("!user || !user.phoneVerified");
    expect(phoneAuthRoute).toContain("verificationChecks.create");
    expect(phoneAuthRoute).toContain("passwordHash");
  });

  it("defaults to closed access and preserves a deliberate tester bypass ledger", () => {
    expect(approvalGate).toContain('process.env.REQUIRE_APPROVAL !== "false"');
    expect(authRoute).toContain("ensureAuthenticatedWaitlistRecord");
    expect(authRoute).toContain('source: "ios"');
    expect(authRoute).toContain("approved: false");
    expect(phoneAuthRoute).toContain("APPROVED_EMAIL_REQUIRED");
    expect(testerRoute).toContain("upsertApprovedTesterWaitlistRecord");
    expect(testerRoute).toContain("approved = TRUE");
    expect(accessLedger).toContain("Bulk tester access — paste or upload emails");
    expect(accessLedger).toContain("Upload .txt or .csv");
  });

  it("returns the separate tester entitlement state beside each Waitlist record", () => {
    expect(waitlistRoute).toContain("testerStatus: tester?.tester_status ?? null");
    expect(waitlistRoute).toContain("pendingTesterAccess: pendingTesterEmails.has(email)");
    expect(waitlistRoute).toContain("pending_tester_emails");
    expect(testerRoute).toContain('router.post("/admin/testers/apply"');
    expect(testerRoute).toContain('router.delete("/admin/testers/:email"');
  });

  it("does not present an active tester as awaiting waitlist approval", () => {
    expect(waitlistRoute).toContain("async function hasActiveTesterEntitlement");
    expect(waitlistRoute).toContain('status: testerAccessActive ? "approved" : "pending"');
    expect(waitlistRoute).toContain("created && !testerAccessActive");
    expect(waitlistRoute).toContain("Once an account exists, its current lifecycle state is authoritative.");
    expect(waitlistRoute).toContain("testerAccessActive,");
  });
});

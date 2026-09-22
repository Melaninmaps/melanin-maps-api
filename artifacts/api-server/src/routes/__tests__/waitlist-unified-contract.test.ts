import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("unified waitlist and recovery contract", () => {
  const waitlistRoute = source("../waitlist.ts");
  const phoneAuthRoute = source("../phone-auth.ts");
  const schema = source("../../../../../lib/db/src/schema/waitlist.ts");

  it("keeps one email-keyed waitlist record and records only allowed join surfaces", () => {
    expect(schema).toContain('signupSources: text("signup_sources")');
    expect(waitlistRoute).toContain('const WAITLIST_SIGNUP_SOURCES = ["web", "ios", "android"]');
    expect(waitlistRoute).toContain("appendWaitlistSignupSource");
    expect(waitlistRoute).toContain("onConflictDoNothing()");
    expect(waitlistRoute).toContain("signupSource?: string");
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

  it("permits phone password recovery only for an already verified phone", () => {
    expect(phoneAuthRoute).toContain('"/auth/phone/forgot-password/send"');
    expect(phoneAuthRoute).toContain('"/auth/phone/reset-password"');
    expect(phoneAuthRoute).toContain("!user || !user.phoneVerified");
    expect(phoneAuthRoute).toContain("verificationChecks.create");
    expect(phoneAuthRoute).toContain("passwordHash");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSource = readFileSync(resolve(process.cwd(), "src/lib/startup-migrations.ts"), "utf8");

describe("adult-only meetup migration safety", () => {
  it("is additive and idempotent for identity acknowledgement columns", () => {
    expect(migrationSource).toContain("ADD COLUMN IF NOT EXISTS initiator_identity_acknowledged_at");
    expect(migrationSource).toContain("ADD COLUMN IF NOT EXISTS partner_identity_acknowledged_at");
    expect(migrationSource).toContain("ADD COLUMN IF NOT EXISTS initiator_identity_status_acknowledged");
    expect(migrationSource).toContain("ADD COLUMN IF NOT EXISTS partner_identity_status_acknowledged");
  });

  it("does not create or alter a minor-meetup workflow", () => {
    const meetupMigration = migrationSource.slice(
      migrationSource.indexOf("async function ensureConsentFirstMeetupSafetySchema"),
      migrationSource.indexOf("// ── Kinfolk Private Places"),
    );
    expect(meetupMigration).not.toContain("minor_meetup_guardian_approvals");
    expect(meetupMigration).not.toContain("UPDATE meetup_verifications");
    expect(meetupMigration).not.toContain("UPDATE users");
    expect(meetupMigration).not.toContain("DELETE FROM meetup_verifications");
    expect(meetupMigration).not.toContain("DELETE FROM users");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrations = readFileSync(
  new URL("../../lib/startup-migrations.ts", import.meta.url),
  "utf8",
);
const startup = readFileSync(new URL("../../index.ts", import.meta.url), "utf8");
const ownerSchema = readFileSync(
  new URL("../../../../../lib/db/src/schema/business-owner-links.ts", import.meta.url),
  "utf8",
);

describe("business owner-link lifecycle schema gate", () => {
  it("provisions and verifies approval, revocation, and update fields before traffic", () => {
    expect(migrations).toContain('name: "community_business_claims_v2_owner_links_cols"');
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS approved_at timestamptz");
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS revoked_at timestamptz");
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW()");
    expect(migrations).toContain("export async function ensureBusinessOwnerLinkLifecycleSchema");
    expect(migrations).toContain("SELECT claim_id, approved_by, approved_at, revoked_by, revoked_at, revocation_reason, updated_at FROM business_owner_links LIMIT 0");
    expect(startup).toContain("await ensureBusinessOwnerLinkLifecycleSchema(logger);");
  });

  it("keeps the Drizzle owner-link declaration aligned with the guarded lifecycle", () => {
    for (const field of [
      'claimId: varchar("claim_id")',
      'approvedAt: timestamp("approved_at"',
      'revokedAt: timestamp("revoked_at"',
      'updatedAt: timestamp("updated_at"',
    ]) {
      expect(ownerSchema).toContain(field);
    }
  });
});

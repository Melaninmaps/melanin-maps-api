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
    expect(migrations).toContain('"community_business_claims_v2_claims_cols"');
    expect(migrations).toContain('"community_business_claims_v3_business_lifecycle_cols"');
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS ownership_control_status varchar(50) NOT NULL DEFAULT 'unclaimed'");
    expect(migrations).toContain("SELECT claim_id, approved_by, approved_at, revoked_by, revoked_at, revocation_reason, updated_at FROM business_owner_links LIMIT 0");
    expect(migrations).toContain("SELECT claim_type, verification_method, evidence_url, evidence_summary, attested_at, reviewed_by, reviewed_at, decision_reason, withdrawn_at FROM business_claims LIMIT 0");
    expect(migrations).toContain("SELECT ownership_control_status, publication_status, profile_status FROM businesses LIMIT 0");
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

  it("provisions the duplicate-resolution dependency before public business detail reads", () => {
    expect(migrations).toContain("export async function ensureBusinessPublicDetailSchema");
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS public.business_duplicate_resolutions");
    expect(migrations).toContain("SELECT canonical_business_id, superseded_business_id, identity_evidence, policy_version, scoring FROM public.business_duplicate_resolutions LIMIT 0");
    expect(startup).toContain("await ensureBusinessPublicDetailSchema(logger);");
  });

  it("keeps the disposable claim reviewer entitlement behind a staging-only pre-traffic gate", () => {
    expect(migrations).toContain("export async function ensureIsolatedOwnerClaimReviewerFixtureSchema");
    expect(migrations).toContain("process.env.RAILWAY_ENVIRONMENT_NAME !== \"staging\"");
    expect(migrations).toContain("process.env.KINFOLK_MEMORY_STAGING_ISOLATION !== \"true\"");
    expect(migrations).toContain("process.env.KINFOLK_OWNER_CLAIM_REVIEWER_FIXTURE_ENABLED !== \"true\"");
    expect(migrations).toContain("CREATE TABLE IF NOT EXISTS owner_claim_reviewer_fixture_entitlements");
    expect(migrations).toContain("REFERENCES users(id) ON DELETE CASCADE");
    expect(migrations).toContain("scope = 'isolated_staging_validation'");
    expect(startup).toContain("await ensureIsolatedOwnerClaimReviewerFixtureSchema(logger);");
  });
});

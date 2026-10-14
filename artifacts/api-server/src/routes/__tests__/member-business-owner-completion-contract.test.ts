import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const claims = readFileSync(new URL("../claims.ts", import.meta.url), "utf8");
const businesses = readFileSync(new URL("../businesses.ts", import.meta.url), "utf8");
const businessSchema = readFileSync(
  new URL("../../../../../lib/db/src/schema/businesses.ts", import.meta.url),
  "utf8",
);
const claimSchema = readFileSync(
  new URL("../../../../../lib/db/src/schema/business-claims.ts", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL("../../../migrations/20261014_member_business_owner_source_only.sql", import.meta.url),
  "utf8",
);
const verification = readFileSync(
  new URL("../../services/business-owner/verification.ts", import.meta.url),
  "utf8",
);

describe("member-business owner completion contract", () => {
  it("keeps required lifecycle tables in an explicit source-only migration", () => {
    expect(migration).toContain("SOURCE-ONLY REVIEW MIGRATION — DO NOT AUTO-APPLY");
    expect(migration).toContain("business_claim_verification_challenges");
    expect(migration).toContain("business_manager_invitations");
    expect(migration).toContain("business_owner_links_active_lookup_idx");
    expect(migration).toContain("ALTER TABLE businesses");
    expect(migration).toContain("ownership_control_status");
    expect(migration).toContain("publication_status");
    expect(migration).toContain("ALTER TABLE business_claims");
    expect(migration).toContain("claim_type");
    expect(migration).toContain("decision_reason");
    expect(migration).not.toContain("INSERT INTO business_owner_links");
    expect(migration).not.toContain("UPDATE businesses SET");
  });

  it("uses expiring, attempt-limited, HMAC-protected private verification values", () => {
    expect(verification).toContain("hashPrivateCode");
    expect(verification).toContain("timingSafeEqual");
    expect(verification).toContain("CLAIM_VERIFICATION_MAX_ATTEMPTS = 5");
    expect(verification).toContain("CLAIM_VERIFICATION_TTL_MINUTES = 15");
    expect(verification).toContain("BUSINESS_CLAIM_VERIFICATION_ENABLED");
    expect(verification).toContain("BUSINESS_CLAIM_EMAIL_VERIFICATION_ENABLED");
  });

  it("keeps route lifecycle columns aligned with shared database schemas", () => {
    expect(businessSchema).toContain('ownershipControlStatus: varchar("ownership_control_status"');
    expect(businessSchema).toContain('publicationStatus: varchar("publication_status"');
    expect(businessSchema).toContain('verificationStatus: varchar("verification_status"');
    expect(claimSchema).toContain('claimType: varchar("claim_type"');
    expect(claimSchema).toContain('verificationMethod: varchar("verification_method"');
    expect(claimSchema).toContain('decisionReason: varchar("decision_reason"');
  });

  it("keeps personal login and private claim contact distinct", () => {
    expect(claims).toContain("Private review contact information");
    expect(claims).toContain("businessEmail");
    expect(claims).toContain("claimantPhone");
    expect(claims).not.toContain("UPDATE businesses SET phone");
  });

  it("uses explicit owner or manager authorization without widening legacy owner routes", () => {
    expect(businesses).toContain("function approvedOwnerPredicate");
    expect(businesses).toContain("function approvedBusinessManagementPredicate");
    expect(businesses).toContain("bol.role IN ('owner', 'manager')");
    expect(businesses).toContain('router.get("/businesses/mine/managed/:businessId"');
    expect(businesses).toContain('router.patch("/businesses/mine/managed/:businessId/profile"');
  });

  it("supports private disputes without creating an automatic ownership path", () => {
    expect(claims).toContain('action === "dispute"');
    expect(claims).toContain("status='disputed'");
    expect(claims).toContain("ownership_control_status='ownership_disputed'");
    expect(claims).toContain("Only a rejected claim can be disputed");
    expect(claims).toContain('router.post("/admin/business-claims/:id/approve"');
  });
});

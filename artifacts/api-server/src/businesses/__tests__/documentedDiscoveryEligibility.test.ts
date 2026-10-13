import { describe, expect, it } from "vitest";
import {
  DOCUMENTED_DISCOVERY_POLICY_VERSION,
  OWNERSHIP_EVIDENCE_STANDARD_POLICY_VERSION,
  documentedDiscoveryEligibilitySqlPredicate,
  isDocumentedDiscoveryEligible,
} from "../documentedDiscoveryEligibility";

const current = {
  eligibilityStatus: "qualified",
  policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
  identityEvidenceId: "identity-receipt",
  ownershipEvidenceId: "ownership-receipt",
  officialWebsiteEvidenceId: "website-receipt",
  officialSocialEvidenceId: "social-receipt",
  ownershipSourceExpiresAt: "2027-01-01T00:00:00.000Z",
  reviewAfter: "2026-12-01T00:00:00.000Z",
  ownershipDesignations: ["Black / African American-Owned"],
  ownershipEvidenceLevel: "OE3-D",
  ownershipEvidencePolicyVersion: OWNERSHIP_EVIDENCE_STANDARD_POLICY_VERSION,
} as const;
const now = new Date("2026-10-05T00:00:00.000Z");

describe("documented Discovery eligibility", () => {
  it("requires ownership plus one official presence and a current ownership review", () => {
    expect(isDocumentedDiscoveryEligible(current, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, identityEvidenceId: null }, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialSocialEvidenceId: null }, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialWebsiteEvidenceId: null }, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, officialWebsiteEvidenceId: null, officialSocialEvidenceId: null }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipSourceExpiresAt: "2026-10-04T23:59:59.000Z" }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, reviewAfter: "2026-10-04T23:59:59.000Z" }, "discovery", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipDesignations: [] }, "discovery", now)).toBe(false);
  });

  it("retains documented social-only businesses outside Map until a geocode is separately audited", () => {
    const socialOnly = { ...current, officialWebsiteEvidenceId: null };
    expect(isDocumentedDiscoveryEligible(socialOnly, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible(socialOnly, "map", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...socialOnly, mapPinEvidenceId: "geocode-receipt" }, "map", now)).toBe(true);
  });

  it("retains an official-social match when a separate website is invalid and holds records with neither presence", () => {
    const officialSocialOnly = { ...current, officialWebsiteEvidenceId: null, officialSocialEvidenceId: "linkedin-social-receipt" };
    expect(isDocumentedDiscoveryEligible(officialSocialOnly, "discovery", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...officialSocialOnly, officialSocialEvidenceId: null }, "discovery", now)).toBe(false);
  });

  it("requires a standard geocode receipt or a separately auditable legacy location attestation before a qualified profile can be a map pin", () => {
    expect(isDocumentedDiscoveryEligible(current, "map", now)).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, mapPinEvidenceId: "geocode-receipt" }, "map", now)).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, legacyMapLocationAttested: true }, "map", now)).toBe(true);
  });

  it("uses a fail-closed operational hold rather than an all-live fallback", () => {
    expect(isDocumentedDiscoveryEligible(current, "discovery", now, "hold")).toBe(false);
    expect(documentedDiscoveryEligibilitySqlPredicate("b.id", "discovery", "hold")).toBe("FALSE");
  });

  it("keeps the standard in observe mode until an immutable-ID reconciliation is explicitly enforced", () => {
    const legacyUnclassified = {
      ...current,
      ownershipEvidenceLevel: null,
      ownershipEvidencePolicyVersion: null,
    };
    expect(isDocumentedDiscoveryEligible(legacyUnclassified, "discovery", now, undefined, "observe")).toBe(true);
    expect(isDocumentedDiscoveryEligible(legacyUnclassified, "discovery", now, undefined, "enforce")).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipEvidenceLevel: "OE0" }, "discovery", now, undefined, "enforce")).toBe(false);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipEvidenceLevel: "OE1" }, "discovery", now, undefined, "enforce")).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipEvidenceLevel: "OE2" }, "discovery", now, undefined, "enforce")).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipEvidenceLevel: "OE3-V" }, "discovery", now, undefined, "enforce")).toBe(true);
    expect(isDocumentedDiscoveryEligible({ ...current, ownershipEvidencePolicyVersion: "obsolete" }, "discovery", now, undefined, "enforce")).toBe(false);
  });

  it("adds the evidence-level condition only in explicit enforcement mode", () => {
    const observe = documentedDiscoveryEligibilitySqlPredicate("b.id", "discovery", undefined, "observe");
    const enforced = documentedDiscoveryEligibilitySqlPredicate("b.id", "discovery", undefined, "enforce");
    expect(observe).not.toContain("ownership_evidence_level IN");
    expect(enforced).toContain("ownership_evidence_policy_version");
    expect(enforced).toContain("ownership_evidence_level IN ('OE1', 'OE2', 'OE3-D', 'OE3-V')");
  });

  it("builds a static server predicate with receipt, expiry, and surface guards", () => {
    const discovery = documentedDiscoveryEligibilitySqlPredicate("b.id");
    const map = documentedDiscoveryEligibilitySqlPredicate('"businesses"."id"', "map");
    expect(discovery).toContain("public.business_discovery_eligibility");
    expect(discovery).toContain("ownership_evidence_id IS NOT NULL");
    expect(discovery).toContain("official_website_evidence_id IS NOT NULL");
    expect(discovery).toContain("official_social_evidence_id IS NOT NULL");
    expect(discovery).toContain(" OR ");
    expect(discovery).toContain("ownership_source_expires_at > CURRENT_TIMESTAMP");
    expect(discovery).toContain("review_after > CURRENT_TIMESTAMP");
    expect(map).toContain("map_pin_evidence_id IS NOT NULL");
    expect(map).toContain("business_legacy_map_location_attestations");
    expect(map).toContain("business_legacy_map_location_attestation_events");
    expect(map).toContain('"businesses"."id"');
  });
});

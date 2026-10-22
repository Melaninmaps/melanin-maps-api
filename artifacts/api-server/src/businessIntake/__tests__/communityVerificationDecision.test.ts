import { describe, expect, it } from "vitest";
import {
  assessCommunityVerification,
  communityVerificationSubjectFromInput,
  needsOnlyPreciseLocation,
  sourceOnlyCommunityVerificationEvidence,
  withPreciseLocationEvidence,
  type CommunityVerificationCheck,
  type CommunityVerificationEvidence,
} from "../communityVerificationDecision";

const input = communityVerificationSubjectFromInput({
  submissionIntent: "community",
  name: "Community Books",
  category: "Books & Media",
  description: "An independent neighborhood bookstore.",
  address: "123 Main Street",
  city: "Philadelphia",
  state: "PA",
  country: "USA",
  website: "https://communitybooks.example/",
  ownershipDesignations: ["Black / African American-Owned"],
  communityReportedOwnership: "minority_owned",
});

function freshReference(check: CommunityVerificationCheck, index: number) {
  const observedAt = new Date(Date.now() - 60_000).toISOString();
  const revalidateAfter = new Date(Date.now() + 14 * 24 * 60 * 60 * 1_000).toISOString();
  return {
    check,
    sourceUrl: `https://evidence${index}.example/receipt`,
    observedAt,
    revalidateAfter,
    sourceSnapshotSha256: String(index).repeat(64),
  };
}

function verifiedEvidence(): CommunityVerificationEvidence {
  return {
    accountEligibility: "verified",
    businessExistence: "verified",
    officialIdentity: "verified",
    crossFieldConsistency: "verified",
    minorityOwnership: "verified",
    operatingStatus: "verified",
    duplicateRisk: "verified",
    coordinatedActivity: "verified",
    contentSafety: "verified",
    preciseLocation: "verified",
    sourceReferences: [
      freshReference("business_existence", 1),
      freshReference("official_identity", 2),
      freshReference("minority_ownership", 3),
      freshReference("operating_status", 4),
      freshReference("precise_location", 5),
    ],
  };
}

describe("community verification decision", () => {
  it("passes only when every required verification check has independently verified current provenance", () => {
    const decision = assessCommunityVerification(input, verifiedEvidence());

    expect(decision).toMatchObject({ outcome: "PASS", canPublish: true });
    expect(decision.missingChecks).toEqual([]);
    expect(decision.failedChecks).toEqual([]);
    expect(decision.escalatedChecks).toEqual([]);
  });

  it("retains only fresh HTTPS, hashed, revalidation-dated, de-duplicated server-supplied source references", () => {
    const observedAt = new Date(Date.now() - 60_000).toISOString();
    const revalidateAfter = new Date(Date.now() + 14 * 24 * 60 * 60 * 1_000).toISOString();
    const decision = assessCommunityVerification(input, {
      ...sourceOnlyCommunityVerificationEvidence(),
      sourceReferences: [
        {
          check: "official_identity",
          sourceUrl: "https://communitybooks.example/about",
          sourceLabel: " Official business page ",
          observedAt,
          revalidateAfter,
          sourceSnapshotSha256: "A".repeat(64),
        },
        {
          check: "official_identity",
          sourceUrl: "https://communitybooks.example/about",
          observedAt,
          revalidateAfter,
          sourceSnapshotSha256: "A".repeat(64),
        },
        {
          check: "minority_ownership",
          sourceUrl: "http://untrusted.example/evidence",
          observedAt,
          revalidateAfter,
          sourceSnapshotSha256: "B".repeat(64),
        },
        {
          check: "business_existence",
          sourceUrl: "https://registry.example/record",
          observedAt: "not-a-date",
          revalidateAfter,
          sourceSnapshotSha256: "C".repeat(64),
        },
        {
          check: "operating_status",
          sourceUrl: "https://registry.example/stale",
          observedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1_000).toISOString(),
          revalidateAfter,
          sourceSnapshotSha256: "D".repeat(64),
        },
      ],
    });

    expect(decision.evidenceSnapshot.sources).toEqual([{
      check: "official_identity",
      sourceUrl: "https://communitybooks.example/about",
      sourceLabel: "Official business page",
      observedAt,
      revalidateAfter,
      sourceSnapshotSha256: "a".repeat(64),
    }]);
  });

  it("fails closed when an externally verified check lacks current provenance", () => {
    const evidence = verifiedEvidence();
    evidence.sourceReferences = evidence.sourceReferences?.filter((reference) => reference.check !== "minority_ownership");

    const decision = assessCommunityVerification(input, evidence);

    expect(decision).toMatchObject({ outcome: "INCOMPLETE", canPublish: false });
    expect(decision.missingChecks).toContain("minority_ownership");
  });

  it("holds privately with a correction-safe message when ownership evidence is missing", () => {
    const decision = assessCommunityVerification(input, {
      ...verifiedEvidence(),
      minorityOwnership: "missing",
    });

    expect(decision).toMatchObject({ outcome: "INCOMPLETE", canPublish: false });
    expect(decision.missingChecks).toEqual(["minority_ownership"]);
    expect(decision.publicMessage).toContain("Saved privately");
    expect(decision.publicMessage).not.toContain("minority_ownership");
    expect(decision.auditNote).toContain("minority_ownership");
  });

  it("fails closed when injected evidence disproves business existence", () => {
    const decision = assessCommunityVerification(input, {
      ...verifiedEvidence(),
      businessExistence: "failed",
    });

    expect(decision).toMatchObject({ outcome: "FAIL", canPublish: false });
    expect(decision.failedChecks).toEqual(["business_existence"]);
  });

  it("escalates suspicious duplicate signals and unsupported accusations without publishing", () => {
    const duplicateDecision = assessCommunityVerification(input, {
      ...verifiedEvidence(),
      duplicateRisk: "escalate",
    });
    const unsafeDecision = assessCommunityVerification({
      ...input,
      description: "Avoid this business because the owner is a scammer.",
    }, verifiedEvidence());

    expect(duplicateDecision).toMatchObject({ outcome: "ESCALATE", canPublish: false });
    expect(duplicateDecision.escalatedChecks).toEqual(["duplicate_risk"]);
    expect(unsafeDecision).toMatchObject({ outcome: "ESCALATE", canPublish: false });
    expect(unsafeDecision.escalatedChecks).toContain("content_safety");
  });

  it("uses an injected source-only interface and never treats supplied URLs as proof", () => {
    const withoutLocation = sourceOnlyCommunityVerificationEvidence();
    const decision = assessCommunityVerification(input, withoutLocation);
    const locationOnly = assessCommunityVerification(
      input,
      withPreciseLocationEvidence(verifiedEvidence(), "missing"),
    );

    expect(decision).toMatchObject({ outcome: "INCOMPLETE", canPublish: false });
    expect(decision.missingChecks).toEqual(expect.arrayContaining([
      "business_existence",
      "official_identity",
      "minority_ownership",
      "operating_status",
    ]));
    expect(locationOnly.outcome).toBe("INCOMPLETE");
    expect(needsOnlyPreciseLocation(locationOnly)).toBe(true);
  });
});

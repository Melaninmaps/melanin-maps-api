import { describe, expect, it, vi } from "vitest";
import { deriveBusinessSubject } from "../business-subject";
import { discoverLocalBusinesses } from "../local-business-discovery";

const documented = {
  id: "documented-1", name: "Documented Auto", category: "auto repair", subcategory: null,
  description: "Repair", city: "Houston", stateCode: "TX", country: "US", isOnlineOnly: false,
  latitude: null, longitude: null, distanceMiles: null, phone: null, website: null, verified: true,
  claimed: false, blackOwned: false, ownershipClaim: null, ownershipDesignations: ["black-african-american"],
  tags: [], specialties: ["auto repair"], profileStatus: null, story: null, missionStatement: null,
  whyStarted: null, whatCustomersShouldKnow: null, ownershipBadges: [], communityValues: [], audiencesServed: [],
  vibes: [], accessibilityFeatures: [], communityInitiatives: [], growthGoals: [], audienceType: null,
  environmentTags: [], amenityTags: [], matchReasons: ["category"], researchSourceUrl: "https://example.test/receipt",
  researchSourceLabel: "Receipt", sourceCapturedAt: "2026-10-08", sourceReceipt: true, identityReasons: [],
};
const undocumented = {
  ...documented, id: "undocumented-1", name: "Ownership Pending Auto", ownershipDesignations: [],
  researchSourceUrl: null, researchSourceLabel: null, sourceCapturedAt: null, sourceReceipt: false,
};

describe("governed no-result ownership-documentation cohort", () => {
  it("returns only a separately labeled ownership-undocumented cohort after explicit expansion", async () => {
    const subject = deriveBusinessSubject("Find a mechanic in Houston");
    expect(subject?.key).toBe("auto_repair");
    const repository = {
      findBySubject: vi.fn().mockResolvedValue([documented, undocumented]),
      findByPreferenceTerms: vi.fn().mockResolvedValue([]),
      findPublishedMapEntities: vi.fn().mockResolvedValue([]),
    };
    const output = await discoverLocalBusinesses({
      scope: { city: "Houston", stateCode: "TX" },
      subject: subject!,
      repository,
      allowAllPublicPlaces: true,
      ownershipDocumentationScope: "not_documented",
      webSearch: vi.fn().mockResolvedValue({
        state: "completed", attempted: true, provider: "test", fallbackUsed: false, partial: false, results: [],
      }),
    });

    expect(output.discovery.platformBusinesses).toHaveLength(1);
    expect(output.discovery.platformBusinesses[0]).toMatchObject({
      name: "Ownership Pending Auto", ownershipStatus: "not_documented", ownershipEvidence: null,
    });
    expect(output.resultView.cards[0]).toMatchObject({ ownershipStatus: "not_documented" });
    expect(output.discovery.platformBusinesses[0]?.name).not.toBe("Documented Auto");
  });

  it("keeps a broadened documented scope source-backed and labels all-public expansion as non-matching", async () => {
    const subject = deriveBusinessSubject("Find a mechanic in Houston");
    const repository = {
      findBySubject: vi.fn().mockResolvedValue([documented, undocumented]),
      findByPreferenceTerms: vi.fn().mockResolvedValue([]),
      findPublishedMapEntities: vi.fn().mockResolvedValue([]),
    };
    const webSearch = vi.fn();
    const documentedScope = await discoverLocalBusinesses({
      scope: { city: "Houston", stateCode: "TX" }, subject: subject!, repository,
      strictEvidenceRequired: true, documentedOwnershipScope: true, webSearch,
    });
    expect(webSearch).not.toHaveBeenCalled();
    expect(documentedScope.discovery.platformBusinesses).toEqual([
      expect.objectContaining({ name: "Documented Auto", ownershipStatus: "documented" }),
    ]);

    const allPublic = await discoverLocalBusinesses({
      scope: { city: "Houston", stateCode: "TX" }, subject: subject!, repository,
      allowAllPublicPlaces: true,
      webSearch: vi.fn().mockResolvedValue({
        state: "completed", attempted: true, provider: "test", fallbackUsed: false, partial: false, results: [],
      }),
    });
    expect(allPublic.resultView.cards).toEqual(expect.arrayContaining([
      expect.objectContaining({ ownershipStatus: "not_matched" }),
    ]));
  });
});

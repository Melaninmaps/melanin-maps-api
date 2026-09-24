import { describe, expect, it } from "vitest";
import {
  activationReceiptHash,
  buildDirectoryOnlyBusinessProfile,
  isDirectoryOnlyDiscoveryCandidate,
} from "../completedCohortDirectoryDiscovery";

const locationHold = (overrides = {}) => ({
  sourceRow: 120,
  sourceRowId: "completed-120",
  dedupeKey: "physical|example-cafe|philadelphia|pa|united-states|120-main-street",
  targetKind: "business",
  name: "Example Café",
  city: "Philadelphia",
  state: "PA",
  country: "United States",
  status: "needs_research",
  outboxError: "geocode_unverified: address did not meet strict street match",
  rawRecord: {
    category: "Restaurant",
    subcategory: "Café",
    address: "120 Main Street",
    website: "https://example-cafe.test/",
    source_url: "https://source-directory.test/example-cafe",
    ownership_designations: ["Black owned", "Woman-Owned"],
    mwm_publication_classification: "source_reported_mwm_designation",
  },
  ...overrides,
});

describe("completed cohort directory-only discovery", () => {
  it("builds a searchable public record while intentionally leaving map coordinates absent", () => {
    const candidate = locationHold();
    expect(isDirectoryOnlyDiscoveryCandidate(candidate)).toBe(true);
    const profile = buildDirectoryOnlyBusinessProfile(candidate);

    expect(profile).toMatchObject({
      name: "Example Café",
      city: "Philadelphia",
      state: "PA",
      isOnlineOnly: false,
      blackOwned: true,
      ownershipClaim: "source_reported_ownership_unverified",
      website: "https://example-cafe.test/",
      sourceUrl: "https://source-directory.test/example-cafe",
    });
    expect(profile.ownershipDesignations).toEqual(expect.arrayContaining([
      "Black owned",
      "Black / African American-Owned",
      "Woman-Owned",
    ]));
    expect(profile.id).toMatch(/^cohort-[a-f0-9]{24}$/);
    expect(profile.dedupeKey).toBe(candidate.dedupeKey);
  });

  it("refuses to turn a non-business or unclassified row into a directory listing", () => {
    expect(isDirectoryOnlyDiscoveryCandidate(locationHold({ targetKind: "cultural_place" }))).toBe(false);
    expect(isDirectoryOnlyDiscoveryCandidate(locationHold({ outboxError: "unclassified failure" }))).toBe(false);
    expect(() => buildDirectoryOnlyBusinessProfile(locationHold({ city: null }))).toThrow(
      "COMPLETED_COHORT_DIRECTORY_ONLY_CANDIDATE_REQUIRED",
    );
  });

  it("uses a deterministic receipt-bound activation hash", () => {
    const candidate = locationHold();
    expect(activationReceiptHash(candidate)).toMatch(/^[a-f0-9]{64}$/);
    expect(activationReceiptHash(candidate)).toBe(activationReceiptHash(candidate));
    expect(activationReceiptHash(locationHold({ sourceRow: 121 }))).not.toBe(activationReceiptHash(candidate));
  });
});

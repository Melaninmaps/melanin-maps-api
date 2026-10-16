import { describe, expect, it } from "vitest";
import {
  INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT,
  INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT,
  INTERNATIONAL_DIRECTORY_ONLY_SCOPE,
  internationalDirectoryOnlyEvidence,
  internationalDirectoryOnlyManifestFingerprint,
  matchesInternationalDirectoryOnlyAuditedCoordinate,
  matchesInternationalDirectoryOnlyManifest,
  parseInternationalDirectoryOnlyManifest,
} from "../internationalDirectoryOnlyVisibility";

function approvedShape(index: number) {
  return {
    id: `international-${index}`,
    name: `International place ${index}`,
    country: "Canada",
    expectedListingStatus: "archived",
    expectedAccountStatus: "suspended",
    expectedWebsite: index % 2 === 0 ? `https://example-${index}.test/` : null,
    expectedLatitude: index % 2 === 0 ? null : 43.5,
    expectedLongitude: index % 2 === 0 ? null : -79.4,
    restoreReasons: [
      index % 2 === 0 ? "verified_official_website" : "country_consistent_map_pin",
    ],
    restoreTo: "live_unclaimed",
    prohibitedChanges: ["Kinfolk Current", "ownership designations", "coordinate"],
  };
}

describe("reviewed international directory-only visibility", () => {
  it("parses only the complete fixed-shape audit manifest", () => {
    const manifest = {
      scope: INTERNATIONAL_DIRECTORY_ONLY_SCOPE,
      generatedAt: INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT,
      count: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT,
      items: Array.from({ length: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT }, (_, index) => approvedShape(index)),
    };
    const parsed = parseInternationalDirectoryOnlyManifest(manifest);
    expect(parsed?.items).toHaveLength(INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT);
    expect(internationalDirectoryOnlyManifestFingerprint(manifest)).toHaveLength(64);
    // Test fixtures have the required shape but cannot impersonate the
    // compiled founder-approved manifest fingerprint.
    expect(matchesInternationalDirectoryOnlyManifest(manifest)).toBe(false);
  });

  it("rejects any row without a verified website or country-consistent pin", () => {
    const manifest = {
      scope: INTERNATIONAL_DIRECTORY_ONLY_SCOPE,
      generatedAt: INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT,
      count: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT,
      items: Array.from({ length: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT }, (_, index) => ({
        ...approvedShape(index),
        ...(index === 0
          ? { expectedWebsite: null, expectedLatitude: null, expectedLongitude: null, restoreReasons: ["verified_official_website"] }
          : {}),
      })),
    };
    expect(parseInternationalDirectoryOnlyManifest(manifest)).toBeNull();
  });

  it("stores only the reviewed Directory evidence, never a promotion signal", () => {
    const parsed = parseInternationalDirectoryOnlyManifest({
      scope: INTERNATIONAL_DIRECTORY_ONLY_SCOPE,
      generatedAt: INTERNATIONAL_DIRECTORY_ONLY_GENERATED_AT,
      count: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT,
      items: Array.from({ length: INTERNATIONAL_DIRECTORY_ONLY_MANIFEST_COUNT }, (_, index) => approvedShape(index)),
    });
    const evidence = internationalDirectoryOnlyEvidence(parsed!.items[0]!);
    expect(evidence).toMatchObject({
      reasons: ["verified_official_website"],
      verifiedOfficialWebsite: "https://example-0.test/",
    });
    expect(evidence).not.toHaveProperty("ownershipDesignations");
    expect(evidence).not.toHaveProperty("kinfolkCatalogState");
  });

  it("compares audited map pins safely when PostgreSQL returns a numeric string", () => {
    expect(matchesInternationalDirectoryOnlyAuditedCoordinate("17.9870000", 17.987)).toBe(true);
    expect(matchesInternationalDirectoryOnlyAuditedCoordinate("-76.7713000", -76.7713)).toBe(true);
    expect(matchesInternationalDirectoryOnlyAuditedCoordinate("not-a-coordinate", 17.987)).toBe(false);
    expect(matchesInternationalDirectoryOnlyAuditedCoordinate("17.988", 17.987)).toBe(false);
    expect(matchesInternationalDirectoryOnlyAuditedCoordinate(null, 17.987)).toBe(false);
  });
});

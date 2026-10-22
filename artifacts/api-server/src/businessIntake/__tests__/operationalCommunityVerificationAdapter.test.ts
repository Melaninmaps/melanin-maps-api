import { describe, expect, it, vi } from "vitest";
import {
  assessCommunityVerification,
  withPreciseLocationEvidence,
  type CommunityVerificationSubject,
} from "../communityVerificationDecision";
import {
  createOperationalCommunityVerificationEvidenceResolver,
  isPublicInternetAddress,
  observeGoogleCanonicalWebsite,
  resolvePinnedPublicHttpsAddress,
} from "../operationalCommunityVerificationAdapter";

const subject: CommunityVerificationSubject = {
  name: "Community Books",
  category: "Books & Media",
  description: "A neighborhood bookstore.",
  address: "123 Main Street",
  city: "Philadelphia",
  state: "PA",
  country: "USA",
  website: "https://communitybooks.com/",
  ownershipDesignations: ["Black / African American-Owned"],
  communityReportedOwnership: "minority_owned",
};

const place = {
  placeId: "ChIJ-community-books",
  name: "Community Books",
  formattedAddress: "123 Main Street, Philadelphia, PA 19106, USA",
  lat: 39.9526,
  lng: -75.1652,
  businessStatus: "OPERATIONAL",
  candidateCount: 1,
};

const details = {
  name: "Community Books",
  formattedAddress: "123 Main Street, Philadelphia, PA 19106, USA",
  website: "https://communitybooks.com/about",
  businessStatus: "OPERATIONAL",
  lat: 39.9526,
  lng: -75.1652,
};

function places(search = vi.fn().mockResolvedValue(place), detail = vi.fn().mockResolvedValue(details)) {
  return { search, details: detail };
}

const observedAt = "2026-10-22T17:30:00.000Z";
const revalidateAfter = "2026-11-21T17:30:00.000Z";

function exactLocationReference() {
  return {
    check: "precise_location" as const,
    sourceUrl: "https://nominatim.openstreetmap.org/search",
    observedAt,
    revalidateAfter,
    sourceSnapshotSha256: "c".repeat(64),
  };
}

describe("operational community verification adapter", () => {
  it("requires independently observed Places, canonical-site, and exact-location evidence before allowing a complete verification decision", async () => {
    const observation = vi.fn().mockResolvedValue({
      sourceUrl: "https://communitybooks.com/about",
      observedAt,
      sourceSnapshotSha256: "a".repeat(64),
      ownershipDesignations: ["Black / African American-Owned"],
    });
    const resolver = createOperationalCommunityVerificationEvidenceResolver({
      places: places(),
      observeOfficialWebsite: observation,
      now: () => new Date(observedAt),
    });

    const evidence = await resolver(subject);
    const decision = assessCommunityVerification(
      subject,
      withPreciseLocationEvidence(evidence, "verified", exactLocationReference()),
    );

    expect(evidence).toMatchObject({
      businessExistence: "verified",
      officialIdentity: "verified",
      crossFieldConsistency: "verified",
      minorityOwnership: "verified",
      operatingStatus: "verified",
      duplicateRisk: "verified",
      preciseLocation: "missing",
    });
    expect(observation).toHaveBeenCalledWith("https://communitybooks.com/about", "Community Books");
    expect(evidence.sourceReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        check: "minority_ownership",
        sourceUrl: "https://communitybooks.com/about",
        revalidateAfter,
      }),
      expect.objectContaining({ check: "business_existence", sourceUrl: expect.stringContaining("place_id:") }),
    ]));
    expect(decision.outcome).toBe("PASS");
    expect(decision.canPublish).toBe(true);
  });

  it("keeps a member submission private when Places evidence is unavailable and never fetches the member URL", async () => {
    const observation = vi.fn();
    const resolver = createOperationalCommunityVerificationEvidenceResolver({
      places: places(vi.fn().mockResolvedValue(null)),
      observeOfficialWebsite: observation,
    });

    const evidence = await resolver({ ...subject, website: "https://member-supplied.example/" });

    expect(evidence).toMatchObject({
      businessExistence: "missing",
      officialIdentity: "missing",
      minorityOwnership: "missing",
      operatingStatus: "missing",
      duplicateRisk: "verified",
    });
    expect(observation).not.toHaveBeenCalled();
    expect(assessCommunityVerification(subject, evidence).canPublish).toBe(false);
  });

  it("fails ambiguous provider results, conflicting member websites, and non-operational records rather than publishing on partial evidence", async () => {
    const observation = vi.fn().mockResolvedValue({
      sourceUrl: "https://communitybooks.com/about",
      observedAt,
      sourceSnapshotSha256: "b".repeat(64),
      ownershipDesignations: ["Black / African American-Owned"],
    });
    const ambiguousResolver = createOperationalCommunityVerificationEvidenceResolver({
      places: places(vi.fn().mockResolvedValue({ ...place, candidateCount: 2 })),
      observeOfficialWebsite: observation,
    });
    const resolver = createOperationalCommunityVerificationEvidenceResolver({
      places: places(undefined, vi.fn().mockResolvedValue({
        ...details,
        businessStatus: "CLOSED_PERMANENTLY",
      })),
      observeOfficialWebsite: observation,
    });

    const ambiguousEvidence = await ambiguousResolver(subject);
    const evidence = await resolver({ ...subject, website: "https://member-supplied.example/" });
    const decision = assessCommunityVerification(
      subject,
      withPreciseLocationEvidence(evidence, "verified", exactLocationReference()),
    );

    expect(ambiguousEvidence.businessExistence).toBe("failed");
    expect(observation).toHaveBeenCalledTimes(1);
    expect(evidence.crossFieldConsistency).toBe("failed");
    expect(evidence.operatingStatus).toBe("failed");
    expect(decision.outcome).toBe("FAIL");
    expect(decision.canPublish).toBe(false);
  });

  it("pins canonical-site DNS to public addresses and rejects private or rebinding answers before connection", async () => {
    const publicLookup = vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const mixedLookup = vi.fn().mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);

    expect(await resolvePinnedPublicHttpsAddress("communitybooks.com", publicLookup)).toEqual({
      address: "93.184.216.34",
      family: 4,
    });
    expect(await resolvePinnedPublicHttpsAddress("communitybooks.com", mixedLookup)).toBeNull();
    expect(isPublicInternetAddress("10.0.0.1")).toBe(false);
    expect(isPublicInternetAddress("100.64.0.1")).toBe(false);
    expect(isPublicInternetAddress("169.254.1.1")).toBe(false);
    expect(isPublicInternetAddress("fc00::1")).toBe(false);
    expect(isPublicInternetAddress("93.184.216.34")).toBe(true);
  });

  it("refuses redirects and oversized canonical-site bodies and stores a hash rather than page contents", async () => {
    const validFetch = vi.fn().mockResolvedValue(new Response(
      "<html><head><title>Community Books</title></head><body>Philadelphia's Black-owned bookstore.</body></html>",
      { headers: { "content-type": "text/html", "content-length": "108" } },
    ));
    const redirectFetch = vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: "https://other.example/" },
    }));
    const oversizedFetch = vi.fn().mockResolvedValue(new Response(
      `<html><title>Community Books</title>${"x".repeat(256 * 1024)}</html>`,
      { headers: { "content-type": "text/html" } },
    ));

    const observed = await observeGoogleCanonicalWebsite(
      "https://communitybooks.com/about",
      "Community Books",
      { fetchForTestOnly: validFetch, now: () => new Date(observedAt) },
    );
    const redirected = await observeGoogleCanonicalWebsite(
      "https://communitybooks.com/about",
      "Community Books",
      { fetchForTestOnly: redirectFetch },
    );
    const oversized = await observeGoogleCanonicalWebsite(
      "https://communitybooks.com/about",
      "Community Books",
      { fetchForTestOnly: oversizedFetch },
    );
    const unsafe = await observeGoogleCanonicalWebsite(
      "http://127.0.0.1/private",
      "Community Books",
      { fetchForTestOnly: validFetch },
    );

    expect(observed).toMatchObject({
      sourceUrl: "https://communitybooks.com/about",
      ownershipDesignations: ["Black / African American-Owned"],
      sourceSnapshotSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(Object.values(observed ?? {})).not.toContain("Philadelphia's Black-owned bookstore.");
    expect(redirected).toBeNull();
    expect(oversized).toBeNull();
    expect(unsafe).toBeNull();
    expect(validFetch).toHaveBeenCalledTimes(1);
    expect(validFetch).toHaveBeenCalledWith(
      "https://communitybooks.com/about",
      expect.objectContaining({ redirect: "manual" }),
    );
  });
});

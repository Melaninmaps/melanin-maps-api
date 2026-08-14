import { describe, expect, it, beforeEach } from "vitest";
import { ingestSocialFirstCandidate } from "./social-first-ingestion";

const base = {
  category: "laundromat",
  city: "Atlanta",
  state: "GA",
  address: "123 Auburn Ave NE, Atlanta, GA 30303",
  latitude: 33.7563,
  longitude: -84.3735,
  phone: null,
  website: null,
  socialProfiles: [],
  ownershipClaim: "Black-owned",
  ownershipEvidence: [{ url: "https://example.org/about", sourceType: "official_website", field: "ownership", supports: true, excerpt: "Black-owned" }],
  sourceEvidence: [{ url: "https://example.org/about", sourceType: "official_website", field: "identity", supports: true, excerpt: "Example Laundry" }, { url: "https://example.org/location", sourceType: "official_website", field: "address", supports: true, excerpt: "123 Auburn Ave NE, Atlanta, GA 30303" }],
  sourceInput: "natural_language" as const,
};

async function countCanonical(name: string) {
  // Replace with a read-only DB helper in the Replit test environment.
  return dbCount({ normalizedName: name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() });
}

describe("tour social-first ingestion", () => {
  beforeEach(async () => resetTestDatabase());

  it("adds a verified Black-owned laundromat with Instagram but no website", async () => {
    const result = await ingestSocialFirstCandidate({
      ...base,
      name: "Example Laundry",
      socialProfiles: [{ platform: "instagram", url: "https://instagram.com/examplelaundry", handle: "@examplelaundry", suppliedByUser: true }],
      sourceInput: "social_url",
    }, "Black-owned");
    expect(result.status).toBe("VERIFIED_ADD");
    const row = await getCanonical(result.canonicalId!);
    expect(row.website).toBeNull();
    expect(row.socialProfiles).toEqual(expect.arrayContaining([expect.objectContaining({ platform: "instagram" })]));
  });

  it("preserves TikTok, Instagram, and Facebook supplied by the user", async () => {
    const result = await ingestSocialFirstCandidate({
      ...base,
      name: "Three Platform Laundry",
      socialProfiles: [
        { platform: "tiktok", url: "https://www.tiktok.com/@threeplatform", handle: "@threeplatform", suppliedByUser: true },
        { platform: "instagram", url: "https://instagram.com/threeplatform", handle: "@threeplatform", suppliedByUser: true },
        { platform: "facebook", url: "https://facebook.com/threeplatform", handle: null, suppliedByUser: true },
      ],
      sourceInput: "screenshot",
    }, "Black-owned");
    expect(result.status).toBe("VERIFIED_ADD");
    const row = await getCanonical(result.canonicalId!);
    expect(row.socialProfiles).toHaveLength(3);
  });

  it("does not add a candidate with a social handle but no identity/location evidence", async () => {
    const result = await ingestSocialFirstCandidate({
      name: "Possibly Real Laundry", ...base, address: null, latitude: null, longitude: null,
      sourceEvidence: [], ownershipEvidence: [],
      socialProfiles: [{ platform: "tiktok", url: "https://tiktok.com/@possiblyreal", handle: "@possiblyreal", suppliedByUser: true }],
    }, "Black-owned");
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonical("Possibly Real Laundry")).toBe(0);
  });

  it("does not claim minority ownership from a name alone", async () => {
    const result = await ingestSocialFirstCandidate({
      ...base, name: "Black Star Laundry", ownershipEvidence: [],
      socialProfiles: [{ platform: "instagram", url: "https://instagram.com/blackstarlaundry", handle: "@blackstarlaundry", suppliedByUser: true }],
    }, "Black-owned");
    expect(result.status).toBe("MANUAL_REVIEW");
  });

  it("does not invent a fourth business when only three are verified", async () => {
    const verified = [
      { ...base, name: "Laundry One" },
      { ...base, name: "Laundry Two", address: "200 Peachtree St NE, Atlanta, GA 30303", latitude: 33.7600, longitude: -84.3870 },
      { ...base, name: "Laundry Three", address: "300 Edgewood Ave SE, Atlanta, GA 30312", latitude: 33.7530, longitude: -84.3800 },
    ];
    const results = await Promise.all(verified.map((candidate) => ingestSocialFirstCandidate(candidate, "Black-owned")));
    expect(results.filter((r) => r.status === "VERIFIED_ADD")).toHaveLength(3);
    expect(await countAllCanonical({ city: "Atlanta", category: "laundromat", ownership: "Black-owned" })).toBe(3);
    // The user-facing response must say three verified, not fabricate a fourth.
  });

  it("returns EXISTING_UPDATE on the same social URL imported twice", async () => {
    const candidate = { ...base, name: "Repeat Laundry", socialProfiles: [{ platform: "instagram", url: "https://instagram.com/repeatlaundry", handle: "@repeatlaundry", suppliedByUser: true }] };
    const first = await ingestSocialFirstCandidate(candidate, "Black-owned");
    const second = await ingestSocialFirstCandidate(candidate, "Black-owned");
    expect(first.status).toBe("VERIFIED_ADD");
    expect(second.status).toBe("EXISTING_UPDATE");
    expect(await countCanonical("Repeat Laundry")).toBe(1);
  });

  it("keeps same-name businesses in different cities separate", async () => {
    const atlanta = { ...base, name: "City Laundry", city: "Atlanta", state: "GA" };
    const virginia = { ...base, name: "City Laundry", city: "Richmond", state: "VA", address: "10 Broad St, Richmond, VA 23219", latitude: 37.54, longitude: -77.44 };
    const a = await ingestSocialFirstCandidate(atlanta, "Black-owned");
    const b = await ingestSocialFirstCandidate(virginia, "Black-owned");
    expect(a.status).toBe("VERIFIED_ADD");
    expect(b.status).toBe("VERIFIED_ADD");
    expect(await countCanonical("City Laundry")).toBe(2);
  });

  it("does not use a missing website as a reason to invent one", async () => {
    const result = await ingestSocialFirstCandidate({ ...base, name: "Social Only Laundry", website: null, socialProfiles: [{ platform: "facebook", url: "https://facebook.com/socialonlylaundry", handle: null, suppliedByUser: true }] }, "Black-owned");
    expect(result.status).toBe("VERIFIED_ADD");
    const row = await getCanonical(result.canonicalId!);
    expect(row.website).toBeNull();
    expect(row.socialProfiles[0].url).toContain("facebook.com");
  });
});

// Test-environment adapters supplied by the Replit test harness.
declare function resetTestDatabase(): Promise<void>;
declare function dbCount(filter: Record<string, unknown>): Promise<number>;
declare function countAllCanonical(filter: Record<string, unknown>): Promise<number>;
declare function getCanonical(id: string): Promise<any>;

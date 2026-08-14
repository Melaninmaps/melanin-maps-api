/**
 * Social-First Ingestion Tests — MWM
 *
 * Adapted from Manus's MWM_SOCIAL_FIRST_INGESTION_TESTS package.
 * Uses pool.query directly for test helpers (no mocks — hits the Replit
 * dev DB so tests reflect real schema behavior).
 *
 * Run: pnpm --filter @workspace/api-server test
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { pool } from "@workspace/db";
import { ingestSocialFirstCandidate, norm } from "../lib/social-first-ingestion";

// ── Test data scope ───────────────────────────────────────────────────────────
// All test businesses use city="__TEST__" so cleanup is fully scoped.

const TEST_CITY = "__SFTEST__";

const base = {
  category: "laundromat",
  city: TEST_CITY,
  state: "GA",
  address: "123 Auburn Ave NE, Atlanta, GA 30303",
  latitude: 33.7563,
  longitude: -84.3735,
  phone: null,
  website: null,
  socialProfiles: [] as any[],
  ownershipClaim: "Black-owned",
  ownershipEvidence: [
    {
      url: "https://example.org/about",
      sourceType: "official_website" as const,
      field: "ownership" as const,
      supports: true,
      excerpt: "Black-owned",
    },
  ],
  sourceEvidence: [
    {
      url: "https://example.org/about",
      sourceType: "official_website" as const,
      field: "identity" as const,
      supports: true,
      excerpt: "Example Laundry",
    },
    {
      url: "https://example.org/location",
      sourceType: "official_website" as const,
      field: "address" as const,
      supports: true,
      excerpt: "123 Auburn Ave NE",
    },
  ],
  sourceInput: "natural_language" as const,
};

// ── Test helpers ──────────────────────────────────────────────────────────────

async function resetTestScope(): Promise<void> {
  await pool.query(
    `DELETE FROM businesses WHERE city = $1`,
    [TEST_CITY],
  );
  // Also clean up review items queued during tests
  await pool.query(
    `DELETE FROM business_review_items WHERE candidate_city = $1`,
    [TEST_CITY],
  );
}

async function dbCount(filter: { normalizedName: string }): Promise<number> {
  const { rows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM businesses WHERE normalized_name = $1 AND city = $2`,
    [filter.normalizedName, TEST_CITY],
  );
  return parseInt(rows[0]?.cnt ?? "0", 10);
}

async function countAllCanonical(filter: {
  city: string;
  category?: string;
  ownership?: string;
}): Promise<number> {
  const { rows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt
     FROM businesses
     WHERE city = $1
       AND coalesce(is_duplicate, false) = false
       AND coalesce(status,'active') NOT IN ('duplicate','permanently_hidden')`,
    [TEST_CITY],
  );
  return parseInt(rows[0]?.cnt ?? "0", 10);
}

async function getCanonical(id: string): Promise<{
  id: string;
  website: string | null;
  social_profiles: any[];
  ownership_claim: string | null;
}> {
  const { rows } = await pool.query(
    `SELECT id, website, social_profiles, ownership_claim FROM businesses WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw new Error(`No business found with id ${id}`);
  return {
    ...rows[0],
    social_profiles: rows[0].social_profiles ?? [],
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("tour social-first ingestion", () => {
  beforeEach(async () => {
    await resetTestScope();
  });

  afterEach(async () => {
    await resetTestScope();
  });

  it("adds a verified Black-owned laundromat with Instagram but no website", async () => {
    const result = await ingestSocialFirstCandidate(
      {
        ...base,
        name: "Example Laundry",
        socialProfiles: [
          {
            platform: "instagram",
            url: "https://instagram.com/examplelaundry",
            handle: "@examplelaundry",
            suppliedByUser: true,
          },
        ],
        sourceInput: "social_url",
      },
      "Black-owned",
    );

    expect(result.status).toBe("VERIFIED_ADD");
    if (result.status !== "VERIFIED_ADD") return;

    const row = await getCanonical(result.canonicalId);
    expect(row.website).toBeNull();
    expect(row.social_profiles).toEqual(
      expect.arrayContaining([expect.objectContaining({ platform: "instagram" })]),
    );
  });

  it("preserves TikTok, Instagram, and Facebook supplied by the user", async () => {
    const result = await ingestSocialFirstCandidate(
      {
        ...base,
        name: "Three Platform Laundry",
        address: "200 Peachtree St NE, Atlanta, GA 30303",
        latitude: 33.76,
        longitude: -84.387,
        socialProfiles: [
          { platform: "tiktok", url: "https://www.tiktok.com/@threeplatform", handle: "@threeplatform", suppliedByUser: true },
          { platform: "instagram", url: "https://instagram.com/threeplatform", handle: "@threeplatform", suppliedByUser: true },
          { platform: "facebook", url: "https://facebook.com/threeplatform", handle: null, suppliedByUser: true },
        ],
        sourceInput: "screenshot",
      },
      "Black-owned",
    );

    expect(result.status).toBe("VERIFIED_ADD");
    if (result.status !== "VERIFIED_ADD") return;

    const row = await getCanonical(result.canonicalId);
    expect(row.social_profiles).toHaveLength(3);
  });

  it("does not add a candidate with a social handle but no identity/location evidence", async () => {
    const result = await ingestSocialFirstCandidate(
      {
        ...base,
        name: "Possibly Real Laundry",
        address: null,
        latitude: null,
        longitude: null,
        sourceEvidence: [],
        ownershipEvidence: [],
        socialProfiles: [
          { platform: "tiktok", url: "https://tiktok.com/@possiblyreal", handle: "@possiblyreal", suppliedByUser: true },
        ],
      },
      "Black-owned",
    );

    expect(result.status).toBe("MANUAL_REVIEW");
    expect(
      await dbCount({ normalizedName: norm("Possibly Real Laundry") }),
    ).toBe(0);
  });

  it("does not claim minority ownership from a name alone", async () => {
    const result = await ingestSocialFirstCandidate(
      {
        ...base,
        name: "Black Star Laundry",
        address: "400 Auburn Ave NE, Atlanta, GA 30312",
        latitude: 33.752,
        longitude: -84.372,
        ownershipEvidence: [],
        socialProfiles: [
          { platform: "instagram", url: "https://instagram.com/blackstarlaundry", handle: "@blackstarlaundry", suppliedByUser: true },
        ],
      },
      "Black-owned",
    );

    expect(result.status).toBe("MANUAL_REVIEW");
  });

  it("does not invent a fourth business when only three are verified", async () => {
    const three = [
      { ...base, name: "Laundry One" },
      { ...base, name: "Laundry Two", address: "200 Peachtree St NE, Atlanta, GA 30303", latitude: 33.76, longitude: -84.387 },
      { ...base, name: "Laundry Three", address: "300 Edgewood Ave SE, Atlanta, GA 30312", latitude: 33.753, longitude: -84.38 },
    ];

    const results = await Promise.all(
      three.map((candidate) => ingestSocialFirstCandidate(candidate, "Black-owned")),
    );

    expect(results.filter((r) => r.status === "VERIFIED_ADD")).toHaveLength(3);
    expect(await countAllCanonical({ city: TEST_CITY, category: "laundromat", ownership: "Black-owned" })).toBe(3);
  });

  it("returns EXISTING_UPDATE on the same social URL imported twice", async () => {
    const candidate = {
      ...base,
      name: "Repeat Laundry",
      socialProfiles: [
        { platform: "instagram" as const, url: "https://instagram.com/repeatlaundry", handle: "@repeatlaundry", suppliedByUser: true },
      ],
    };

    const first = await ingestSocialFirstCandidate(candidate, "Black-owned");
    const second = await ingestSocialFirstCandidate(candidate, "Black-owned");

    expect(first.status).toBe("VERIFIED_ADD");
    expect(second.status).toBe("EXISTING_UPDATE");
    expect(await dbCount({ normalizedName: norm("Repeat Laundry") })).toBe(1);
  });

  it("keeps same-name businesses in different cities separate", async () => {
    const cityA = { ...base, name: "City Laundry", city: TEST_CITY, state: "GA" };
    const cityB = {
      ...base,
      name: "City Laundry",
      city: `${TEST_CITY}_B`,
      state: "VA",
      address: "10 Broad St, Richmond, VA 23219",
      latitude: 37.54,
      longitude: -77.44,
    };

    const a = await ingestSocialFirstCandidate(cityA, "Black-owned");
    const b = await ingestSocialFirstCandidate(cityB, "Black-owned");

    expect(a.status).toBe("VERIFIED_ADD");
    expect(b.status).toBe("VERIFIED_ADD");

    // Cleanup city B separately since it's not in TEST_CITY
    await pool.query(`DELETE FROM businesses WHERE city = $1`, [`${TEST_CITY}_B`]);
    await pool.query(`DELETE FROM business_review_items WHERE candidate_city = $1`, [`${TEST_CITY}_B`]);
  });

  it("does not use a missing website as a reason to invent one", async () => {
    const result = await ingestSocialFirstCandidate(
      {
        ...base,
        name: "Social Only Laundry",
        address: "500 Peachtree St NE, Atlanta, GA 30308",
        latitude: 33.78,
        longitude: -84.385,
        website: null,
        socialProfiles: [
          { platform: "facebook" as const, url: "https://facebook.com/socialonlylaundry", handle: null, suppliedByUser: true },
        ],
      },
      "Black-owned",
    );

    expect(result.status).toBe("VERIFIED_ADD");
    if (result.status !== "VERIFIED_ADD") return;

    const row = await getCanonical(result.canonicalId);
    expect(row.website).toBeNull();
    expect(row.social_profiles[0].url).toContain("facebook.com");
  });
});

/**
 * Hotel-Stay Ingestion Tests — MWM
 *
 * Adapted from Manus's MWM_HOTEL_STAY_INGESTION_TESTS package.
 * The geocodeHotel function is injected as a mock — no real API calls.
 * Tests run against the Replit dev DB (same schema as Railway).
 *
 * Run: pnpm --filter @workspace/api-server test
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { pool } from "@workspace/db";
import { ingestHotelStay } from "../lib/hotel-stay-ingestion";

// ── Test scope ────────────────────────────────────────────────────────────────
// All test hotels use provider_place_id prefixed "test-hotel-" for scoped cleanup.

const TEST_PREFIX = "test-hotel-";

const hotelInput = {
  name: "Example Grand Hotel",
  address: "100 Market Street, Richmond, VA 23219",
  sourceInput: "hotel_stay" as const,
};

const providerPlace = {
  providerPlaceId: `${TEST_PREFIX}example-grand`,
  name: "Example Grand Hotel",
  formattedAddress: "100 Market Street, Richmond, VA 23219, USA",
  city: "Richmond",
  state: "VA",
  postalCode: "23219",
  country: "US",
  latitude: 37.5407,
  longitude: -77.436,
  phone: "+1 804 555 0100",
  website: "https://example-grand.invalid",
  types: ["lodging", "hotel"],
  providerUrl: "https://maps.example.invalid/test-place-example-grand",
};

// ── Test helpers ──────────────────────────────────────────────────────────────

async function resetTestScope(): Promise<void> {
  await pool.query(
    `DELETE FROM businesses WHERE provider_place_id LIKE $1`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM business_review_items WHERE candidate_name LIKE $1`,
    ["%Example%Hotel%"],
  );
  await pool.query(
    `DELETE FROM business_review_items WHERE candidate_name = $1`,
    ["Hotel That Cannot Be Resolved"],
  );
  await pool.query(
    `DELETE FROM business_review_items WHERE candidate_name = $1`,
    ["Example Restaurant"],
  );
}

async function countCanonicalHotels(): Promise<number> {
  const { rows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM businesses
     WHERE provider_place_id LIKE $1
       AND coalesce(is_duplicate, false) = false
       AND coalesce(status,'active') NOT IN ('duplicate','permanently_hidden')`,
    [`${TEST_PREFIX}%`],
  );
  return parseInt(rows[0]?.cnt ?? "0", 10);
}

async function countHotelByProviderId(id: string): Promise<number> {
  const { rows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM businesses WHERE provider_place_id = $1`,
    [id],
  );
  return parseInt(rows[0]?.cnt ?? "0", 10);
}

async function getHotelByProviderId(id: string): Promise<any> {
  const { rows } = await pool.query(
    `SELECT * FROM businesses WHERE provider_place_id = $1 LIMIT 1`,
    [id],
  );
  if (!rows[0]) throw new Error(`No hotel found with provider_place_id ${id}`);
  return rows[0];
}

async function getPendingReviewCount(): Promise<number> {
  const { rows } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM business_review_items
     WHERE status = 'pending' AND review_type = 'hotel_stay'
       AND (candidate_name = 'Hotel That Cannot Be Resolved'
            OR candidate_name LIKE 'Example%Hotel%'
            OR candidate_name = 'Example Restaurant')`,
  );
  return parseInt(rows[0]?.cnt ?? "0", 10);
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("MWM non-minority hotel-stay ingestion", () => {
  beforeEach(async () => {
    await resetTestScope();
  });

  afterEach(async () => {
    await resetTestScope();
  });

  it("adds a resolvable ordinary hotel from name and address", async () => {
    const result = await ingestHotelStay(hotelInput, async () => ({
      place: providerPlace,
      score: 0.98,
    }));
    expect(result.status).toBe("VERIFIED_ADD");
    expect(await countCanonicalHotels()).toBe(1);
    const row = await getHotelByProviderId(providerPlace.providerPlaceId);
    expect(row.category).toBe("hotel");
    expect(row.address).toContain("100 Market Street");
    expect(row.ownership_claim ?? null).toBeNull();
  });

  it("returns EXISTING_UPDATE and does not duplicate an identical stay", async () => {
    const resolver = async () => ({ place: providerPlace, score: 0.98 });
    const first = await ingestHotelStay(hotelInput, resolver);
    const second = await ingestHotelStay(hotelInput, resolver);
    expect(first.status).toBe("VERIFIED_ADD");
    expect(second.status).toBe("EXISTING_UPDATE");
    expect(
      await countHotelByProviderId(providerPlace.providerPlaceId),
    ).toBe(1);
  });

  it("does not invent missing website, phone, coordinates, or address fields", async () => {
    const sparsePlace = {
      ...providerPlace,
      website: null,
      phone: null,
      latitude: null,
      longitude: null,
    };
    const result = await ingestHotelStay(hotelInput, async () => ({
      place: sparsePlace,
      score: 0.9,
    }));
    // Address still complete → allowed to add; unavailable fields stay null.
    expect(result.status).toBe("VERIFIED_ADD");
    const row = await getHotelByProviderId(providerPlace.providerPlaceId);
    expect(row.website).toBeNull();
    expect(row.phone).toBeNull();
    expect(row.latitude).toBeNull();
    expect(row.longitude).toBeNull();
  });

  it("sends an unresolved name/address to manual review and adds nothing", async () => {
    const result = await ingestHotelStay(
      {
        name: "Hotel That Cannot Be Resolved",
        address: "999 Unknown Road, Nowhere",
      },
      async () => ({ place: null, score: 0 }),
    );
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonicalHotels()).toBe(0);
    expect(await getPendingReviewCount()).toBe(1);
  });

  it("sends a provider name mismatch to manual review", async () => {
    const wrongPlace = {
      ...providerPlace,
      name: "Different Hotel At Similar Address",
    };
    const result = await ingestHotelStay(hotelInput, async () => ({
      place: wrongPlace,
      score: 0.95,
    }));
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonicalHotels()).toBe(0);
  });

  it("sends a non-hotel place to manual review", async () => {
    const restaurant = {
      ...providerPlace,
      providerPlaceId: `${TEST_PREFIX}restaurant`,
      types: ["restaurant"],
      name: "Example Restaurant",
    };
    const result = await ingestHotelStay(
      { name: "Example Restaurant", address: hotelInput.address },
      async () => ({ place: restaurant, score: 0.99 }),
    );
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonicalHotels()).toBe(0);
  });

  it("keeps same-name hotels in different cities separate", async () => {
    const first = await ingestHotelStay(hotelInput, async () => ({
      place: providerPlace,
      score: 0.98,
    }));
    // Atlanta fixture must have its own phone and website — real hotels in
    // different cities never share a phone number or a property-specific URL.
    const atlantaPlace = {
      ...providerPlace,
      providerPlaceId: `${TEST_PREFIX}example-grand-atlanta`,
      formattedAddress: "100 King Street, Atlanta, GA 30303, USA",
      city: "Atlanta",
      state: "GA",
      postalCode: "30303",
      latitude: 33.749,
      longitude: -84.388,
      phone: "+1 404 555 0200",
      website: "https://example-grand-atlanta.invalid",
    };
    const second = await ingestHotelStay(
      {
        name: "Example Grand Hotel",
        address: "100 King Street, Atlanta, GA 30303",
      },
      async () => ({ place: atlantaPlace, score: 0.98 }),
    );
    expect(first.status).toBe("VERIFIED_ADD");
    expect(second.status).toBe("VERIFIED_ADD");
    expect(await countCanonicalHotels()).toBe(2);
  });

  it("prevents concurrent duplicate inserts", async () => {
    const resolver = async () => ({ place: providerPlace, score: 0.98 });
    const results = await Promise.all(
      Array.from({ length: 10 }, () => ingestHotelStay(hotelInput, resolver)),
    );
    expect(
      results.filter((r) => r.status === "VERIFIED_ADD"),
    ).toHaveLength(1);
    expect(
      await countHotelByProviderId(providerPlace.providerPlaceId),
    ).toBe(1);
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { ingestHotelStay } from "./hotel-stay-ingestion";

// Replit must replace these adapters with test fixtures or provider mocks that
// return real-shaped provider responses without exposing API keys.
declare function resetTestDatabase(): Promise<void>;
declare function countCanonicalHotels(): Promise<number>;
declare function countHotelByProviderId(id: string): Promise<number>;
declare function getHotelByProviderId(id: string): Promise<any>;
declare function getPendingReviewCount(): Promise<number>;

describe("MWM non-minority hotel-stay ingestion", () => {
  beforeEach(async () => resetTestDatabase());

  const hotelInput = { name: "Example Grand Hotel", address: "100 Market Street, Richmond, VA 23219", sourceInput: "hotel_stay" as const };
  const providerPlace = {
    providerPlaceId: "test-place-example-grand",
    name: "Example Grand Hotel",
    formattedAddress: "100 Market Street, Richmond, VA 23219, USA",
    city: "Richmond", state: "VA", postalCode: "23219", country: "US",
    latitude: 37.5407, longitude: -77.4360,
    phone: "+1 804 555 0100", website: "https://example-grand.invalid",
    types: ["lodging", "hotel"], providerUrl: "https://maps.example.invalid/test-place-example-grand",
  };

  it("adds a resolvable ordinary hotel from name and address", async () => {
    const result = await ingestHotelStay(hotelInput, async () => ({ place: providerPlace, score: 0.98 }));
    expect(result.status).toBe("VERIFIED_ADD");
    expect(await countCanonicalHotels()).toBe(1);
    const row = await getHotelByProviderId(providerPlace.providerPlaceId);
    expect(row.category).toBe("hotel");
    expect(row.address).toContain("100 Market Street");
    expect(row.ownershipClaim ?? null).toBeNull();
  });

  it("returns EXISTING_UPDATE and does not duplicate an identical stay", async () => {
    const resolver = async () => ({ place: providerPlace, score: 0.98 });
    const first = await ingestHotelStay(hotelInput, resolver);
    const second = await ingestHotelStay(hotelInput, resolver);
    expect(first.status).toBe("VERIFIED_ADD");
    expect(second.status).toBe("EXISTING_UPDATE");
    expect(await countHotelByProviderId(providerPlace.providerPlaceId)).toBe(1);
  });

  it("does not invent missing website, phone, coordinates, or address fields", async () => {
    const sparsePlace = { ...providerPlace, website: null, phone: null, latitude: null, longitude: null };
    const result = await ingestHotelStay(hotelInput, async () => ({ place: sparsePlace, score: 0.90 }));
    // Address is still complete, so adding is allowed; unavailable fields remain null.
    expect(result.status).toBe("VERIFIED_ADD");
    const row = await getHotelByProviderId(providerPlace.providerPlaceId);
    expect(row.website).toBeNull();
    expect(row.phone).toBeNull();
    expect(row.latitude).toBeNull();
    expect(row.longitude).toBeNull();
  });

  it("sends an unresolved name/address to manual review and adds nothing", async () => {
    const result = await ingestHotelStay({ name: "Hotel That Cannot Be Resolved", address: "999 Unknown Road, Nowhere" }, async () => ({ place: null, score: 0 }));
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonicalHotels()).toBe(0);
    expect(await getPendingReviewCount()).toBe(1);
  });

  it("sends a provider name mismatch to manual review", async () => {
    const wrongPlace = { ...providerPlace, name: "Different Hotel At Similar Address" };
    const result = await ingestHotelStay(hotelInput, async () => ({ place: wrongPlace, score: 0.95 }));
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonicalHotels()).toBe(0);
  });

  it("sends a non-hotel place to manual review", async () => {
    const restaurant = { ...providerPlace, types: ["restaurant"], name: "Example Restaurant" };
    const result = await ingestHotelStay({ name: "Example Restaurant", address: hotelInput.address }, async () => ({ place: restaurant, score: 0.99 }));
    expect(result.status).toBe("MANUAL_REVIEW");
    expect(await countCanonicalHotels()).toBe(0);
  });

  it("keeps same-name hotels in different cities separate", async () => {
    const first = await ingestHotelStay(hotelInput, async () => ({ place: providerPlace, score: 0.98 }));
    const secondPlace = { ...providerPlace, providerPlaceId: "test-place-example-grand-other", formattedAddress: "100 King Street, Atlanta, GA 30303, USA", city: "Atlanta", state: "GA", postalCode: "30303", latitude: 33.7490, longitude: -84.3880 };
    const second = await ingestHotelStay({ name: "Example Grand Hotel", address: "100 King Street, Atlanta, GA 30303" }, async () => ({ place: secondPlace, score: 0.98 }));
    expect(first.status).toBe("VERIFIED_ADD");
    expect(second.status).toBe("VERIFIED_ADD");
    expect(await countCanonicalHotels()).toBe(2);
  });

  it("prevents concurrent duplicate inserts", async () => {
    const resolver = async () => ({ place: providerPlace, score: 0.98 });
    const results = await Promise.all(Array.from({ length: 10 }, () => ingestHotelStay(hotelInput, resolver)));
    expect(results.filter((r) => r.status === "VERIFIED_ADD")).toHaveLength(1);
    expect(await countHotelByProviderId(providerPlace.providerPlaceId)).toBe(1);
  });
});

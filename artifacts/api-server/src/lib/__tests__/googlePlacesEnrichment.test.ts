import { expect, it, vi } from "vitest";
import { enrichBusiness } from "../googlePlacesEnrichment";

it("holds an ambiguous Google Places text search without fetching details or auto-populating fields", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GOOGLE_PLACES_SERVER_KEY;
  process.env.GOOGLE_PLACES_SERVER_KEY = "test-existing-places-key";
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    places: [
      {
        id: "first-place",
        displayName: { text: "Community Books" },
        formattedAddress: "123 Main Street, Philadelphia, PA 19106, USA",
        location: { latitude: 39.9526, longitude: -75.1652 },
        businessStatus: "OPERATIONAL",
      },
      {
        id: "second-place",
        displayName: { text: "Community Books Cafe" },
        formattedAddress: "125 Main Street, Philadelphia, PA 19106, USA",
        location: { latitude: 39.9527, longitude: -75.1653 },
        businessStatus: "OPERATIONAL",
      },
    ],
  }), { headers: { "content-type": "application/json" } }));
  globalThis.fetch = fetchMock as typeof fetch;

  try {
    const result = await enrichBusiness({
      id: "community-books",
      name: "Community Books",
      city: "Philadelphia",
      state: "PA",
    });

    expect(result).toMatchObject({
      businessId: "community-books",
      confidence: "LOW",
      enrichedFields: {
        needs_verification: true,
        enrichment_source: "google_places",
      },
    });
    expect(result.enrichedFields).not.toHaveProperty("phone");
    expect(result.enrichedFields).not.toHaveProperty("website");
    expect(result.enrichedFields).not.toHaveProperty("latitude");
    expect(result.enrichedFields).not.toHaveProperty("longitude");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("places:searchText");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GOOGLE_PLACES_SERVER_KEY;
    else process.env.GOOGLE_PLACES_SERVER_KEY = originalKey;
  }
});

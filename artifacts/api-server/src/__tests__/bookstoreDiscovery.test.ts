import { describe, expect, it, vi } from "vitest";
import {
  discoverClosestBookstore,
  isBookstoreIntent,
  normalizeDirectoryQuery,
} from "../routes/directory/bookstoreDiscovery";
import type { DirectoryRepository } from "../routes/directory/types";

const signals: unknown[] = [];

const repository: DirectoryRepository = {
  findActiveBookstores: vi.fn(async () => [
    {
      id: "urban-reader",
      name: "Urban Reader Bookstore",
      slug: "urban-reader-bookstore",
      category: "Shopping & Retail",
      subcategory: "Bookstore",
      description: "A community bookstore.",
      tags: ["black-owned", "books"],
      latitude: 35.2300,
      longitude: -80.8400,
      city: "Charlotte",
      state: "NC",
      addressLine1: "100 Example Street",
      websiteUrl: "https://example.test/urban-reader",
      isActive: true,
    },
    {
      id: "far-away-books",
      name: "Far Away Books",
      slug: "far-away-books",
      category: "Shopping & Retail",
      subcategory: "Book Shop",
      description: "A bookstore in another market.",
      tags: [],
      latitude: 40.7128,
      longitude: -74.0060,
      city: "New York",
      state: "NY",
      isActive: true,
    },
  ]),
  findVerifiedOnlineBookstores: vi.fn(async () => [
    {
      id: "approved-online-store",
      name: "Approved Online Bookstore",
      url: "https://example.test/online",
      description: "A verified online bookstore.",
      priority: 1,
      isVerified: true,
    },
  ]),
  recordDirectorySearchSignal: vi.fn(async (signal) => {
    signals.push(signal);
  }),
  findPublishedCulturalSiteById: vi.fn(async () => null),
};

describe("bookstore query normalization", () => {
  it.each(["Book Store", "bookstore", "BOOK-SHOP", "book shop"])(
    "recognizes %s as bookstore intent",
    (query) => {
      expect(isBookstoreIntent(query)).toBe(true);
    },
  );

  it("normalizes extra whitespace without changing the meaning", () => {
    expect(normalizeDirectoryQuery("  Book   Store ")).toBe("book store");
  });
});

describe("location-first bookstore discovery", () => {
  it("returns Urban Reader as the closest local match for every bookstore spelling", async () => {
    const result = await discoverClosestBookstore(repository, {
      query: "Book Store",
      location: { lat: 35.2271, lng: -80.8431 },
    });

    expect(result.closestBookstore?.name).toBe("Urban Reader Bookstore");
    expect(result.nearbyResultCount).toBe(1);
    expect(result.onlineRecommendation).toBeNull();
    expect(result.closestBookstore?.detailUrl).toBe(
      "/businesses/urban-reader/urban-reader-bookstore",
    );
  });

  it("does not recommend online until it has checked the member's location", async () => {
    const result = await discoverClosestBookstore(repository, {
      query: "Bookstore",
      location: null,
    });

    expect(result.locationRequired).toBe(true);
    expect(result.onlineRecommendation).toBeNull();
  });

  it("offers only an approved online fallback when no result is within the radius", async () => {
    const result = await discoverClosestBookstore(repository, {
      query: "Bookshop",
      location: { lat: 29.7604, lng: -95.3698 },
      radiusMiles: 10,
    });

    expect(result.closestBookstore).toBeNull();
    expect(result.onlineRecommendation?.name).toBe("Approved Online Bookstore");
    expect(result.onlineRecommendation?.reason).toContain("10 miles");
  });

  it("records a coarse coverage signal after a no-nearby result", async () => {
    signals.length = 0;
    await discoverClosestBookstore(repository, {
      query: "Book Store",
      location: { lat: 29.7604, lng: -95.3698 },
      radiusMiles: 10,
    });

    // Signal is recorded async; wait a tick
    await new Promise((r) => setTimeout(r, 10));

    expect(signals.length).toBeGreaterThan(0);
    expect(signals.at(-1)).toMatchObject({
      outcome: "online_fallback",
      locationCell: "29.75,-95.35",
      radiusMiles: 10,
    });
  });
});

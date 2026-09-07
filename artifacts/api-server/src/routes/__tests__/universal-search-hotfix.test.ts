import express, { type Express, type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const { captureLibraryGrowthSignal, poolQuery } = vi.hoisted(() => ({
  captureLibraryGrowthSignal: vi.fn().mockResolvedValue(undefined),
  poolQuery: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: {},
  pool: { query: poolQuery },
}));

vi.mock("../../lib/library-growth-engine", () => ({
  captureLibraryGrowthSignal,
  classifyGrowthSensitivity: () => "standard",
}));

import universalSearchRouter, { appendBusinessRadiusFilter } from "../universal-search";

type QueryCall = readonly [query: string, params?: readonly unknown[]];

function createApp(options: { authenticated?: boolean; isTester?: boolean; log?: { error: ReturnType<typeof vi.fn> } } = {}): Express {
  const { authenticated = true, isTester = false, log = { error: vi.fn() } } = options;
  const app = express();
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.isAuthenticated = (() => authenticated) as any;
    if (authenticated) request.user = { id: "member-1", isTester } as any;
    request.log = log as any;
    next();
  });
  app.use("/api", universalSearchRouter);
  return app;
}

async function flushBackgroundWork(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
}

function inserts(calls: QueryCall[]): QueryCall[] {
  return calls.filter(([query]) => /INSERT INTO (search_events|business_search_inquiries)/.test(query));
}

function zeroResultRepository(calls: QueryCall[]): void {
  poolQuery.mockImplementation(async (query: string, params?: readonly unknown[]) => {
    calls.push([query, params]);
    return { rows: [] };
  });
}

function publicBusiness() {
  return {
    id: "public-coffee",
    name: "Public Coffee House",
    category: "Food",
    subcategory: "Cafe",
    city: "Philadelphia",
    state: "PA",
    description: "Coffee and community.",
    image_url: "https://images.example.test/public-coffee.jpg",
    rating: "4.8",
    review_count: "24",
    verified: true,
    latitude: "39.9526",
    longitude: "-75.1652",
    ownership_designations: ["Black-owned"],
    black_owned: true,
    instagram: "publiccoffee",
    website: "https://public-coffee.example.test",
    phone: "215-555-0100",
    price_range: "$$",
    confidence_score: "91",
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/search/universal privacy-safe hotfix", () => {
  it("keeps the existing authentication wall before any lookup", async () => {
    const response = await supertest(createApp({ authenticated: false }))
      .get("/api/search/universal")
      .query({ q: "coffee" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expect(poolQuery).not.toHaveBeenCalled();
  });

  it("does not persist the raw query or a zero-result inquiry for exactly smart_search plus discovery_v1", async () => {
    const calls: QueryCall[] = [];
    zeroResultRepository(calls);
    const rawQuery = "coffee coffee";

    const response = await supertest(createApp())
      .get("/api/search/universal")
      .query({
        q: rawQuery,
        resultTypes: "businesses",
        surface: "smart_search",
        privacy_mode: "discovery_v1",
      });
    await flushBackgroundWork();

    expect(response.status).toBe(200);
    expect(response.body.totalResults).toBe(0);
    expect(response.body.unmetDemandRecorded).toBe(false);
    expect(inserts(calls)).toEqual([]);
    expect(JSON.stringify(inserts(calls))).not.toContain(rawQuery);
    expect(captureLibraryGrowthSignal).not.toHaveBeenCalled();
  });

  it.each([
    ["missing privacy_mode", {}],
    ["invalid privacy_mode", { privacy_mode: "not_discovery_v1" }],
  ])("preserves ordinary legacy persistence when %s", async (_label, extraQuery) => {
    const calls: QueryCall[] = [];
    zeroResultRepository(calls);
    const rawQuery = "coffee coffee";

    const response = await supertest(createApp())
      .get("/api/search/universal")
      .query({ q: rawQuery, resultTypes: "businesses", surface: "smart_search", ...extraQuery });
    await flushBackgroundWork();

    expect(response.status).toBe(200);
    expect(response.body.unmetDemandRecorded).toBe(true);
    const legacyInserts = inserts(calls);
    expect(legacyInserts).toHaveLength(2);
    expect(legacyInserts[0][0]).toContain("INSERT INTO search_events");
    expect(legacyInserts[0][1]).toContain(rawQuery);
    expect(legacyInserts[1][0]).toContain("INSERT INTO business_search_inquiries");
    expect(legacyInserts[1][1]).toContain(rawQuery);
  });

  it("keeps only canonical public businesses for testers and retains the mixed response result shapes", async () => {
    const calls: QueryCall[] = [];
    const publicRow = publicBusiness();
    const hiddenRows = [
      { ...publicRow, id: "held-coffee", name: "Held Coffee", listing_status: "held" },
      { ...publicRow, id: "private-coffee", name: "Private Coffee", listing_status: "private" },
      { ...publicRow, id: "demo-coffee", name: "[Demo] Coffee", listing_status: "live_claimed" },
      { ...publicRow, id: "duplicate-coffee", name: "Duplicate Coffee", is_duplicate: true },
      { ...publicRow, id: "hidden-coffee", name: "Hidden Coffee", permanently_hidden: true },
      { ...publicRow, id: "seed-coffee", name: "Seed Coffee", data_source: "demo_seed" },
      { ...publicRow, id: "sentinel-coffee", name: "Sentinel Coffee", phone: "555-555-0100" },
    ];

    poolQuery.mockImplementation(async (query: string, params?: readonly unknown[]) => {
      calls.push([query, params]);
      if (query.includes("FROM public.public_businesses b")) {
        return {
          rows: [publicRow],
        };
      }
      if (query.includes("FROM businesses b")) return { rows: [publicRow, ...hiddenRows] };
      if (query.includes("FROM events")) {
        const future = { id: "event-1", title: "Coffee Community Meetup", category: "Community", city: "Philadelphia", date: "2099-09-07", description: "Meet neighbors.", image_url: null, result_type: "event", match_tier: "related_category" };
        const expired = { ...future, id: "expired-event", title: "Expired Coffee Meetup", date: "2020-01-01" };
        const fixture = { ...future, id: "fixture-event", title: "Fixture Coffee Meetup" };
        return { rows: query.includes("created_by_id IS NOT NULL") ? [future, expired] : [future, expired, fixture] };
      }
      if (query.includes("FROM public.published_map_entities")) {
        return { rows: [{
          id: "map-place-1",
          name: "Coffee Heritage Plaza",
          city: "Philadelphia",
          state: "PA",
          description: "A governed cultural place.",
          latitude: "39.95",
          longitude: "-75.16",
          verified_source: "https://heritage.example.test",
          detail_url: "/places/map-place-1/coffee-heritage-plaza-philadelphia",
          entity_kind: "cultural_site",
          source_table: "published_map_entities",
          result_type: "map_entity",
          match_tier: "related_category",
        }] };
      }
      if (query.includes("FROM cultural_sites")) {
        return { rows: [{ id: "heritage-1", name: "Coffee Heritage Site", city: "Philadelphia", state: "PA", description: "A landmark.", latitude: "39.95", longitude: "-75.16", verified_source: "heritage.example.test", source_table: "cultural_sites", result_type: "heritage", match_tier: "exact_specialty" }] };
      }
      if (query.includes("FROM knowledge_topics")) {
        return { rows: query.includes("kt.topic_name ILIKE $2 OR kt.description ILIKE $2")
          ? [{ id: "library-1", name: "Philadelphia Coffee Culture", description: "Local Library context.", category: "Culture", result_type: "library_topic", match_tier: "related_category" }]
          : [{ id: "unscoped-library", name: "Unrelated Global Coffee", description: "Global context.", category: "Culture", result_type: "library_topic", match_tier: "related_category" }] };
      }
      if (query.includes("FROM community_organizations")) {
        return { rows: [{ id: "organization-1", name: "Coffee Mutual Aid", category: "Community", city: "Philadelphia", state: "PA", description: "Community support.", website: "https://org.example.test", result_type: "community_org", match_tier: "related_category" }] };
      }
      return { rows: [] };
    });

    const response = await supertest(createApp({ isTester: true }))
      .get("/api/search/universal")
      .query({ q: "coffee", city: "Philadelphia", state: "PA" });
    await flushBackgroundWork();

    expect(response.status).toBe(200);
    expect(response.body.results.businesses).toEqual([
      expect.objectContaining({ id: "public-coffee", name: "Public Coffee House", matchTier: "exact_name", matchedFields: ["name"] }),
    ]);
    expect(response.body.results.businesses.map((business: { id: string }) => business.id)).not.toEqual(expect.arrayContaining(hiddenRows.map(({ id }) => id)));
    expect(response.body.results.events).toEqual([expect.objectContaining({ id: "event-1", title: "Coffee Community Meetup", result_type: "event", match_tier: "related_category" })]);
    expect(response.body.results.heritage).toEqual([expect.objectContaining({ id: "map-place-1", name: "Coffee Heritage Plaza", detail_url: "/places/map-place-1/coffee-heritage-plaza-philadelphia", entity_kind: "cultural_site", result_type: "map_entity" })]);
    expect(response.body.results.libraryTopics).toEqual([expect.objectContaining({ id: "library-1", name: "Philadelphia Coffee Culture", result_type: "library_topic", match_tier: "related_category" })]);
    expect(response.body.results.communityOrgs).toEqual([expect.objectContaining({ id: "organization-1", name: "Coffee Mutual Aid", result_type: "community_org", match_tier: "related_category" })]);

    const businessReads = calls.filter(([query]) => /FROM (?:public\.public_businesses|businesses) b/.test(query));
    expect(businessReads).not.toHaveLength(0);
    expect(businessReads.every(([query]) => query.includes("FROM public.public_businesses b"))).toBe(true);
    const eventReads = calls.filter(([query]) => query.includes("FROM events"));
    expect(eventReads.every(([query]) => query.includes("created_by_id IS NOT NULL"))).toBe(true);
    const mapEntityReads = calls.filter(([query]) => query.includes("FROM public.published_map_entities"));
    expect(mapEntityReads).toHaveLength(1);
    expect(mapEntityReads[0][0]).toContain("detail_url");
    expect(mapEntityReads[0][1]).toContain("Philadelphia");
    const libraryReads = calls.filter(([query]) => query.includes("FROM knowledge_topics"));
    expect(libraryReads).toHaveLength(1);
    expect(libraryReads[0][0]).toContain("kt.topic_name ILIKE $2 OR kt.description ILIKE $2");
    expect(libraryReads[0][1]).toContain("%Philadelphia%");
  });

  it("validates repeated or invalid query values safely without persisting a malformed request", async () => {
    const calls: QueryCall[] = [];
    zeroResultRepository(calls);

    const response = await supertest(createApp())
      .get("/api/search/universal?q=coffee&q=tea&lat=not-a-number&lng=-75");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "q (query) required, minimum 2 characters" });
    expect(calls).toEqual([]);
  });

  it.each([
    ["missing longitude", "/api/search/universal?q=coffee&lat=39.9"],
    ["invalid latitude", "/api/search/universal?q=coffee&lat=not-a-number&lng=-75"],
    ["out-of-range longitude", "/api/search/universal?q=coffee&lat=39.9&lng=181"],
    ["repeated latitude", "/api/search/universal?q=coffee&lat=39.9&lat=40&lng=-75"],
  ])("rejects %s rather than silently broadening the search", async (_label, path) => {
    const calls: QueryCall[] = [];
    zeroResultRepository(calls);

    const response = await supertest(createApp()).get(path);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "lat and lng must be single valid coordinates supplied together" });
    expect(calls).toEqual([]);
  });
});

describe("appendBusinessRadiusFilter", () => {
  it("adds an index-compatible latitude/longitude box before exact radius math", () => {
    const params: unknown[] = [];
    const sql = appendBusinessRadiusFilter(params, 39.9526, -75.1652, 25);

    expect(sql).toContain("b.latitude BETWEEN $1 AND $2");
    expect(sql).toContain("b.longitude BETWEEN $3 AND $4");
    expect(sql).toContain("cos(radians($5))");
    expect(sql).toContain("cos(radians(b.longitude) - radians($6))");
    expect(sql).toContain(") <= $7");
    expect(params).toHaveLength(7);
    expect(params.slice(0, 4).every((value) => typeof value === "number" && Number.isFinite(value))).toBe(true);
  });

  it("does not apply a false longitude exclusion when the radius reaches a pole", () => {
    const params: unknown[] = [];
    const sql = appendBusinessRadiusFilter(params, 89.9, 30, 25);

    expect(sql).toContain("b.latitude BETWEEN $1 AND $2");
    expect(sql).not.toContain("b.longitude BETWEEN");
    expect(sql).not.toContain("b.longitude >=");
    expect(sql).toContain("cos(radians($3))");
    expect(sql).toContain(") <= $5");
    expect(params).toEqual([expect.any(Number), 90, 89.9, 30, 25]);
  });

  it.each([
    [179, "east"],
    [-179, "west"],
  ])("splits the longitude interval safely across the %s date line", (longitude) => {
    const params: unknown[] = [];
    const sql = appendBusinessRadiusFilter(params, 0, longitude as number, 200);

    expect(sql).toContain("(b.longitude >= $3 OR b.longitude <= $4)");
    expect(sql).toContain("cos(radians($5))");
    expect(sql).toContain(") <= $7");
    expect(params).toHaveLength(7);
    expect(params[5]).toBe(longitude);
  });
});

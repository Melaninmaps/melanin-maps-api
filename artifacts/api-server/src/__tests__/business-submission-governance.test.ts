import express, { type Express, type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { registerSubmissionRoutes } from "../businessIntake/registerSubmissionRoutes";
import { SubmissionRepository, submissionPayloadHash, type Submission } from "../businessIntake/submissionRepository";
import { validateSubmission } from "../businessIntake/types";
import {
  assessCommunityPublication,
  isValidPinCoordinates,
  resolvePreciseBusinessLocation,
} from "../businessIntake/communityPublicationPolicy";
import {
  communityBusinessIsPublicFunctionIsSafe,
  communityPublicViewDefinitionIsSafe,
  COMMUNITY_PUBLICATION_REQUIRED_COLUMNS,
  malformedCommunityPublicationIndexes,
  missingCommunityPublicationColumns,
} from "../lib/startup-migrations";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

function submission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Community Books",
    category: "Books & Media",
    subcategory: "Bookstore",
    description: "A neighborhood bookstore.",
    address: "123 Main Street",
    city: "Philadelphia",
    state: "PA",
    postal_code: "19106",
    country: "USA",
    website: "https://communitybooks.example/",
    phone: "215-555-0100",
    social_profiles: { instagram: "https://www.instagram.com/communitybooks" },
    media_urls: ["https://cdn.example.test/business-photo.jpg"],
    media_asset_ids: [],
    ownership_designations: ["Black / African American-Owned"],
    community_reported_ownership: "minority_owned",
    price_range: "$$",
    hours: "Mon–Fri 9am–5pm",
    tags: ["books", "community"],
    latitude: "39.9526000",
    longitude: "-75.1652000",
    provider_place_id: "provider-place-1",
    location_source: "google_places",
    source_campaign: null,
    source_channel: "web",
    submitter_note: "Recommended by a member.",
    client_request_id: "request-00000001",
    request_payload_hash: null,
    submitted_by_id: "approved-member",
    status: "pending_review",
    reviewed_by_id: null,
    review_note: null,
    matched_business_id: null,
    created_at: "2026-09-04T12:00:00.000Z",
    updated_at: "2026-09-04T12:00:00.000Z",
    ...overrides,
  };
}

function transactionHarness(options: { failBusinessInsert?: boolean } = {}) {
  const query = vi.fn(async (sql: string, _values?: readonly unknown[]) => {
    if (sql.includes("INSERT INTO business_publication_identities")) {
      return { rows: [{ business_id: "published-business" }] };
    }
    if (sql.includes("INSERT INTO businesses")) {
      if (options.failBusinessInsert) throw new Error("insert failed");
      return { rows: [{ id: "published-business" }] };
    }
    return { rows: [] };
  });
  const release = vi.fn();
  return {
    query,
    release,
    pool: { connect: vi.fn().mockResolvedValue({ query, release }) },
  };
}

function repositoryMock(overrides: Record<string, unknown> = {}) {
  return {
    findByClientRequest: vi.fn().mockResolvedValue(null),
    findPublishedDuplicate: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ submission: submission(), created: true }),
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
    listBySubmitter: vi.fn().mockResolvedValue([submission()]),
    getOwnedById: vi.fn().mockResolvedValue(submission()),
    amendNeedsInfo: vi.fn().mockResolvedValue(submission({ status: "pending_review" })),
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(submission()),
    getByIdForUpdate: vi.fn().mockResolvedValue(submission()),
    finalizeAutomaticPublication: vi.fn().mockResolvedValue(submission({ status: "published", matched_business_id: "published-business" })),
    decide: vi.fn().mockResolvedValue(submission({ status: "published", matched_business_id: "published-business" })),
    ...overrides,
  };
}

function appWith(
  repository: ReturnType<typeof repositoryMock>,
  mode: "approved" | "unauthenticated" | "unapproved" = "approved",
  transactionPool: unknown = transactionHarness().pool,
  resolveLocation: unknown = vi.fn().mockResolvedValue({
    lat: "39.9526",
    lng: "-75.1652",
    source: "nominatim_exact_address",
    formattedAddress: "123 Main Street, Philadelphia, PA",
  }),
): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any;
    next();
  });
  const approvedMemberMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (mode === "unauthenticated") {
      res.status(401).json({ error: "Sign in to add a business.", code: "AUTH_REQUIRED" });
      return;
    }
    if (mode === "unapproved") {
      res.status(403).json({ error: "An approved community account is required.", code: "ACCOUNT_APPROVAL_REQUIRED" });
      return;
    }
    req.user = { id: "approved-member", role: "tester" } as any;
    next();
  };
  registerSubmissionRoutes(app, {
    repository: repository as any,
    approvedMemberMiddleware,
    transactionPool: transactionPool as any,
    resolveLocation: resolveLocation as any,
  });
  return app;
}

function completeBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Community Books",
    category: "Books & Media",
    subcategory: "Bookstore",
    address: "123 Main Street",
    city: "Philadelphia",
    state: "PA",
    postalCode: "19106",
    website: "https://communitybooks.example/",
    communityReportedOwnership: "minority_owned",
    ownershipDesignations: ["black-owned"],
    clientRequestId: "request-00000001",
    ...overrides,
  };
}

describe("community business submission input", () => {
  it("normalizes supported socials and community-reported ownership while dropping caller publication flags", () => {
    const input = validateSubmission({
      name: "  Community Books  ",
      category: "Books & Media",
      city: "Philadelphia",
      website: "communitybooks.example",
      instagram: "@communitybooks",
      tiktok: "@communitybooks",
      communityReportedOwnership: "minority_owned",
      ownershipDesignations: ["black-owned", "woman-owned"],
      verified: true,
      status: "active",
      listingStatus: "live_claimed",
    });

    expect(input.website).toBe("https://communitybooks.example/");
    expect(input.socialProfiles).toEqual({
      instagram: "https://www.instagram.com/communitybooks",
      tiktok: "https://www.tiktok.com/@communitybooks",
    });
    expect(input.ownershipDesignations).toEqual([
      "Black / African American-Owned",
      "Woman-Owned",
    ]);
    expect(input.communityReportedOwnership).toBe("minority_owned");
    expect(input).not.toHaveProperty("verified");
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("listingStatus");
  });

  it("accepts an explicit non-minority community report without treating it as verification", () => {
    const input = validateSubmission({
      name: "Neighborhood Bakery",
      category: "Bakery",
      city: "Philadelphia",
      communityReportedOwnership: "non_minority_owned",
    });
    expect(input.communityReportedOwnership).toBe("non_minority_owned");
    expect(input.ownershipDesignations).toEqual([]);
    expect(input).not.toHaveProperty("verified");
  });

  it("rejects contradictory ownership, unsafe URLs, and incomplete coordinate pairs", () => {
    expect(() => validateSubmission({ ...completeBody(), communityReportedOwnership: "non_minority_owned" })).toThrow("cannot be combined");
    expect(() => validateSubmission({ name: "A", category: "B", city: "C", website: "javascript:alert(1)" })).toThrow("website must be a valid public web address");
    expect(() => validateSubmission({ name: "A", category: "B", city: "C", instagram: "https://facebook.com/not-instagram" })).toThrow("instagram must link to instagram.com");
    expect(() => validateSubmission({ name: "A", category: "B", city: "C", latitude: 39.9 })).toThrow("latitude and longitude");
    for (const website of [
      "https://localhost:3000/",
      "https://127.0.0.1/",
      "https://169.254.169.254/",
      "https://192.168.1.10/",
      "https://[::1]/",
    ]) {
      expect(() => validateSubmission({ name: "A", category: "B", city: "C", website })).toThrow("public web address");
    }
  });
});

describe("objective publication policy", () => {
  it("permits an ordinary evidence-complete bakery but holds location, resource, regulated, and demo records", () => {
    expect(assessCommunityPublication({
      ...completeBody(),
      socialProfiles: {},
    } as any).outcome).toBe("eligible");
    expect(assessCommunityPublication({
      ...completeBody({ website: undefined }),
      socialProfiles: { instagram: "https://www.instagram.com/communitybooks" },
    } as any).outcome).toBe("eligible");
    expect(assessCommunityPublication({
      ...completeBody({ address: "", website: "https://bakery.example" }),
      socialProfiles: {},
    } as any).outcome).toBe("needs_location");
    expect(assessCommunityPublication({
      ...completeBody({ category: "Government & Public Resources" }),
      socialProfiles: {},
    } as any).outcome).toBe("resource_review");
    expect(assessCommunityPublication({
      ...completeBody({ category: "Health & Wellness", subcategory: "Physicians" }),
      socialProfiles: {},
    } as any).outcome).toBe("regulated_review");
    expect(assessCommunityPublication({
      ...completeBody({ name: "[DEMO] Bakery" }),
      socialProfiles: {},
    } as any).outcome).toBe("prohibited");
    expect(assessCommunityPublication({
      ...completeBody({ website: undefined, providerPlaceId: "caller-supplied-place" }),
      socialProfiles: {},
    } as any).outcome).toBe("needs_evidence");
    expect(assessCommunityPublication({
      ...completeBody({ category: "Shopping & Retail", name: "Healing Hands", description: "A medical clinic accepting new patients." }),
      socialProfiles: {},
    } as any).outcome).toBe("regulated_review");
    expect(assessCommunityPublication({
      ...completeBody({ category: "Shopping & Retail", name: "Southside Community Resource Center" }),
      socialProfiles: {},
    } as any).outcome).toBe("resource_review");
    expect(assessCommunityPublication({
      ...completeBody({ category: "Shopping & Retail", name: "Southside Center", description: "A nonprofit public resource for local families." }),
      socialProfiles: {},
    } as any).outcome).toBe("resource_review");
  });

  it("never considers zero or out-of-range coordinates a valid pin", () => {
    expect(isValidPinCoordinates("39.95", "-75.16")).toBe(true);
    expect(isValidPinCoordinates("0", "0")).toBe(false);
    expect(isValidPinCoordinates("0", "-75.16")).toBe(true);
    expect(isValidPinCoordinates("91", "-75.16")).toBe(false);
  });

  it("never trusts caller-supplied coordinates directly, even when labeled as Google Places", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        lat: "39.9511",
        lon: "-75.1702",
        display_name: "123 Main Street, Philadelphia, Pennsylvania, United States",
        address: {
          house_number: "123",
          road: "Main Street",
          city: "Philadelphia",
          state: "Pennsylvania",
          postcode: "19106",
          "ISO3166-2-lvl4": "US-PA",
          country: "United States",
          country_code: "us",
        },
      }],
    });
    vi.stubGlobal("fetch", fetchMock);
    const untrusted = await resolvePreciseBusinessLocation({
      ...completeBody(),
      latitude: 39.9526,
      longitude: -75.1652,
      providerPlaceId: "untrusted-client-place-id",
      locationSource: "google_places",
      socialProfiles: {},
    } as any);
    expect(untrusted).toMatchObject({
      lat: "39.9511",
      lng: "-75.1702",
      source: "nominatim_exact_address",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects wrong roads that share only a directional, common word, or part of a multiword name", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    const cases = [
      { submitted: "123 North Main Street", returned: "North Avenue", house: "123" },
      { submitted: "124 Market Street", returned: "Market Avenue", house: "124" },
      { submitted: "125 Martin Luther King Boulevard", returned: "Martin Avenue", house: "125" },
    ];
    const fetchMock = vi.fn();
    for (const item of cases) {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          lat: "39.9511",
          lon: "-75.1702",
          display_name: `${item.house} ${item.returned}, Philadelphia, Pennsylvania, United States`,
          address: {
            house_number: item.house,
            road: item.returned,
            city: "Philadelphia",
            state: "Pennsylvania",
            postcode: "19106",
            "ISO3166-2-lvl4": "US-PA",
            country: "United States",
            country_code: "us",
          },
        }],
      });
    }
    vi.stubGlobal("fetch", fetchMock);
    for (const item of cases) {
      await expect(resolvePreciseBusinessLocation({
        ...completeBody({ address: item.submitted, postalCode: "19106" }),
        socialProfiles: {},
      } as any)).resolves.toBeNull();
    }
    expect(fetchMock).toHaveBeenCalledTimes(cases.length);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("coalesces concurrent Google resolutions for the same normalized address", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [{
          formatted_address: "987 Coalesce Avenue, Philadelphia, PA 19106, USA",
          address_components: [
            { long_name: "987", short_name: "987", types: ["street_number"] },
            { long_name: "Coalesce Avenue", short_name: "Coalesce Ave", types: ["route"] },
            { long_name: "Philadelphia", short_name: "Philadelphia", types: ["locality"] },
            { long_name: "Pennsylvania", short_name: "PA", types: ["administrative_area_level_1"] },
            { long_name: "United States", short_name: "US", types: ["country"] },
            { long_name: "19106", short_name: "19106", types: ["postal_code"] },
          ],
          geometry: { location: { lat: 39.95, lng: -75.15 }, location_type: "ROOFTOP" },
        }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const candidate = {
      ...completeBody({ address: "987 Coalesce Avenue", postalCode: "19106" }),
      socialProfiles: {},
    } as any;
    const results = await Promise.all(Array.from({ length: 8 }, () => resolvePreciseBusinessLocation(candidate)));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(results.every((result) => result?.source === "google_geocoder")).toBe(true);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([
    {
      label: "wrong city containment",
      candidate: { address: "1 Main Street", city: "York", state: "PA", postalCode: "17401" },
      returned: { city: "New York", stateLong: "Pennsylvania", stateShort: "PA", countryLong: "United States", countryShort: "US", postalCode: "17401" },
    },
    {
      label: "wrong two-letter state contained in a different state name",
      candidate: { address: "2 Main Street", city: "Richmond", state: "IN", postalCode: "47374" },
      returned: { city: "Richmond", stateLong: "Virginia", stateShort: "VA", countryLong: "United States", countryShort: "US", postalCode: "47374" },
    },
    {
      label: "wrong country code contained in a different country name",
      candidate: { address: "3 Main Street", city: "Moscow", state: undefined, country: "US", postalCode: "101000" },
      returned: { city: "Moscow", stateLong: "Moscow", stateShort: "MOW", countryLong: "Russia", countryShort: "RU", postalCode: "101000" },
    },
    {
      label: "wrong postal code",
      candidate: { address: "4 Main Street", city: "Philadelphia", state: "PA", postalCode: "19106" },
      returned: { city: "Philadelphia", stateLong: "Pennsylvania", stateShort: "PA", countryLong: "United States", countryShort: "US", postalCode: "19107" },
    },
    {
      label: "wrong country even when city and state match",
      candidate: { address: "5 Main Street", city: "Philadelphia", state: "PA", country: "Canada", postalCode: "19106" },
      returned: { city: "Philadelphia", stateLong: "Pennsylvania", stateShort: "PA", countryLong: "United States", countryShort: "US", postalCode: "19106" },
    },
  ])("rejects a geocoder result with $label", async ({ candidate, returned }) => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{
            formatted_address: "Mismatched result",
            address_components: [
              { long_name: candidate.address.split(" ")[0], short_name: candidate.address.split(" ")[0], types: ["street_number"] },
              { long_name: "Main Street", short_name: "Main St", types: ["route"] },
              { long_name: returned.city, short_name: returned.city, types: ["locality"] },
              { long_name: returned.stateLong, short_name: returned.stateShort, types: ["administrative_area_level_1"] },
              { long_name: returned.countryLong, short_name: returned.countryShort, types: ["country"] },
              { long_name: returned.postalCode, short_name: returned.postalCode, types: ["postal_code"] },
            ],
            geometry: { location: { lat: 40.0, lng: -75.0 }, location_type: "ROOFTOP" },
          }],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolvePreciseBusinessLocation({
      ...completeBody(candidate),
      socialProfiles: {},
    } as any)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects a Nominatim result with a wrong supplied country even when city and state match", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        lat: "39.95",
        lon: "-75.16",
        display_name: "6 Main Street, Philadelphia, Pennsylvania, United States",
        address: {
          house_number: "6",
          road: "Main Street",
          city: "Philadelphia",
          state: "Pennsylvania",
          postcode: "19106",
          "ISO3166-2-lvl4": "US-PA",
          country: "United States",
          country_code: "us",
        },
      }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolvePreciseBusinessLocation({
      ...completeBody({ address: "6 Main Street", state: "PA", country: "Canada", postalCode: "19106" }),
      socialProfiles: {},
    } as any)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

describe("durable submission repository", () => {
  it("persists field-complete data, ownership declaration, and initial automatic state after confirming media ownership", async () => {
    const privateAssetId = "00000000-0000-4000-8000-000000000099";
    const stored = submission({ media_urls: [], media_asset_ids: [privateAssetId] });
    const query = vi.fn(async (sql: string, _values?: readonly unknown[]) => {
      if (sql.includes("FROM media_assets")) return { rows: [{ id: privateAssetId, public_url: null }] };
      if (sql.includes("INSERT INTO community_business_submissions")) return { rows: [stored] };
      return { rows: [] };
    });
    const repository = new SubmissionRepository({ query } as any);
    const result = await repository.create(validateSubmission({
      ...completeBody(),
      socialProfiles: stored.social_profiles,
      mediaAssetIds: [privateAssetId],
      latitude: Number(stored.latitude),
      longitude: Number(stored.longitude),
      providerPlaceId: stored.provider_place_id,
      locationSource: "google_places",
    }), "approved-member", undefined, "needs_info", "Precise address needed");

    expect(result).toEqual({ submission: stored, created: true });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("purpose = 'business_submission'"))).toBe(true);
    const insert = query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO community_business_submissions"));
    expect(String(insert?.[0])).toContain("community_reported_ownership");
    expect(String(insert?.[0])).toContain("media_asset_ids");
    expect(insert?.[1]).toEqual(expect.arrayContaining([
      "minority_owned",
      "needs_info",
      "Precise address needed",
      stored.provider_place_id,
      "approved-member",
    ]));
  });

  it("rejects arbitrary media URLs that do not belong to the submitter", async () => {
    const query = vi.fn(async (_sql: string, _values?: readonly unknown[]) => ({ rows: [] }));
    const repository = new SubmissionRepository({ query } as any);
    await expect(repository.create(validateSubmission({
      name: "Community Books",
      category: "Books",
      city: "Philadelphia",
      mediaUrls: ["https://cdn.example.test/not-owned.jpg"],
    }), "approved-member")).rejects.toThrow("your completed private uploads");
    expect(query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO community_business_submissions"))).toBe(false);
  });

  it("replays a concurrent identity conflict without aborting the transaction", async () => {
    const stored = submission({ request_payload_hash: submissionPayloadHash(validateSubmission(completeBody())) });
    let identityLookups = 0;
    const query = vi.fn(async (sql: string, _values?: readonly unknown[]) => {
      if (sql.includes("client_request_id = $2")) return { rows: [] };
      if (sql.includes("status IN ('pending_review', 'needs_info')")) {
        identityLookups += 1;
        return { rows: identityLookups > 1 ? [stored] : [] };
      }
      if (sql.includes("INSERT INTO community_business_submissions")) return { rows: [] };
      return { rows: [] };
    });
    const repository = new SubmissionRepository({ query } as any);
    const result = await repository.create(validateSubmission(completeBody()), "approved-member");

    expect(result).toEqual({ submission: stored, created: false });
    const insertSql = String(query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO community_business_submissions"))?.[0]);
    expect(insertSql).toContain("ON CONFLICT DO NOTHING");
  });
});

describe("POST /api/community/business-submissions", () => {
  it("rejects unauthenticated and unapproved callers before repository or transaction access", async () => {
    for (const mode of ["unauthenticated", "unapproved"] as const) {
      const repository = repositoryMock();
      const tx = transactionHarness();
      const response = await request(appWith(repository, mode, tx.pool))
        .post("/api/community/business-submissions")
        .send({ name: "A", category: "B", city: "C" });
      expect(response.status).toBe(mode === "unauthenticated" ? 401 : 403);
      expect(repository.create).not.toHaveBeenCalled();
      expect(tx.pool.connect).not.toHaveBeenCalled();
    }
  });

  it("requires an idempotency key before geocoding or database access", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness();
    const resolveLocation = vi.fn();
    const response = await request(appWith(repository, "approved", tx.pool, resolveLocation))
      .post("/api/community/business-submissions")
      .send(completeBody({ clientRequestId: undefined }));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
    expect(resolveLocation).not.toHaveBeenCalled();
    expect(tx.pool.connect).not.toHaveBeenCalled();
  });

  it("atomically publishes an eligible ordinary business with a precise pin as unclaimed and not verified", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .post("/api/community/business-submissions")
      .set("Idempotency-Key", "request-00000001")
      .send(completeBody());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      submissionId: submission().id,
      businessId: "published-business",
      status: "published",
      publicationOutcome: "published",
      mapPin: true,
      duplicateRetry: false,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientRequestId: "request-00000001", communityReportedOwnership: "minority_owned" }),
      "approved-member",
      expect.anything(),
      "pending_review",
      expect.any(String),
    );
    expect(repository.finalizeAutomaticPublication).toHaveBeenCalledWith(
      submission().id,
      "published-business",
      expect.stringContaining("unclaimed and not verified"),
      expect.anything(),
    );
    const businessInsert = tx.query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO businesses"));
    expect(String(businessInsert?.[0])).toContain("ownership_claim");
    expect(String(businessInsert?.[0])).toContain("'community','community_listed','unclaimed',NULL");
    expect(businessInsert?.[1]).toEqual(expect.arrayContaining([
      "community_reported_minority_owned",
      true,
      "approved-member",
    ]));
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO canonical_record_locations"))).toBe(true);
    expect(tx.query.mock.calls.map(([sql]) => sql)).toEqual(expect.arrayContaining(["BEGIN", "COMMIT"]));
    expect(tx.release).toHaveBeenCalledOnce();
  });

  it("publishes an explicit non-minority report with black_owned false and no notification side effect", async () => {
    const repository = repositoryMock({
      create: vi.fn().mockResolvedValue({
        submission: submission({
          ownership_designations: [],
          community_reported_ownership: "non_minority_owned",
        }),
        created: true,
      }),
      getByIdForUpdate: vi.fn().mockResolvedValue(submission({
        ownership_designations: [],
        community_reported_ownership: "non_minority_owned",
      })),
    });
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .post("/api/community/business-submissions")
      .send(completeBody({
        communityReportedOwnership: "non_minority_owned",
        ownershipDesignations: [],
      }));

    expect(response.status).toBe(201);
    const businessInsert = tx.query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO businesses"));
    expect(businessInsert?.[1]).toEqual(expect.arrayContaining([
      "community_reported_non_minority_owned",
      false,
    ]));
    expect(tx.query.mock.calls.some(([sql]) => /notification|push|email/i.test(String(sql)))).toBe(false);
  });

  it("saves an incomplete-address submission as needs_info without creating any public row or pin", async () => {
    const repository = repositoryMock({
      create: vi.fn().mockResolvedValue({ submission: submission({ address: null, status: "needs_info" }), created: true }),
    });
    const tx = transactionHarness();
    const resolveLocation = vi.fn();
    const response = await request(appWith(repository, "approved", tx.pool, resolveLocation))
      .post("/api/community/business-submissions")
      .send(completeBody({ address: "" }));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ status: "needs_info", publicationOutcome: "needs_location", mapPin: false });
    expect(resolveLocation).not.toHaveBeenCalled();
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO businesses"))).toBe(false);
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("canonical_record_locations"))).toBe(false);
    expect(repository.finalizeAutomaticPublication).not.toHaveBeenCalled();
  });

  it("holds a regulated service privately before geocoding", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness();
    const resolveLocation = vi.fn();
    const response = await request(appWith(repository, "approved", tx.pool, resolveLocation))
      .post("/api/community/business-submissions")
      .send(completeBody({ category: "Health & Wellness", subcategory: "Physicians" }));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ publicationOutcome: "regulated_review", mapPin: false });
    expect(resolveLocation).not.toHaveBeenCalled();
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO businesses"))).toBe(false);
  });

  it("saves geocoding failure as needs_info and never substitutes 0,0", async () => {
    const repository = repositoryMock({
      create: vi.fn().mockResolvedValue({ submission: submission({ status: "needs_info" }), created: true }),
    });
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool, vi.fn().mockResolvedValue(null)))
      .post("/api/community/business-submissions")
      .send(completeBody());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ status: "needs_info", publicationOutcome: "needs_location", mapPin: false });
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO businesses"))).toBe(false);
  });

  it("returns the original published result on idempotent retry without creating another business", async () => {
    const payloadHash = submissionPayloadHash(validateSubmission(completeBody()));
    const repository = repositoryMock({
      findByClientRequest: vi.fn().mockResolvedValue(submission({
        status: "published",
        matched_business_id: "published-business",
        request_payload_hash: payloadHash,
      })),
      findPublishedDuplicate: vi.fn().mockResolvedValue({ id: "published-business", name: "Community Books" }),
    });
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .post("/api/community/business-submissions")
      .send(completeBody());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      duplicateRetry: true,
      status: "published",
      businessId: "published-business",
      mapPin: true,
    });
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO businesses"))).toBe(false);
    expect(repository.findPublishedDuplicate).not.toHaveBeenCalled();
    expect(tx.pool.connect).not.toHaveBeenCalled();
    expect(repository.logAuditEvent).not.toHaveBeenCalled();
  });

  it("rejects reuse of an idempotency key for different business information", async () => {
    const repository = repositoryMock({
      findByClientRequest: vi.fn().mockResolvedValue(submission({
        status: "published",
        matched_business_id: "published-business",
        request_payload_hash: submissionPayloadHash(validateSubmission(completeBody())),
      })),
    });
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .post("/api/community/business-submissions")
      .send(completeBody({ name: "Different Bakery" }));

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("IDEMPOTENCY_PAYLOAD_MISMATCH");
    expect(repository.findPublishedDuplicate).not.toHaveBeenCalled();
    expect(tx.pool.connect).not.toHaveBeenCalled();
  });

  it("rejects replay of a legacy idempotency row that has no payload fingerprint", async () => {
    const repository = repositoryMock({
      findByClientRequest: vi.fn().mockResolvedValue(submission({
        status: "published",
        matched_business_id: "published-business",
        request_payload_hash: null,
      })),
    });
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .post("/api/community/business-submissions")
      .send(completeBody());

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("IDEMPOTENCY_PAYLOAD_UNVERIFIABLE");
    expect(tx.pool.connect).not.toHaveBeenCalled();
  });

  it("rejects a known public duplicate before opening a transaction", async () => {
    const repository = repositoryMock({
      findPublishedDuplicate: vi.fn().mockResolvedValue({ id: "existing-business", name: "Community Books" }),
    });
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .post("/api/community/business-submissions")
      .send(completeBody());
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: "BUSINESS_ALREADY_LISTED", businessId: "existing-business" });
    expect(tx.pool.connect).not.toHaveBeenCalled();
  });
});

describe("member-owned submission status and amendment", () => {
  it("scopes list and detail requests to the authenticated submitter", async () => {
    const repository = repositoryMock();
    const list = await request(appWith(repository)).get("/api/community/business-submissions/mine");
    const detail = await request(appWith(repository)).get(`/api/community/business-submissions/${submission().id}`);
    expect(list.status).toBe(200);
    expect(detail.status).toBe(200);
    expect(list.body.submissions[0]).not.toHaveProperty("reviewed_by_id");
    expect(list.body.submissions[0]).not.toHaveProperty("submitted_by_id");
    expect(detail.body.submission).not.toHaveProperty("client_request_id");
    expect(repository.listBySubmitter).toHaveBeenCalledWith("approved-member");
    expect(repository.getOwnedById).toHaveBeenCalledWith(submission().id, "approved-member");
  });

  it("publishes a corrected needs-info submission immediately when it becomes eligible", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness();
    const response = await request(appWith(repository, "approved", tx.pool))
      .patch(`/api/community/business-submissions/${submission().id}`)
      .send(completeBody({ clientRequestId: undefined }));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "published", publicationOutcome: "published", mapPin: true });
    expect(repository.amendNeedsInfo).toHaveBeenCalledWith(
      submission().id,
      "approved-member",
      expect.objectContaining({ name: "Community Books" }),
      expect.anything(),
      "pending_review",
      expect.any(String),
    );
    expect(repository.finalizeAutomaticPublication).toHaveBeenCalled();
  });
});

describe("founder atomic publication", () => {
  function adminApp(repository: ReturnType<typeof repositoryMock>, tx: ReturnType<typeof transactionHarness>, resolveLocation: unknown) {
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "founder", role: "admin" } as any;
      req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any;
      next();
    });
    registerSubmissionRoutes(app, {
      repository: repository as any,
      transactionPool: tx.pool as any,
      approvedMemberMiddleware: (_req, _res, next) => next(),
      resolveLocation: resolveLocation as any,
    });
    return app;
  }

  it("publishes one active community-listed unclaimed record and commits status with its precise pin", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness();
    const app = adminApp(repository, tx, vi.fn().mockResolvedValue({ lat: "39.95", lng: "-75.16", source: "nominatim_exact_address", formattedAddress: null }));
    const response = await request(app)
      .post(`/api/founder/business-submissions/${submission().id}/decision`)
      .send({ status: "published", reviewNote: "Reviewed" });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("does not mark it verified");
    const businessInsert = tx.query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO businesses"));
    expect(String(businessInsert?.[0])).toContain("'active','live_unclaimed'");
    expect(String(businessInsert?.[0])).toContain("'community','community_listed','unclaimed',NULL");
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO canonical_record_locations"))).toBe(true);
    expect(tx.query.mock.calls.some(([sql]) => String(sql).includes("pg_advisory_xact_lock"))).toBe(true);
    expect(repository.decide).toHaveBeenCalledWith(
      submission().id,
      "founder",
      expect.objectContaining({ status: "published", matchedBusinessId: "published-business" }),
      expect.anything(),
    );
    expect(tx.query.mock.calls.map(([sql]) => sql)).toEqual(expect.arrayContaining(["BEGIN", "COMMIT"]));
    expect(tx.release).toHaveBeenCalledOnce();
  });

  it("refuses publication before a transaction when precise location evidence cannot be resolved", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness();
    const app = adminApp(repository, tx, vi.fn().mockResolvedValue(null));
    const response = await request(app)
      .post(`/api/founder/business-submissions/${submission().id}/decision`)
      .send({ status: "published" });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe("PRECISE_LOCATION_REQUIRED");
    expect(tx.pool.connect).not.toHaveBeenCalled();
    expect(repository.decide).not.toHaveBeenCalled();
  });

  it("refuses founder publication when a held community record is a resource or regulated service", async () => {
    for (const held of [
      submission({ category: "Community Resources", name: "Southside Community Resource Center" }),
      submission({ category: "Shopping & Retail", description: "A medical clinic accepting new patients." }),
      submission({ category: "Shopping & Retail", name: "Southside Center", description: "A nonprofit public resource for local families." }),
    ]) {
      const repository = repositoryMock({ getById: vi.fn().mockResolvedValue(held) });
      const tx = transactionHarness();
      const resolveLocation = vi.fn();
      const app = adminApp(repository, tx, resolveLocation);
      const response = await request(app)
        .post(`/api/founder/business-submissions/${held.id}/decision`)
        .send({ status: "published" });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("PUBLICATION_HELD");
      expect(resolveLocation).not.toHaveBeenCalled();
      expect(tx.pool.connect).not.toHaveBeenCalled();
      expect(repository.decide).not.toHaveBeenCalled();
    }
  });

  it("rolls back and does not advance submission status when canonical insert fails", async () => {
    const repository = repositoryMock();
    const tx = transactionHarness({ failBusinessInsert: true });
    const app = adminApp(repository, tx, vi.fn().mockResolvedValue({ lat: "39.95", lng: "-75.16", source: "nominatim_exact_address", formattedAddress: null }));
    const response = await request(app)
      .post(`/api/founder/business-submissions/${submission().id}/decision`)
      .send({ status: "published" });
    expect(response.status).toBe(500);
    expect(repository.decide).not.toHaveBeenCalled();
    expect(tx.query).toHaveBeenCalledWith("ROLLBACK");
    expect(tx.release).toHaveBeenCalledOnce();
  });
});

describe("source contracts", () => {
  it("fails readiness when pre-existing audit or canonical-location tables are incomplete", () => {
    const present = new Set(Object.entries(COMMUNITY_PUBLICATION_REQUIRED_COLUMNS).flatMap(([table, columns]) =>
      columns.map((column) => `${table}.${column}`),
    ));
    present.delete("business_submission_audit_events.actor_id");
    present.delete("canonical_record_locations.longitude");
    present.delete("canonical_record_locations.is_primary");

    expect(missingCommunityPublicationColumns(present)).toEqual([
      "canonical_record_locations.longitude",
      "canonical_record_locations.is_primary",
      "business_submission_audit_events.actor_id",
    ]);
  });

  it("rejects same-name indexes with wrong keys or unsafe predicates", () => {
    const validDefinitions = [
      {
        indexname: "businesses_canonical_dedupe_key_unique",
        table_name: "businesses",
        is_unique: true,
        is_valid: true,
        is_ready: true,
        key_expressions: ["dedupe_key"],
        predicate: "(dedupe_key IS NOT NULL) AND (btrim(dedupe_key) <> ''::text) AND (COALESCE(is_duplicate, false) = false) AND (COALESCE(status, ''::text) <> ALL (ARRAY['duplicate'::text, 'permanently_hidden'::text, 'removed'::text, 'deleted'::text]))",
      },
      {
        indexname: "canonical_record_locations_unique_idx",
        table_name: "canonical_record_locations",
        is_unique: true,
        is_valid: true,
        is_ready: true,
        key_expressions: ["record_type", "record_id", "city_name", "COALESCE(state_code, ''::text)", "COALESCE(neighborhood_name, ''::text)"],
        predicate: null,
      },
      {
        indexname: "idx_community_business_submissions_owner_request",
        table_name: "community_business_submissions",
        is_unique: true,
        is_valid: true,
        is_ready: true,
        key_expressions: ["submitted_by_id", "client_request_id"],
        predicate: "(submitted_by_id IS NOT NULL) AND (client_request_id IS NOT NULL)",
      },
    ];
    expect(malformedCommunityPublicationIndexes(validDefinitions)).toEqual([]);

    const business = validDefinitions[0]!;
    const location = validDefinitions[1]!;
    const ownerRequest = validDefinitions[2]!;
    expect(malformedCommunityPublicationIndexes([
      { ...business, key_expressions: ["dedupe_key", "status"] }, location, ownerRequest,
    ])).toContain("businesses_canonical_dedupe_key_unique");
    expect(malformedCommunityPublicationIndexes([
      { ...business, predicate: business.predicate!.replace("'deleted'::text]", "'deleted'::text, 'active'::text]") }, location, ownerRequest,
    ])).toContain("businesses_canonical_dedupe_key_unique");
    expect(malformedCommunityPublicationIndexes([
      { ...business, predicate: business.predicate!.replace("= false", "= true") }, location, ownerRequest,
    ])).toContain("businesses_canonical_dedupe_key_unique");
    expect(malformedCommunityPublicationIndexes([
      business, { ...location, key_expressions: [...location.key_expressions, "latitude"] }, ownerRequest,
    ])).toContain("canonical_record_locations_unique_idx");
    expect(malformedCommunityPublicationIndexes([
      business, location, { ...ownerRequest, predicate: "submitted_by_id IS NOT NULL" },
    ])).toContain("idx_community_business_submissions_owner_request");
  });

  it("rejects a public view that omits any lifecycle, hiding, or demo-containment clause", () => {
    const safeFunction = `SELECT COALESCE(p_status, '') = 'active'
      AND COALESCE(p_is_duplicate, false) = false
      AND COALESCE(p_listing_status, '') IN ('live_unclaimed', 'live_claimed')
      AND COALESCE(p_permanently_hidden, false) = false
      AND NOT (
        COALESCE(p_name, '') ILIKE '%[DEMO]%'
        OR COALESCE(p_description, '') ILIKE '%[DEMO]%'
        OR LOWER(BTRIM(COALESCE(p_data_source, ''))) IN ('demo', 'demo_seed')
        OR LOWER(BTRIM(COALESCE(p_status, ''))) IN ('demo', 'test')
        OR LOWER(BTRIM(COALESCE(p_listing_status, ''))) = 'demo'
        OR REGEXP_REPLACE(COALESCE(p_phone, ''), '[^0-9]', '', 'g') IN ('15555550100', '5555550100')
      );`;
    const safeView = `SELECT b.* FROM public.businesses b
      WHERE public.business_record_is_public(b.status, b.listing_status, b.is_duplicate, b.permanently_hidden, b.name, b.description, b.data_source, b.phone)`;
    expect(communityBusinessIsPublicFunctionIsSafe(safeFunction)).toBe(true);
    for (const unsafeFunction of [
      safeFunction.replace("= false", "= true"),
      safeFunction.replace("'live_claimed')", "'live_claimed', 'draft')"),
      safeFunction.replace("'demo', 'demo_seed'", "'demo', 'ordinary'"),
      safeFunction.replace("OR COALESCE(p_description", "AND COALESCE(p_description"),
      safeFunction.replace("ILIKE '%[DEMO]%'", "= '[DEMO]'"),
      safeFunction.replace("AND NOT (", "AND NOT ").replace("\n      );", "\n      ;"),
    ]) expect(communityBusinessIsPublicFunctionIsSafe(unsafeFunction)).toBe(false);
    expect(communityPublicViewDefinitionIsSafe(safeView)).toBe(true);
    for (const unsafeView of [
      "SELECT b.* FROM public.businesses b",
      safeView.replace("WHERE public.business_record_is_public", "WHERE NOT public.business_record_is_public"),
      `${safeView} OR true`,
      safeView.replace("b.phone)", "b.phone) AND true"),
    ]) expect(communityPublicViewDefinitionIsSafe(unsafeView)).toBe(false);
  });

  it("retains canonical duplicate locking, pin indexing, unclaimed status, and no direct notification side effect", () => {
    const route = source("../businessIntake/registerSubmissionRoutes.ts");
    const repository = source("../businessIntake/submissionRepository.ts");
    const media = source("../media/registerMediaRoutes.ts");
    const migrations = source("../lib/startup-migrations.ts");
    const server = source("../index.ts");
    expect(route).toContain("pg_advisory_xact_lock");
    expect(route).toContain("business_publication_identities");
    expect(route).toContain("canonical_record_locations");
    expect(route).toContain("'community','community_listed','unclaimed',NULL");
    expect(route).toContain("ownershipClaimValue(submission)");
    expect(route).not.toContain('return { lat: "0", lng: "0" }');
    expect(route).not.toMatch(/send[A-Za-z]+Notif/);
    expect(repository).toContain("request_payload_hash");
    expect(route.indexOf("findByClientRequest")).toBeLessThan(route.indexOf("findPublishedDuplicate"));
    expect(media).toContain('purpose === "kinfolk_question" || purpose === "business_submission"');
    expect(media).toContain('purpose === "business_submission" ? null : url');
    expect(migrations).toContain("public_url   TEXT,");
    expect(migrations).toContain("ALTER TABLE media_assets ALTER COLUMN public_url DROP NOT NULL");
    const requiredSchema = migrations.slice(
      migrations.indexOf("export async function ensureRequiredPublicationSchema"),
      migrations.indexOf("export async function runStartupMigrations"),
    );
    expect(requiredSchema.indexOf("await ensureSocialFirstIngestionSchema")).toBeLessThan(requiredSchema.indexOf("await ensureBetaSafetyColumns"));
    expect(requiredSchema).toContain("await ensureCommunityBusinessSubmissionsSchema(log, strictWarn)");
    expect(requiredSchema).toContain("Community publication schema verification failed");
    expect(requiredSchema.indexOf("await ensureCommunityBusinessSubmissionsSchema(log, strictWarn)"))
      .toBeLessThan(requiredSchema.indexOf("if (!directoryImportEnabled)"));
    expect(server.indexOf("await ensureRequiredPublicationSchema")).toBeLessThan(server.indexOf("const onListening"));
    const startupStart = migrations.indexOf("export async function runStartupMigrations");
    expect(migrations.indexOf('["social first ingestion schema v1"', startupStart))
      .toBeLessThan(migrations.indexOf('["beta safety columns v1"', startupStart));
  });

  it("keeps legacy adapters out of direct canonical business inserts", () => {
    const businesses = source("../routes/businesses.ts");
    const legacyPost = businesses.slice(
      businesses.indexOf('router.post("/businesses", requireApprovedMember'),
      businesses.indexOf('router.patch("/businesses/:id/status"'),
    );
    const nominations = source("../routes/business-nominations.ts");
    const alternate = source("../routes/submit-business.ts");
    expect(legacyPost).toContain("communitySubmissionRepository.create");
    expect(legacyPost).not.toContain("insert(businessesTable)");
    expect(nominations).toContain("communitySubmissionRepository.create");
    expect(nominations).not.toContain("insert(businessesTable)");
    expect(alternate).toContain("communitySubmissionRepository.create");
    expect(alternate).not.toContain("INSERT INTO businesses");
  });

  it("applies the complete canonical visibility policy to direct business details", () => {
    const businesses = source("../routes/businesses.ts");
    const detailRoute = businesses.slice(
      businesses.indexOf('router.get("/businesses/:id"'),
      businesses.indexOf('router.patch("/businesses/:id/status"'),
    );
    expect(detailRoute).toContain("FROM public.public_businesses WHERE id = $1");
    expect(detailRoute).not.toContain("SELECT is_duplicate, status FROM businesses");
  });
});

import express, { type Express, type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  areDirectoryEvidenceAddressesPublic,
  evaluatePublicationHolds,
  geocodeDirectoryCandidate,
  isDirectoryEvidencePublicIp,
  registerDirectoryImportRoutes,
  signDirectoryLocationSuggestion,
  signDirectoryUrlValidation,
  sourceBackedPublicSearchTags,
  validateDirectoryEvidenceUrl,
  type DirectoryImportCandidate,
} from "../directoryImport/registerDirectoryImportRoutes";

afterEach(() => vi.unstubAllGlobals());
const LOCATION_SIGNING_SECRET = "test-directory-location-signing-secret-0001";

function candidate(overrides: Partial<DirectoryImportCandidate> = {}): DirectoryImportCandidate {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    batch_id: "00000000-0000-4000-8000-000000000201",
    source_row: 7267,
    target_kind: "business",
    status: "pending_review",
    dedupe_key: "source-dedupe-key",
    name: "Phoenix Climate Service",
    city: "Phoenix",
    state: "AZ",
    category: "Home & Trades",
    subcategory: "HVAC",
    cultural_specialty: null,
    address: "100 Main Street, Phoenix, AZ 85001",
    phone: "+1 602-555-0100",
    website: null,
    source_url: "https://directory.example/phoenix-climate",
    source_name: "Reviewed external directory",
    source_status: "ACTIVE/CURRENT",
    ownership_designations: [],
    ownership_evidence: null,
    regulated_profession: false,
    public_display_recommendation: "ELIGIBLE_UNCLAIMED_AFTER_RECONCILIATION",
    instagram_url: null,
    facebook_url: null,
    tiktok_url: null,
    social_source_url: null,
    price_range: null,
    price_basis: null,
    suggested_experience_keys: {},
    link_validation: {
      source: {
        result: "working",
        status: 200,
        finalUrl: "https://directory.example/phoenix-climate",
        finalHost: "directory.example",
        checkedAt: new Date().toISOString(),
      },
      reviewGates: [],
    },
    notes: null,
    raw_record: { sourceRow: 7267 },
    matched_business_id: null,
    published_record_type: null,
    published_record_id: null,
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
    review_evidence: {},
    review_revision: 0,
    created_at: "2026-09-05T00:00:00.000Z",
    updated_at: "2026-09-05T00:00:00.000Z",
    ...overrides,
  };
}

function confirmedLocation(record: DirectoryImportCandidate) {
  const coordinates = {
    latitude: 33.4484,
    longitude: -112.074,
    source: "Reviewed official address",
    sourceUrl: "https://www.openstreetmap.org/node/1",
    checkedAt: new Date().toISOString(),
    displayName: "100 Main Street, Phoenix, Arizona",
    resolvedCity: "Phoenix",
    resolvedState: "Arizona",
  };
  return {
    suggestionToken: signDirectoryLocationSuggestion(record, coordinates, LOCATION_SIGNING_SECRET),
    confirmedByReviewer: true,
  };
}

function validatedEvidence(record: DirectoryImportCandidate, purpose: "regulated" | "resource", sourceUrl: string) {
  const normalized = new URL(sourceUrl).toString();
  const validation = {
    url: normalized,
    finalHost: new URL(normalized).hostname.toLowerCase().replace(/^www\./, ""),
    status: 200,
    result: "working" as const,
    checkedAt: new Date().toISOString(),
  };
  return {
    sourceUrl: normalized,
    checkedAt: validation.checkedAt,
    validationToken: signDirectoryUrlValidation(record.id, purpose, validation, LOCATION_SIGNING_SECRET),
  };
}

function routeApp(
  database: { query: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn> },
  role: "admin" | "user" | "none" = "admin",
  geocode = vi.fn().mockResolvedValue({
    latitude: 33.4484,
    longitude: -112.074,
    source: "test geocoder",
    sourceUrl: "https://www.openstreetmap.org/node/1",
    checkedAt: new Date().toISOString(),
  }),
  validateEvidenceUrl = vi.fn(async (url: string) => ({
    url: new URL(url).toString(),
    finalHost: new URL(url).hostname.toLowerCase().replace(/^www\./, ""),
    status: 200,
    result: "working" as const,
    checkedAt: new Date().toISOString(),
  })),
): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any;
    if (role !== "none") req.user = { id: `${role}-reviewer`, role, email: `${role}@example.test` } as any;
    next();
  });
  registerDirectoryImportRoutes(app, {
    transactionPool: database as any,
    geocode,
    validateEvidenceUrl,
    locationSigningSecret: LOCATION_SIGNING_SECRET,
  });
  return app;
}

function decisionDatabase(record: DirectoryImportCandidate, failureSql?: string) {
  const clientQuery = vi.fn(async (sql: string) => {
    if (failureSql && sql.includes(failureSql)) throw new Error("forced transaction failure");
    if (sql.includes("FROM directory_import_candidates") && sql.includes("FOR UPDATE")) return { rows: [record] };
    if (sql.includes("FROM directory_import_batches") && sql.includes("FOR UPDATE")) return { rows: [{ status: "in_review" }] };
    if (sql.includes("INSERT INTO business_publication_identities") && sql.includes("RETURNING")) return { rows: [{ business_id: "claimed-business" }] };
    if (sql.includes("UPDATE directory_import_candidates")) {
      return { rows: [{ ...record, status: "published", review_revision: record.review_revision + 1 }] };
    }
    return { rows: [] };
  });
  const release = vi.fn();
  const connect = vi.fn().mockResolvedValue({ query: clientQuery, release });
  const query = vi.fn(async (sql: string) => {
    if (sql.includes("FROM directory_import_decision_events")) return { rows: [] };
    if (sql.includes("FROM directory_import_candidates")) return { rows: [record] };
    return { rows: [] };
  });
  return { query, connect, clientQuery, release };
}

describe("directory import publication gates", () => {
  it("publishes only factual service tags from an explicitly marked workbook source", () => {
    expect(sourceBackedPublicSearchTags({ raw_record: {
      publicSearchTagEvidence: "workbook_category_services_and_reviewed_offerings_only",
      searchTags: [
        "Loc maintenance",
        "Custom hair color",
        "Black-owned",
        "budget-friendly",
        "Community trusted",
        "Children's books",
        "Books by Black authors",
        "Arcade pricing available for children under 13",
        "Loc maintenance",
      ],
    } })).toEqual(["Loc maintenance", "Custom hair color"]);
    expect(sourceBackedPublicSearchTags({ raw_record: {
      searchTags: ["Loc maintenance"],
    } })).toEqual([]);
  });

  it.each([
    "0.0.0.1", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.1.1", "172.16.0.1",
    "192.0.0.1", "192.0.2.1", "192.88.99.2", "192.168.1.1", "198.18.0.1",
    "198.51.100.1", "203.0.113.1", "224.0.0.1", "240.0.0.1", "255.255.255.255",
    "::", "::1", "::127.0.0.1", "::192.168.1.1", "::ffff:127.0.0.1", "64:ff9b:1::1", "100::1", "100:0:0:1::1",
    "2001::5", "2001:2::1", "2001:10::1", "2001:db8::1", "2002::1", "3fff::1",
    "5f00::1", "fc00::1", "fec0::1", "fe80::1", "ff00::1",
  ])("classifies IANA non-global address %s as unsafe", (address) => {
    expect(isDirectoryEvidencePublicIp(address)).toBe(false);
  });

  it.each([
    "8.8.8.8", "192.0.0.9", "192.0.0.10", "64:ff9b::808:808",
    "2001:1::1", "2001:1::2", "2001:1::3", "2001:3::1", "2001:4:112::1",
    "2001:20::1", "2001:30::1", "2606:4700:4700::1111",
  ])("retains documented globally reachable address %s", (address) => {
    expect(isDirectoryEvidencePublicIp(address)).toBe(true);
  });

  it("rejects a DNS answer set containing even one non-global address", () => {
    expect(areDirectoryEvidenceAddressesPublic(["8.8.8.8", "10.0.0.1"])).toBe(false);
  });

  it("rejects an injected IPv4-compatible IPv6 DNS answer before connection", async () => {
    const pinnedRequest = vi.fn();
    await expect(validateDirectoryEvidenceUrl("https://example.com/evidence", {
      resolveAddresses: async () => ["::127.0.0.1"],
      request: pinnedRequest,
    })).resolves.toBeNull();
    expect(pinnedRequest).not.toHaveBeenCalled();
  });

  it("re-resolves and revalidates every redirect before a second request", async () => {
    const resolveAddresses = vi.fn(async (url: URL) => url.hostname === "first.example" ? ["8.8.8.8"] : null);
    const pinnedRequest = vi.fn(async (_url: URL, _address: string, _method: "HEAD" | "GET") => ({
      status: 302,
      location: "https://second.example/evidence",
    }));
    await expect(validateDirectoryEvidenceUrl("https://first.example/evidence", {
      resolveAddresses,
      request: pinnedRequest,
    })).resolves.toBeNull();
    expect(resolveAddresses.mock.calls.map(([url]) => url.hostname)).toEqual(["first.example", "second.example"]);
    expect(pinnedRequest).toHaveBeenCalledOnce();
    expect(pinnedRequest.mock.calls[0]?.[1]).toBe("8.8.8.8");
  });

  it.each([
    "http://127.0.0.1/private",
    "http://100.64.0.1/shared",
    "http://[::ffff:127.0.0.1]/mapped-loopback",
  ])("rejects non-global evidence URL %s before any HTTP request", async (url) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(validateDirectoryEvidenceUrl(url)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a first geocoder result that resolves to the wrong city", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{
        lat: "32.2226",
        lon: "-110.9747",
        osm_id: 10,
        osm_type: "node",
        display_name: "100 Main Street, Tucson, Arizona",
        address: { house_number: "100", road: "Main Street", city: "Tucson", state: "Arizona", "ISO3166-2-lvl4": "US-AZ" },
      }]),
    }));
    await expect(geocodeDirectoryCandidate(candidate())).resolves.toBeNull();
  });

  it("returns source-backed coordinates only when city, state, street, and house number match", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{
        lat: "33.4484",
        lon: "-112.0740",
        osm_id: 11,
        osm_type: "way",
        display_name: "100 Main Street, Phoenix, Arizona",
        address: { house_number: "100", road: "Main Street", city: "Phoenix", state: "Arizona", "ISO3166-2-lvl4": "US-AZ" },
      }]),
    }));
    await expect(geocodeDirectoryCandidate(candidate())).resolves.toMatchObject({
      latitude: 33.4484,
      longitude: -112.074,
      sourceUrl: "https://www.openstreetmap.org/way/11",
      resolvedCity: "Phoenix",
    });
  });

  it("requires regulated evidence and ownership review without treating founder intent as verification", () => {
    const held = candidate({
      target_kind: "regulated_review",
      regulated_profession: true,
      ownership_designations: ["Black / African American-Owned"],
      ownership_evidence: "External directory statement",
    });

    expect(evaluatePublicationHolds(held, { action: "publish" } as any)).toEqual(expect.arrayContaining([
      "Ownership evidence must be confirmed or the public ownership designations must be omitted.",
      "Current regulated-profession evidence is required.",
    ]));
    expect(evaluatePublicationHolds(held, {
      action: "publish",
      omitOwnershipDesignations: true,
      regulatedEvidence: {
        authority: "Arizona Registrar of Contractors",
        licenseNumber: "ROC-123456",
        licenseStatus: "active",
        ...validatedEvidence(held, "regulated", "https://roc.az.gov/"),
      },
    } as any, LOCATION_SIGNING_SECRET)).toEqual([]);
  });

  it("never permits internal-only or unresolved manual-review candidates to publish", () => {
    expect(evaluatePublicationHolds(candidate({ target_kind: "internal_only" }), { action: "publish" } as any)[0]).toContain("Internal-only");
    expect(evaluatePublicationHolds(candidate({ target_kind: "manual_review" }), { action: "publish" } as any)[0]).toContain("Destination");
  });

  it("requires a reviewed Resources category and current source evidence for community resources", () => {
    const resource = candidate({ target_kind: "community_resource", regulated_profession: false });
    expect(evaluatePublicationHolds(resource, { action: "publish" } as any)).toEqual(expect.arrayContaining([
      "A reviewed Resources category is required.",
      "Current source evidence is required for a community resource.",
    ]));
  });

  it("rejects stale or non-authority regulated evidence", () => {
    const held = candidate({ target_kind: "regulated_review", regulated_profession: true });
    expect(evaluatePublicationHolds(held, {
      action: "publish",
      regulatedEvidence: {
        authority: "Example licensing board",
        licenseNumber: "123",
        licenseStatus: "active",
        sourceUrl: "https://example.com/license/123",
        checkedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1_000).toISOString(),
      },
    } as any)).toContain("Current regulated-profession evidence is required.");
  });

  it("does not let a confirmation checkbox authorize an unvalidated public URL override", () => {
    expect(evaluatePublicationHolds(candidate(), {
      action: "publish",
      memberFacingUrl: "https://unrelated.example/",
      linkEvidenceConfirmed: true,
    } as any)).toContain("A member-facing link must match fresh successful link evidence (or the reviewed current resource source).");
  });
});

describe("founder directory route authorization", () => {
  const emptyDatabase = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    connect: vi.fn(),
  };

  it("rejects unauthenticated and non-admin callers before querying candidate records", async () => {
    const unauthenticatedDb = { query: vi.fn().mockResolvedValue({ rows: [] }), connect: vi.fn() };
    const unauthenticated = await request(routeApp(unauthenticatedDb, "none"))
      .get("/api/founder/directory-import-candidates");
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticatedDb.query).not.toHaveBeenCalled();

    const memberDb = { query: vi.fn().mockResolvedValue({ rows: [] }), connect: vi.fn() };
    const member = await request(routeApp(memberDb, "user"))
      .get("/api/founder/directory-import-candidates");
    expect(member.status).toBe(403);
    expect(memberDb.query).not.toHaveBeenCalled();
  });

  it("requires an idempotency key and optimistic candidate revision", async () => {
    const noKey = await request(routeApp(emptyDatabase))
      .post(`/api/founder/directory-import-candidates/${candidate().id}/decision`)
      .send({ action: "publish", expectedRevision: 0 });
    expect(noKey.status).toBe(400);
    expect(noKey.body.code).toBe("IDEMPOTENCY_KEY_REQUIRED");

    const noRevision = await request(routeApp(emptyDatabase))
      .post(`/api/founder/directory-import-candidates/${candidate().id}/decision`)
      .set("Idempotency-Key", "review-request-1")
      .send({ action: "publish" });
    expect(noRevision.status).toBe(400);
    expect(noRevision.body.code).toBe("EXPECTED_REVISION_REQUIRED");
  });

  it("issues a signed location suggestion only after server-side address validation", async () => {
    const record = candidate();
    const database = {
      query: vi.fn().mockResolvedValue({ rows: [record] }),
      connect: vi.fn(),
    };
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/location-suggestion`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.suggestion).toMatchObject({ latitude: 33.4484, longitude: -112.074 });
    expect(response.body.suggestionToken.split(".")).toHaveLength(2);
    expect(database.connect).not.toHaveBeenCalled();
  });

  it("issues candidate-bound evidence only after a live resource URL check", async () => {
    const record = candidate({ target_kind: "community_resource" });
    const database = {
      query: vi.fn().mockResolvedValue({ rows: [record] }),
      connect: vi.fn(),
    };
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/validate-evidence-url`)
      .send({ purpose: "resource", url: "https://www.phoenix.gov/example-apprenticeship" });

    expect(response.status).toBe(200);
    expect(response.body.validation).toMatchObject({ status: 200, finalHost: "phoenix.gov" });
    expect(response.body.validationToken.split(".")).toHaveLength(2);
    expect(database.connect).not.toHaveBeenCalled();
  });
});

describe("atomic founder directory publication", () => {
  it("blocks every decision while the import batch is incomplete", async () => {
    const record = candidate();
    const database = decisionDatabase(record);
    database.clientQuery.mockImplementation((async (sql: string) => {
      if (sql.includes("FROM directory_import_candidates") && sql.includes("FOR UPDATE")) return { rows: [record] };
      if (sql.includes("FROM directory_import_batches") && sql.includes("FOR UPDATE")) return { rows: [{ status: "staged" }] };
      return { rows: [] };
    }) as any);
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "incomplete-batch-decision")
      .send({ action: "needs_research", expectedRevision: 0, reviewNote: "Hold" });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("BATCH_NOT_REVIEW_READY");
    expect(database.clientQuery.mock.calls.some(([sql]) => String(sql).includes("UPDATE directory_import_candidates"))).toBe(false);
    expect(database.clientQuery).toHaveBeenCalledWith("ROLLBACK");
  });

  it("refuses business publication unless location evidence is source-backed and founder-confirmed", async () => {
    const record = candidate();
    const database = decisionDatabase(record);
    const unconfirmed = { ...confirmedLocation(record), confirmedByReviewer: false };
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "unconfirmed-location")
      .send({ action: "publish", expectedRevision: 0, locationEvidence: unconfirmed });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("LOCATION_EVIDENCE_REQUIRED");
    expect(database.connect).not.toHaveBeenCalled();
  });

  it("rejects a tampered server location suggestion token", async () => {
    const record = candidate();
    const database = decisionDatabase(record);
    const evidence = confirmedLocation(record);
    evidence.suggestionToken = `${evidence.suggestionToken.slice(0, -1)}x`;
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "tampered-location")
      .send({ action: "publish", expectedRevision: 0, locationEvidence: evidence });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("LOCATION_EVIDENCE_REQUIRED");
    expect(database.connect).not.toHaveBeenCalled();
  });

  it("publishes one unclaimed, unverified business with provenance and location indexing", async () => {
    const record = candidate();
    const database = decisionDatabase(record);
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "business-publish-1")
      .send({ action: "publish", expectedRevision: 0, reviewNote: "Founder reviewed source and location.", locationEvidence: confirmedLocation(record) });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("unclaimed and not verified");
    const sql = database.clientQuery.mock.calls.map(([statement]) => String(statement));
    const businessInsert = sql.find((statement) => statement.includes("INSERT INTO businesses"));
    expect(businessInsert).toContain("'active','live_unclaimed'");
    expect(businessInsert).toContain("'community','community_listed','unclaimed'");
    expect(businessInsert).toContain("verified_designations");
    expect(sql.some((statement) => statement.includes("pg_advisory_xact_lock"))).toBe(true);
    expect(sql.some((statement) => statement.includes("INSERT INTO canonical_record_locations"))).toBe(true);
    expect(sql.some((statement) => statement.includes("INSERT INTO directory_import_publications"))).toBe(true);
    expect(sql.some((statement) => statement.includes("INSERT INTO directory_import_decision_events"))).toBe(true);
    expect(sql).toContain("BEGIN");
    expect(sql).toContain("COMMIT");
    expect(database.release).toHaveBeenCalledOnce();
  });

  it("publishes community resources only to resources, never businesses", async () => {
    const record = candidate({
      target_kind: "community_resource",
      status: "needs_research",
      name: "City of Phoenix HVAC Apprenticeship",
      address: null,
      phone: null,
      source_url: null,
      link_validation: { reviewGates: [] },
    });
    const database = decisionDatabase(record);
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "resource-publish-1")
      .send({
        action: "publish",
        expectedRevision: 0,
        reviewNote: "Reviewed official apprenticeship page.",
        resourceCategory: "education",
        resourceSourceTier: "community_shared",
        resourceEvidence: {
          organization: "City of Phoenix",
          ...validatedEvidence(record, "resource", "https://www.phoenix.gov/example-apprenticeship"),
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.recordType).toBe("resource");
    expect(response.body.message).toContain("published to Resources");
    const sql = database.clientQuery.mock.calls.map(([statement]) => String(statement));
    expect(sql.some((statement) => statement.includes("INSERT INTO resources"))).toBe(true);
    expect(sql.some((statement) => statement.includes("directory_import_resource_provenance"))).toBe(true);
    expect(sql.some((statement) => statement.includes("INSERT INTO businesses"))).toBe(false);
  });

  it("links a reviewed canonical match without geocoding or overwriting the business", async () => {
    const existingId = "00000000-0000-4000-8000-000000000399";
    const record = candidate({
      target_kind: "regulated_review",
      regulated_profession: true,
      matched_business_id: existingId,
      link_validation: { reviewGates: ["existing_record_match", "regulated_profession"] },
    });
    const database = decisionDatabase(record);
    database.clientQuery.mockImplementation((async (sql: string) => {
      if (sql.includes("FROM directory_import_candidates") && sql.includes("FOR UPDATE")) return { rows: [record] };
      if (sql.includes("FROM directory_import_batches") && sql.includes("FOR UPDATE")) return { rows: [{ status: "in_review" }] };
      if (sql.includes("FROM businesses")) return { rows: [{ id: existingId, name: record.name }] };
      if (sql.includes("INSERT INTO business_publication_identities")) return { rows: [{ business_id: existingId }] };
      if (sql.includes("UPDATE directory_import_candidates")) return { rows: [{ ...record, status: "published", published_record_type: "business", published_record_id: existingId, review_revision: 1 }] };
      return { rows: [] };
    }) as any);
    const geocode = vi.fn();
    const response = await request(routeApp(database, "admin", geocode))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "business-link-existing-1")
      .send({ action: "link_existing", expectedRevision: 0, existingRecordId: existingId });

    expect(response.status).toBe(200);
    expect(response.body.publicationAction).toBe("link_existing");
    expect(response.body.recordId).toBe(existingId);
    expect(geocode).not.toHaveBeenCalled();
    const sql = database.clientQuery.mock.calls.map(([statement]) => String(statement));
    expect(sql.some((statement) => statement.includes("INSERT INTO businesses"))).toBe(false);
    expect(sql.some((statement) => statement.includes("INSERT INTO directory_import_publications"))).toBe(true);
  });

  it("refuses link-existing when the canonical identity table names a different winner", async () => {
    const requestedId = "00000000-0000-4000-8000-000000000399";
    const winnerId = "00000000-0000-4000-8000-000000000398";
    const record = candidate({ matched_business_id: requestedId });
    const database = decisionDatabase(record);
    database.clientQuery.mockImplementation((async (sql: string) => {
      if (sql.includes("FROM directory_import_candidates") && sql.includes("FOR UPDATE")) return { rows: [record] };
      if (sql.includes("FROM directory_import_batches") && sql.includes("FOR UPDATE")) return { rows: [{ status: "in_review" }] };
      if (sql.includes("FROM businesses")) return { rows: [{ id: requestedId, name: record.name }] };
      if (sql.includes("INSERT INTO business_publication_identities")) return { rows: [{ business_id: winnerId }] };
      return { rows: [] };
    }) as any);
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "identity-winner-conflict")
      .send({ action: "link_existing", expectedRevision: 0, existingRecordId: requestedId });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("BUSINESS_IDENTITY_CONFLICT");
    expect(response.body.businessId).toBe(winnerId);
    expect(database.clientQuery).toHaveBeenCalledWith("ROLLBACK");
  });

  it("rolls back every canonical write when publication fails", async () => {
    const record = candidate();
    const database = decisionDatabase(record, "INSERT INTO canonical_record_locations");
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "business-publish-failure")
      .send({ action: "publish", expectedRevision: 0, locationEvidence: confirmedLocation(record) });

    expect(response.status).toBe(500);
    expect(database.clientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(database.clientQuery.mock.calls.some(([sql]) => String(sql).includes("UPDATE directory_import_candidates"))).toBe(false);
    expect(database.release).toHaveBeenCalledOnce();
  });

  it("replays an accepted idempotency key without opening a second transaction", async () => {
    const record = candidate({
      status: "published",
      published_record_type: "business",
      published_record_id: "00000000-0000-4000-8000-000000000301",
    });
    const body = { action: "publish", expectedRevision: 0 };
    const crypto = await import("node:crypto");
    const payloadHash = crypto.createHash("sha256").update(JSON.stringify({ action: "publish", expectedRevision: 0 })).digest("hex");
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("FROM directory_import_decision_events")) {
        return { rows: [{ candidate_id: record.id, payload_hash: payloadHash, published_record_type: "business", published_record_id: record.published_record_id }] };
      }
      if (sql.includes("FROM directory_import_candidates")) return { rows: [record] };
      return { rows: [] };
    });
    const database = { query, connect: vi.fn() };
    const response = await request(routeApp(database))
      .post(`/api/founder/directory-import-candidates/${record.id}/decision`)
      .set("Idempotency-Key", "accepted-response-replay")
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body.replayed).toBe(true);
    expect(response.body.recordId).toBe(record.published_record_id);
    expect(database.connect).not.toHaveBeenCalled();
  });
});

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Predicate =
  | { kind: "eq"; column: unknown; value: unknown }
  | { kind: "and"; predicates: Predicate[] }
  | { kind: "sql"; strings: string; values: unknown[] }
  | { kind: "other" };

type BusinessRow = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: Date;
  ownerIds: string[];
};

const OWNER_A = "owner-a";
const OWNER_B = "owner-b";
const OUTSIDER = "member-outside";
const BUSINESS_A = "business-a";
const BUSINESS_B = "business-b";
const INITIAL_A_REVISION = "2026-10-20T00:00:00.000Z";
const INITIAL_B_REVISION = "2026-10-20T00:00:01.000Z";

const fakes = vi.hoisted(() => {
  const table = (name: string): Record<string, string> & { table: string } =>
    new Proxy(
      { table: name } as Record<string, string> & { table: string },
      {
        get(target, property) {
          if (property === "table") return target.table;
          if (typeof property === "symbol") return undefined;
          return `${name}.${property}`;
        },
      },
    );

  return {
    state: {
      businesses: [] as BusinessRow[],
      selectCalls: 0,
      updateCalls: 0,
      atomicUpdateIds: [] as string[],
      poolCalls: 0,
      logCalls: 0,
    },
    tables: {
      businesses: table("businesses"),
      businessIdentity: table("businessIdentity"),
      businessProfileViews: table("businessProfileViews"),
      userSettings: table("userSettings"),
      users: table("users"),
      docusignEnvelopes: table("docusignEnvelopes"),
      businessPromotions: table("businessPromotions"),
      businessSearchInquiries: table("businessSearchInquiries"),
      userPreferences: table("userPreferences"),
      businessClickEvents: table("businessClickEvents"),
      businessCaptions: table("businessCaptions"),
      contentReports: table("contentReports"),
      referenceLinkClicks: table("referenceLinkClicks"),
    },
  };
});

function predicatesOf(predicate: unknown): Predicate[] {
  if (!predicate || typeof predicate !== "object") return [];
  const candidate = predicate as Predicate;
  return candidate.kind === "and"
    ? [candidate, ...candidate.predicates.flatMap(predicatesOf)]
    : [candidate];
}

function equalValue(predicate: unknown, column: unknown): unknown {
  for (const candidate of predicatesOf(predicate)) {
    if (candidate.kind === "eq" && candidate.column === column) {
      return candidate.value;
    }
  }
  return undefined;
}

function ownerIdFrom(predicate: unknown): string | undefined {
  for (const candidate of predicatesOf(predicate)) {
    if (candidate.kind !== "sql" || !candidate.strings.includes("business_owner_links")) {
      continue;
    }
    const owner = candidate.values.find(
      (value): value is string =>
        typeof value === "string" && value !== "businesses.id",
    );
    if (owner) return owner;
  }
  return undefined;
}

function expectedRevisionFrom(predicate: unknown): Date | undefined {
  for (const candidate of predicatesOf(predicate)) {
    if (candidate.kind !== "sql") continue;
    const expected = candidate.values.find((value): value is Date => value instanceof Date);
    if (expected) return expected;
  }
  return undefined;
}

function matchingBusinesses(predicate: unknown): BusinessRow[] {
  const businessId = equalValue(predicate, fakes.tables.businesses.id);
  const ownerId = ownerIdFrom(predicate);
  const expectedRevision = expectedRevisionFrom(predicate);

  return fakes.state.businesses.filter((business) => {
    if (typeof businessId === "string" && business.id !== businessId) return false;
    if (ownerId && !business.ownerIds.includes(ownerId)) return false;
    if (expectedRevision && business.updatedAt.getTime() !== expectedRevision.getTime()) {
      return false;
    }
    return true;
  });
}

function responseBusiness(business: BusinessRow) {
  return {
    id: business.id,
    name: business.name,
    description: business.description,
    updatedAt: business.updatedAt,
  };
}

vi.mock("drizzle-orm", () => {
  const sql = (strings: TemplateStringsArray, ...values: unknown[]): Predicate => ({
    kind: "sql",
    strings: strings.join(""),
    values,
  });

  return {
    eq: (column: unknown, value: unknown): Predicate => ({
      kind: "eq",
      column,
      value,
    }),
    and: (...predicates: Predicate[]): Predicate => ({ kind: "and", predicates }),
    or: (...predicates: Predicate[]): Predicate => ({ kind: "other" }),
    ilike: (): Predicate => ({ kind: "other" }),
    desc: (): Predicate => ({ kind: "other" }),
    asc: (): Predicate => ({ kind: "other" }),
    gt: (): Predicate => ({ kind: "other" }),
    count: (): Predicate => ({ kind: "other" }),
    inArray: (): Predicate => ({ kind: "other" }),
    ne: (): Predicate => ({ kind: "other" }),
    sql,
  };
});

vi.mock("@workspace/db", () => {
  const db = {
    select: vi.fn((shape?: Record<string, unknown>) => ({
      from: () => {
        let predicate: unknown;
        const query = {
          where: (nextPredicate: unknown) => {
            predicate = nextPredicate;
            return query;
          },
          orderBy: () => query,
          limit: async () => {
            fakes.state.selectCalls += 1;
            return matchingBusinesses(predicate).map((business) => {
              if (!shape) return responseBusiness(business);
              return Object.fromEntries(
                Object.keys(shape).map((key) => [key, business[key as keyof BusinessRow]]),
              );
            });
          },
        };
        return query;
      },
    })),
    update: vi.fn(() => ({
      set: (updates: Record<string, unknown>) => ({
        where: (predicate: unknown) => ({
          returning: async () => {
            const [business] = matchingBusinesses(predicate);
            if (!business) return [];

            fakes.state.updateCalls += 1;
            fakes.state.atomicUpdateIds.push(business.id);
            if (typeof updates.name === "string") business.name = updates.name;
            if (typeof updates.description === "string" || updates.description === null) {
              business.description = updates.description;
            }
            business.updatedAt = new Date(business.updatedAt.getTime() + 1);
            return [responseBusiness(business)];
          },
        }),
      }),
    })),
  };

  return {
    db,
    pool: {
      connect: vi.fn(async () => {
        fakes.state.poolCalls += 1;
        throw new Error("selected profile routes must not use the pool");
      }),
    },
    businessesTable: fakes.tables.businesses,
    businessIdentityTable: fakes.tables.businessIdentity,
    businessProfileViewsTable: fakes.tables.businessProfileViews,
    userSettingsTable: fakes.tables.userSettings,
    usersTable: fakes.tables.users,
    docusignEnvelopesTable: fakes.tables.docusignEnvelopes,
    businessPromotionsTable: fakes.tables.businessPromotions,
    businessSearchInquiriesTable: fakes.tables.businessSearchInquiries,
    userPreferencesTable: fakes.tables.userPreferences,
    businessClickEventsTable: fakes.tables.businessClickEvents,
    businessCaptionsTable: fakes.tables.businessCaptions,
    contentReportsTable: fakes.tables.contentReports,
    referenceLinkClicksTable: fakes.tables.referenceLinkClicks,
    BUSINESS_CATEGORY_TAXONOMY: [],
    ALL_VALID_CATEGORY_NAMES: ["Food & Drink"],
  };
});

vi.mock("../../lib/db-retry", () => ({ withDbRetry: async (run: () => unknown) => run() }));
vi.mock("../../lib/pushNotifications", () => ({ sendAddressUpdateNotifications: vi.fn() }));
vi.mock("../../lib/docusign", () => ({ createFoundingAgreementEnvelope: vi.fn() }));
vi.mock("../../lib/email", () => ({ sendFoundingWelcomeEmail: vi.fn(), sendSearchInquiryAlert: vi.fn() }));
vi.mock("../../lib/objectStorage", () => ({ objectStorageClient: {} }));
vi.mock("../../middleware/rateLimiter", () => ({ reportLimiter: (_req: unknown, _res: unknown, next: () => void) => next() }));
vi.mock("../../middlewares/requireAuth", () => ({ requireApprovedMember: (_req: unknown, _res: unknown, next: () => void) => next(), requireAuth: (_req: unknown, _res: unknown, next: () => void) => next() }));
vi.mock("../../lib/dynamicResponseCache", () => ({ sendDynamicJson: (_req: unknown, res: { json: (body: unknown) => void }, body: unknown) => res.json(body) }));
vi.mock("../../businesses/publicBusinessDiscoveryPolicy", () => ({ isPublicBusinessDiscoveryRead: () => false }));
vi.mock("../../businesses/canonicalBusiness", () => ({ resolveCanonicalBusinessId: vi.fn() }));
vi.mock("../../businesses/publicListingCopy", () => ({ sanitizePublicListingCopy: (value: unknown) => value }));
vi.mock("../../businesses/mapCoordinateIntegrity", () => ({ hasTrustworthyMapCoordinate: () => false, MAP_LOCATION_HOLD_REASON: "" }));
vi.mock("../../businesses/mapPinViewport", () => ({ decodeMapPinCursor: vi.fn(), encodeMapPinCursor: vi.fn(), MapPinViewportInputError: class extends Error {}, mapPinViewportFromQuery: vi.fn(), mapPinViewportScope: vi.fn() }));
vi.mock("../../businesses/mwmCoreDiscoveryPolicy", () => ({ mwmDiasporaPromotionSqlPredicate: vi.fn(), mwmPublicDirectorySqlPredicate: vi.fn() }));
vi.mock("../../businesses/documentedDiscoveryEligibility", () => ({ documentedDiscoveryEligibilitySqlPredicate: vi.fn() }));
vi.mock("../../businesses/businessDuplicateIdentity", () => ({ highConfidenceBusinessDuplicateReasons: vi.fn(), normalizeBusinessPhone: (value: string) => value, normalizeOfficialSocialProfileForPlatform: (value: string) => value, normalizeOfficialWebsiteDomain: (value: string) => value }));
vi.mock("../../businesses/adminBusinessProfilePolicy", () => ({ adminProfileUpdateSqlBinding: vi.fn(), directAdminCreationUnsafeFields: new Set(), normalizeBusinessIdentityPart: (value: string) => value, validateAdminBusinessProfilePatch: vi.fn() }));
vi.mock("../../lib/adminAuth", () => ({ isAdmin: () => false }));
vi.mock("../../businesses/businessImageEligibility", () => ({ BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION: "test", attachEligibleBusinessImages: vi.fn(), ensureBusinessImageEvidenceSchema: vi.fn() }));
vi.mock("../../businessIntake/types", () => ({ validateSubmission: vi.fn() }));
vi.mock("../../businessIntake/submissionRepository", () => ({ SubmissionRepository: class {} }));
vi.mock("@workspace/constants", () => ({ detectSocialVideoPlatform: vi.fn(), ownershipDesignationFilterId: vi.fn(), ownershipDesignationStorageValues: vi.fn(), normalizeOwnershipDesignationFilterIds: vi.fn(), findBusinessExperienceKeysForSearch: vi.fn(), findVibeKeysForSearch: vi.fn(), findSafeSearchClarification: vi.fn(), normalizeOwnerExperienceKey: (value: string) => value, VIBES_BY_CATEGORY: {} }));
vi.mock("../../kinfolk/designation-predicate-policy", () => ({ buildDesignationPredicateSql: vi.fn(), legacyDesignationColumn: vi.fn(), resolveDesignationScope: vi.fn() }));

import businessesRouter from "../businesses";

function app(): express.Express {
  const server = express();
  server.use(express.json());
  server.use((req, _res, next) => {
    const memberId = req.header("x-member-id");
    if (memberId) (req as { user?: { id: string } }).user = { id: memberId };
    (req as any).log = {
      error: () => {
        fakes.state.logCalls += 1;
      },
    };
    next();
  });
  server.use(businessesRouter);
  return server;
}

function revisionFor(businessId: string): string {
  const business = fakes.state.businesses.find((candidate) => candidate.id === businessId);
  if (!business) throw new Error(`missing test business ${businessId}`);
  return business.updatedAt.toISOString();
}

function resetFakes(): void {
  fakes.state.businesses = [
    {
      id: BUSINESS_A,
      name: "Owner A Bakery",
      description: "Original description",
      updatedAt: new Date(INITIAL_A_REVISION),
      ownerIds: [OWNER_A],
    },
    {
      id: BUSINESS_B,
      name: "Owner B Books",
      description: "Second business",
      updatedAt: new Date(INITIAL_B_REVISION),
      ownerIds: [OWNER_B],
    },
  ];
  fakes.state.selectCalls = 0;
  fakes.state.updateCalls = 0;
  fakes.state.atomicUpdateIds = [];
  fakes.state.poolCalls = 0;
  fakes.state.logCalls = 0;
}

beforeEach(() => resetFakes());

describe("selected managed business profile authority", () => {
  it("denies anonymous selected-profile reads and writes before any query or mutation", async () => {
    const server = app();
    const revision = revisionFor(BUSINESS_A);

    const read = await request(server).get(`/businesses/mine/managed/${BUSINESS_A}`);
    const write = await request(server)
      .patch(`/businesses/mine/managed/${BUSINESS_A}/profile`)
      .send({ name: "Should never save", expectedUpdatedAt: revision });

    expect(read.statusCode).toBe(401);
    expect(write.statusCode).toBe(401);
    expect(read.body).toEqual({ error: "Unauthorized" });
    expect(write.body).toEqual({ error: "Unauthorized" });
    expect(fakes.state.selectCalls).toBe(0);
    expect(fakes.state.updateCalls).toBe(0);
    expect(fakes.state.poolCalls).toBe(0);
  });

  it("lets an approved selected owner read and atomically update only that business, then confirms a fresh authorized readback", async () => {
    const server = app();
    const revision = revisionFor(BUSINESS_A);

    const initialRead = await request(server)
      .get(`/businesses/mine/managed/${BUSINESS_A}`)
      .set("x-member-id", OWNER_A);
    expect(initialRead.statusCode).toBe(200);
    expect(initialRead.body.business).toMatchObject({
      id: BUSINESS_A,
      name: "Owner A Bakery",
      updatedAt: INITIAL_A_REVISION,
    });

    const updated = await request(server)
      .patch(`/businesses/mine/managed/${BUSINESS_A}/profile`)
      .set("x-member-id", OWNER_A)
      .send({ name: "Owner A Community Bakery", expectedUpdatedAt: revision });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.business).toMatchObject({
      id: BUSINESS_A,
      name: "Owner A Community Bakery",
    });
    expect(fakes.state.updateCalls).toBe(1);
    expect(fakes.state.atomicUpdateIds).toEqual([BUSINESS_A]);
    expect(fakes.state.businesses.find((business) => business.id === BUSINESS_B)).toMatchObject({
      name: "Owner B Books",
      updatedAt: new Date(INITIAL_B_REVISION),
    });

    const freshRead = await request(server)
      .get(`/businesses/mine/managed/${BUSINESS_A}`)
      .set("x-member-id", OWNER_A);
    expect(freshRead.statusCode).toBe(200);
    expect(freshRead.body.business).toMatchObject({
      id: BUSINESS_A,
      name: "Owner A Community Bakery",
    });
    expect(freshRead.body.business.updatedAt).not.toBe(INITIAL_A_REVISION);
    expect(fakes.state.poolCalls).toBe(0);
  });

  it("returns the neutral not-found response for cross-business and unauthorized selections before any write", async () => {
    const server = app();
    const secondBusinessRevision = revisionFor(BUSINESS_B);
    const firstBusinessRevision = revisionFor(BUSINESS_A);

    const crossRead = await request(server)
      .get(`/businesses/mine/managed/${BUSINESS_B}`)
      .set("x-member-id", OWNER_A);
    const crossWrite = await request(server)
      .patch(`/businesses/mine/managed/${BUSINESS_B}/profile`)
      .set("x-member-id", OWNER_A)
      .send({ name: "Wrong business", expectedUpdatedAt: secondBusinessRevision });
    const unauthorizedRead = await request(server)
      .get(`/businesses/mine/managed/${BUSINESS_A}`)
      .set("x-member-id", OUTSIDER);
    const unauthorizedWrite = await request(server)
      .patch(`/businesses/mine/managed/${BUSINESS_A}/profile`)
      .set("x-member-id", OUTSIDER)
      .send({ name: "Unauthorized write", expectedUpdatedAt: firstBusinessRevision });

    for (const response of [crossRead, crossWrite, unauthorizedRead, unauthorizedWrite]) {
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Managed business not found." });
    }
    expect(fakes.state.updateCalls).toBe(0);
    expect(fakes.state.atomicUpdateIds).toEqual([]);
    expect(fakes.state.businesses).toEqual([
      expect.objectContaining({ id: BUSINESS_A, name: "Owner A Bakery" }),
      expect.objectContaining({ id: BUSINESS_B, name: "Owner B Books" }),
    ]);
  });

  it("requires a canonical profile revision before it queries or writes an approved selected business", async () => {
    const server = app();

    const response = await request(server)
      .patch(`/businesses/mine/managed/${BUSINESS_A}/profile`)
      .set("x-member-id", OWNER_A)
      .send({ name: "Missing revision" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: "A valid profile revision is required.",
      code: "BUSINESS_PROFILE_REVISION_REQUIRED",
    });
    expect(fakes.state.selectCalls).toBe(0);
    expect(fakes.state.updateCalls).toBe(0);
  });

  it("rejects a stale revision with the protected conflict code and no atomic update", async () => {
    const server = app();
    const staleRevision = revisionFor(BUSINESS_A);
    const current = fakes.state.businesses.find((business) => business.id === BUSINESS_A);
    if (!current) throw new Error("missing selected test business");
    current.updatedAt = new Date(current.updatedAt.getTime() + 10);

    const response = await request(server)
      .patch(`/businesses/mine/managed/${BUSINESS_A}/profile`)
      .set("x-member-id", OWNER_A)
      .send({ name: "Stale overwrite", expectedUpdatedAt: staleRevision });

    expect(response.statusCode).toBe(409);
    expect(response.body).toMatchObject({ code: "BUSINESS_PROFILE_STALE_WRITE" });
    expect(fakes.state.selectCalls).toBe(1);
    expect(fakes.state.updateCalls).toBe(0);
    expect(fakes.state.atomicUpdateIds).toEqual([]);
    expect(current.name).toBe("Owner A Bakery");
  });
});

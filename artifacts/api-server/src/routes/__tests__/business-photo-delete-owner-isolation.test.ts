import { readFileSync } from "node:fs";
import type { Request, Response } from "express";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Handler = (req: Request, res: Response) => Promise<void> | void;
type Business = {
  id: string;
  photos: string[] | null;
  imageUrl: string | null;
};

const mocks = vi.hoisted(() => {
  const unexpected = vi.fn(() => {
    throw new Error("Unexpected boundary invocation");
  });
  return {
    handlers: new Map<string, Handler>(),
    unexpected,
    select: vi.fn(),
    from: vi.fn(),
    selectWhere: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    updateWhere: vi.fn(),
    returning: vi.fn(),
    bucket: vi.fn(),
    file: vi.fn(),
    deleteObject: vi.fn(),
    table: { id: "businesses.id", photos: "businesses.photos", imageUrl: "businesses.imageUrl" },
  };
});

vi.mock("express", () => ({
  Router: () => Object.fromEntries(["get", "post", "put", "patch", "delete", "use"].map((method) => [
    method,
    (path: string, ...handlers: Handler[]) => {
      if (method === "delete") mocks.handlers.set(`${method} ${path}`, handlers.at(-1)!);
    },
  ])),
}));
vi.mock("multer", () => ({
  default: Object.assign(() => ({ single: () => mocks.unexpected, array: () => mocks.unexpected }), {
    memoryStorage: () => ({}),
  }),
}));
vi.mock("@workspace/db", () => ({
  db: { select: mocks.select, update: mocks.update, insert: mocks.unexpected },
  pool: { query: mocks.unexpected },
  businessesTable: mocks.table,
  businessIdentityTable: {}, businessProfileViewsTable: {}, userSettingsTable: {}, usersTable: {},
  docusignEnvelopesTable: {}, businessPromotionsTable: {}, businessSearchInquiriesTable: {},
  userPreferencesTable: {}, businessClickEventsTable: {}, businessCaptionsTable: {},
  contentReportsTable: {}, referenceLinkClicksTable: {},
  BUSINESS_CATEGORY_TAXONOMY: [], ALL_VALID_CATEGORY_NAMES: [],
}));
vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
  and: mocks.unexpected, or: mocks.unexpected, ilike: mocks.unexpected,
  desc: mocks.unexpected, asc: mocks.unexpected, gt: mocks.unexpected,
  count: mocks.unexpected, inArray: mocks.unexpected, ne: mocks.unexpected,
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    kind: "sql", text: strings.join("?").replace(/\s+/g, " ").trim(), values,
  }),
}));
vi.mock("../../lib/db-retry", () => ({ withDbRetry: mocks.unexpected }));
vi.mock("../../lib/pushNotifications", () => ({ sendAddressUpdateNotifications: mocks.unexpected }));
vi.mock("../../lib/docusign", () => ({ createFoundingAgreementEnvelope: mocks.unexpected }));
vi.mock("../../lib/email", () => ({ sendFoundingWelcomeEmail: mocks.unexpected, sendSearchInquiryAlert: mocks.unexpected }));
vi.mock("../../lib/objectStorage", () => ({ objectStorageClient: { bucket: mocks.bucket } }));
vi.mock("../../middleware/rateLimiter", () => ({ reportLimiter: mocks.unexpected }));
vi.mock("../../middlewares/requireAuth", () => ({ requireApprovedMember: mocks.unexpected, requireAuth: mocks.unexpected }));
vi.mock("../../lib/dynamicResponseCache", () => ({ sendDynamicJson: mocks.unexpected }));
vi.mock("../../businesses/publicBusinessDiscoveryPolicy", () => ({ isPublicBusinessDiscoveryRead: mocks.unexpected }));
vi.mock("../../businesses/canonicalBusiness", () => ({ resolveCanonicalBusinessId: mocks.unexpected }));
vi.mock("../../businesses/publicListingCopy", () => ({ sanitizePublicListingCopy: mocks.unexpected }));
vi.mock("../../businesses/mapCoordinateIntegrity", () => ({ hasTrustworthyMapCoordinate: mocks.unexpected, MAP_LOCATION_HOLD_REASON: "mock" }));
vi.mock("../../businesses/mapPinViewport", () => ({
  decodeMapPinCursor: mocks.unexpected, encodeMapPinCursor: mocks.unexpected,
  MapPinViewportInputError: class extends Error {}, mapPinViewportFromQuery: mocks.unexpected,
  mapPinViewportScope: mocks.unexpected,
}));
vi.mock("../../businesses/mwmCoreDiscoveryPolicy", () => ({ mwmDiasporaPromotionSqlPredicate: mocks.unexpected, mwmPublicDirectorySqlPredicate: mocks.unexpected }));
vi.mock("../../businesses/documentedDiscoveryEligibility", () => ({ documentedDiscoveryEligibilitySqlPredicate: mocks.unexpected }));
vi.mock("../../businesses/businessDuplicateIdentity", () => ({
  highConfidenceBusinessDuplicateReasons: mocks.unexpected, normalizeBusinessPhone: mocks.unexpected,
  normalizeOfficialSocialProfileForPlatform: mocks.unexpected, normalizeOfficialWebsiteDomain: mocks.unexpected,
}));
vi.mock("../../businesses/adminBusinessProfilePolicy", () => ({
  adminProfileUpdateSqlBinding: mocks.unexpected, directAdminCreationUnsafeFields: mocks.unexpected,
  normalizeBusinessIdentityPart: mocks.unexpected, validateAdminBusinessProfilePatch: mocks.unexpected,
}));
vi.mock("../../businesses/businessImageEligibility", () => ({
  BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION: "mock", attachEligibleBusinessImages: mocks.unexpected,
  ensureBusinessImageEvidenceSchema: mocks.unexpected,
}));
vi.mock("../../businessIntake/types", () => ({ validateSubmission: mocks.unexpected }));
vi.mock("../../businessIntake/submissionRepository", () => ({ SubmissionRepository: class {} }));
vi.mock("../../lib/adminAuth", () => ({ isAdmin: mocks.unexpected }));
vi.mock("@workspace/constants", () => ({
  detectSocialVideoPlatform: mocks.unexpected, ownershipDesignationFilterId: mocks.unexpected,
  ownershipDesignationStorageValues: mocks.unexpected, normalizeOwnershipDesignationFilterIds: mocks.unexpected,
  findBusinessExperienceKeysForSearch: mocks.unexpected, findVibeKeysForSearch: mocks.unexpected,
  findSafeSearchClarification: mocks.unexpected, normalizeOwnerExperienceKey: mocks.unexpected, VIBES_BY_CATEGORY: {},
}));
vi.mock("../../kinfolk/designation-predicate-policy", () => ({
  buildDesignationPredicateSql: mocks.unexpected, legacyDesignationColumn: mocks.unexpected, resolveDesignationScope: mocks.unexpected,
}));

import "../businesses";

const businessId = "business-a";
const ownerId = "owner-a";
const bucketId = "owner-photo-test";
const ownPhoto = `https://storage.googleapis.com/${bucketId}/business-photos/${businessId}/owned.jpg`;
const keepPhoto = `https://storage.googleapis.com/${bucketId}/business-photos/${businessId}/keep.jpg`;
const foreignPhoto = `https://storage.googleapis.com/${bucketId}/business-photos/business-b/foreign.jpg`;
let selectedBusiness: Business;
let writes: Array<Partial<Business>>;
let sideEffects: string[];

function invoke(options: { user?: { id?: string } | null; url?: unknown } = {}) {
  const req = {
    user: "user" in options ? options.user : { id: ownerId },
    body: { url: "url" in options ? options.url : ownPhoto },
    log: { error: vi.fn() },
  } as unknown as Request;
  const response = { statusCode: 200, body: undefined as unknown, status: vi.fn(), json: vi.fn() };
  response.status.mockImplementation((status: number) => { response.statusCode = status; return response; });
  response.json.mockImplementation((body: unknown) => { response.body = body; return response; });
  const handler = mocks.handlers.get("delete /businesses/mine/photos");
  expect(handler).toBeTypeOf("function");
  return Promise.resolve(handler!(req, response as unknown as Response)).then(() => ({ req, response }));
}

function expectNoDeleteMutation() {
  expect(mocks.update).not.toHaveBeenCalled();
  expect(writes).toEqual([]);
  expect(mocks.bucket).not.toHaveBeenCalled();
  expect(mocks.file).not.toHaveBeenCalled();
  expect(mocks.deleteObject).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", bucketId);
  selectedBusiness = { id: businessId, photos: [ownPhoto, keepPhoto], imageUrl: ownPhoto };
  writes = [];
  sideEffects = [];
  mocks.select.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ where: mocks.selectWhere });
  mocks.selectWhere.mockImplementation(async () => [structuredClone(selectedBusiness)]);
  mocks.update.mockImplementation(() => {
    sideEffects.push("db-update");
    return { set: mocks.set };
  });
  mocks.set.mockImplementation((updates: Partial<Business>) => ({
    where: mocks.updateWhere.mockReturnValue({
      returning: mocks.returning.mockImplementation(async () => {
        writes.push(structuredClone(updates));
        selectedBusiness = { ...selectedBusiness, ...updates };
        return [structuredClone(selectedBusiness)];
      }),
    }),
  }));
  mocks.bucket.mockReturnValue({ file: mocks.file });
  mocks.file.mockReturnValue({ delete: mocks.deleteObject });
  mocks.deleteObject.mockImplementation(async () => {
    sideEffects.push("storage-delete");
  });
});

afterEach(() => {
  expect(mocks.unexpected).not.toHaveBeenCalled();
});
afterAll(() => vi.unstubAllEnvs());

describe("DELETE /businesses/mine/photos owner-scoped stored-photo binding", () => {
  it("retains the direct unauthenticated boundary before database, storage, or row mutation", async () => {
    const { response } = await invoke({ user: null, url: foreignPhoto });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(mocks.select).not.toHaveBeenCalled();
    expectNoDeleteMutation();
  });

  it("retains required photo URL validation before the owner lookup", async () => {
    const { response } = await invoke({ url: "" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "photo url is required" });
    expect(mocks.select).not.toHaveBeenCalled();
    expectNoDeleteMutation();
  });

  it.each([
    ["a different business's stored URL", foreignPhoto],
    ["a malformed and unlisted URL", "not a photo URL"],
    ["an unlisted storage-looking URL", `https://storage.googleapis.com/${bucketId}/business-photos/${businessId}/unlisted.jpg`],
  ])("rejects %s before object-key derivation, storage delete, or row mutation", async (_label, url) => {
    const { response } = await invoke({ url });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: "Photo not found" });
    expect(mocks.select).toHaveBeenCalledTimes(1);
    expectNoDeleteMutation();
  });

  it("preserves authorized own-photo removal and its existing response shape", async () => {
    const { response } = await invoke({ url: ownPhoto });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ photos: [keepPhoto], imageUrl: keepPhoto });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ photos: [keepPhoto], imageUrl: keepPhoto });
    expect(mocks.bucket).toHaveBeenCalledExactlyOnceWith(bucketId);
    expect(mocks.file).toHaveBeenCalledExactlyOnceWith(`business-photos/${businessId}/owned.jpg`);
    expect(mocks.deleteObject).toHaveBeenCalledTimes(1);
    expect(sideEffects).toEqual(["db-update", "storage-delete"]);
  });

  it("does not delete the storage object when persistence fails", async () => {
    mocks.update.mockImplementationOnce(() => {
      sideEffects.push("db-update");
      throw new Error("database unavailable");
    });

    const { response } = await invoke({ url: ownPhoto });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: "Failed to delete photo" });
    expect(mocks.bucket).not.toHaveBeenCalled();
    expect(mocks.deleteObject).not.toHaveBeenCalled();
    expect(sideEffects).toEqual(["db-update"]);
  });

  it("keeps the persisted removal successful when best-effort cleanup fails and rejects a repeated delete", async () => {
    mocks.deleteObject.mockImplementationOnce(async () => {
      sideEffects.push("storage-delete");
      throw new Error("object cleanup unavailable");
    });

    const first = await invoke({ url: ownPhoto });
    const repeated = await invoke({ url: ownPhoto });

    expect(first.response.statusCode).toBe(200);
    expect(repeated.response.statusCode).toBe(400);
    expect(repeated.response.body).toEqual({ error: "Photo not found" });
    expect(writes).toHaveLength(1);
    expect(mocks.deleteObject).toHaveBeenCalledTimes(1);
    expect(sideEffects).toEqual(["db-update", "storage-delete"]);
  });

  it("keeps the persisted-photo membership check after the current owner lookup and before side effects", () => {
    const source = readFileSync(new URL("../businesses.ts", import.meta.url), "utf8");
    const start = source.indexOf('router.delete("/businesses/mine/photos"');
    const end = source.indexOf('\nrouter.patch(\n  "/businesses/mine/photos/cover"', start);
    const handler = source.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(handler).toContain(".where(approvedOwnerPredicate(String(userId)))");
    expect(handler).toContain("const currentPhotos = Array.isArray(business.photos) ? business.photos : [];");
    expect(handler).toContain("if (!currentPhotos.includes(url)) {");
    expect(handler).toContain('res.status(400).json({ error: "Photo not found" });');
    expect(handler.indexOf("if (!currentPhotos.includes(url))")).toBeLessThan(handler.indexOf("const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;"));
    expect(handler.indexOf("if (!currentPhotos.includes(url))")).toBeLessThan(handler.indexOf("await db\n      .update(businessesTable)"));
    expect(handler.indexOf("await db\n      .update(businessesTable)")).toBeLessThan(handler.indexOf("const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;"));
  });
});

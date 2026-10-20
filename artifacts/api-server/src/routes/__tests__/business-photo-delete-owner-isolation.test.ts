import { readFileSync } from "node:fs";
import type { Request, Response } from "express";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

type Handler = (req: Request, res: Response) => Promise<void> | void;
type Business = {
  id: string;
  photos: string[] | null;
  pendingPhotos: string[] | null;
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
    poolQuery: vi.fn(),
    ensureImageEvidenceSchema: vi.fn(),
    bucket: vi.fn(),
    file: vi.fn(),
    save: vi.fn(),
    makePublic: vi.fn(),
    deleteObject: vi.fn(),
    table: {
      id: "businesses.id",
      photos: "businesses.photos",
      pendingPhotos: "businesses.pendingPhotos",
      imageUrl: "businesses.imageUrl",
      updatedAt: "businesses.updatedAt",
    },
  };
});

vi.mock("express", () => ({
  Router: () =>
    Object.fromEntries(
      ["get", "post", "put", "patch", "delete", "use"].map((method) => [
        method,
        (path: string, ...handlers: Handler[]) => {
          if (["post", "patch", "delete"].includes(method))
            mocks.handlers.set(`${method} ${path}`, handlers.at(-1)!);
        },
      ]),
    ),
}));
vi.mock("multer", () => ({
  default: Object.assign(
    () => ({ single: () => mocks.unexpected, array: () => mocks.unexpected }),
    {
      memoryStorage: () => ({}),
    },
  ),
}));
vi.mock("@workspace/db", () => ({
  db: { select: mocks.select, update: mocks.update, insert: mocks.unexpected },
  pool: { query: mocks.poolQuery },
  businessesTable: mocks.table,
  businessIdentityTable: {},
  businessProfileViewsTable: {},
  userSettingsTable: {},
  usersTable: {},
  docusignEnvelopesTable: {},
  businessPromotionsTable: {},
  businessSearchInquiriesTable: {},
  userPreferencesTable: {},
  businessClickEventsTable: {},
  businessCaptionsTable: {},
  contentReportsTable: {},
  referenceLinkClicksTable: {},
  BUSINESS_CATEGORY_TAXONOMY: [],
  ALL_VALID_CATEGORY_NAMES: [],
}));
vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
  and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
  or: mocks.unexpected,
  ilike: mocks.unexpected,
  desc: mocks.unexpected,
  asc: mocks.unexpected,
  gt: mocks.unexpected,
  count: mocks.unexpected,
  inArray: mocks.unexpected,
  ne: mocks.unexpected,
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    kind: "sql",
    text: strings.join("?").replace(/\s+/g, " ").trim(),
    values,
  }),
}));
vi.mock("../../lib/db-retry", () => ({ withDbRetry: mocks.unexpected }));
vi.mock("../../lib/pushNotifications", () => ({
  sendAddressUpdateNotifications: mocks.unexpected,
}));
vi.mock("../../lib/docusign", () => ({
  createFoundingAgreementEnvelope: mocks.unexpected,
}));
vi.mock("../../lib/email", () => ({
  sendFoundingWelcomeEmail: mocks.unexpected,
  sendSearchInquiryAlert: mocks.unexpected,
}));
vi.mock("../../lib/objectStorage", () => ({
  objectStorageClient: { bucket: mocks.bucket },
}));
vi.mock("../../middleware/rateLimiter", () => ({
  reportLimiter: mocks.unexpected,
}));
vi.mock("../../middlewares/requireAuth", () => ({
  requireApprovedMember: mocks.unexpected,
  requireAuth: mocks.unexpected,
}));
vi.mock("../../lib/dynamicResponseCache", () => ({
  sendDynamicJson: mocks.unexpected,
}));
vi.mock("../../businesses/publicBusinessDiscoveryPolicy", () => ({
  isPublicBusinessDiscoveryRead: mocks.unexpected,
}));
vi.mock("../../businesses/canonicalBusiness", () => ({
  resolveCanonicalBusinessId: mocks.unexpected,
}));
vi.mock("../../businesses/publicListingCopy", () => ({
  sanitizePublicListingCopy: mocks.unexpected,
}));
vi.mock("../../businesses/mapCoordinateIntegrity", () => ({
  hasTrustworthyMapCoordinate: mocks.unexpected,
  MAP_LOCATION_HOLD_REASON: "mock",
}));
vi.mock("../../businesses/mapPinViewport", () => ({
  decodeMapPinCursor: mocks.unexpected,
  encodeMapPinCursor: mocks.unexpected,
  MapPinViewportInputError: class extends Error {},
  mapPinViewportFromQuery: mocks.unexpected,
  mapPinViewportScope: mocks.unexpected,
}));
vi.mock("../../businesses/mwmCoreDiscoveryPolicy", () => ({
  mwmDiasporaPromotionSqlPredicate: mocks.unexpected,
  mwmPublicDirectorySqlPredicate: mocks.unexpected,
}));
vi.mock("../../businesses/documentedDiscoveryEligibility", () => ({
  documentedDiscoveryEligibilitySqlPredicate: mocks.unexpected,
}));
vi.mock("../../businesses/businessDuplicateIdentity", () => ({
  highConfidenceBusinessDuplicateReasons: mocks.unexpected,
  normalizeBusinessPhone: mocks.unexpected,
  normalizeOfficialSocialProfileForPlatform: mocks.unexpected,
  normalizeOfficialWebsiteDomain: mocks.unexpected,
}));
vi.mock("../../businesses/adminBusinessProfilePolicy", () => ({
  adminProfileUpdateSqlBinding: mocks.unexpected,
  directAdminCreationUnsafeFields: mocks.unexpected,
  normalizeBusinessIdentityPart: mocks.unexpected,
  validateAdminBusinessProfilePatch: mocks.unexpected,
}));
vi.mock("../../businesses/businessImageEligibility", () => ({
  BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION: "mock",
  attachEligibleBusinessImages: mocks.unexpected,
  ensureBusinessImageEvidenceSchema: mocks.ensureImageEvidenceSchema,
}));
vi.mock("../../businessIntake/types", () => ({
  validateSubmission: mocks.unexpected,
}));
vi.mock("../../businessIntake/submissionRepository", () => ({
  SubmissionRepository: class {},
}));
vi.mock("../../lib/adminAuth", () => ({ isAdmin: mocks.unexpected }));
vi.mock("@workspace/constants", () => ({
  detectSocialVideoPlatform: mocks.unexpected,
  ownershipDesignationFilterId: mocks.unexpected,
  ownershipDesignationStorageValues: mocks.unexpected,
  normalizeOwnershipDesignationFilterIds: mocks.unexpected,
  findBusinessExperienceKeysForSearch: mocks.unexpected,
  findVibeKeysForSearch: mocks.unexpected,
  findSafeSearchClarification: mocks.unexpected,
  normalizeOwnerExperienceKey: mocks.unexpected,
  VIBES_BY_CATEGORY: {},
}));
vi.mock("../../kinfolk/designation-predicate-policy", () => ({
  buildDesignationPredicateSql: mocks.unexpected,
  legacyDesignationColumn: mocks.unexpected,
  resolveDesignationScope: mocks.unexpected,
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

function invoke(
  options: { user?: { id?: string } | null; url?: unknown } = {},
) {
  const req = {
    user: "user" in options ? options.user : { id: ownerId },
    body: { url: "url" in options ? options.url : ownPhoto },
    log: { error: vi.fn() },
  } as unknown as Request;
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockImplementation((status: number) => {
    response.statusCode = status;
    return response;
  });
  response.json.mockImplementation((body: unknown) => {
    response.body = body;
    return response;
  });
  const handler = mocks.handlers.get("delete /businesses/mine/photos");
  expect(handler).toBeTypeOf("function");
  return Promise.resolve(handler!(req, response as unknown as Response)).then(
    () => ({ req, response }),
  );
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
  selectedBusiness = {
    id: businessId,
    photos: [ownPhoto, keepPhoto],
    pendingPhotos: [],
    imageUrl: ownPhoto,
  };
  writes = [];
  sideEffects = [];
  mocks.select.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ where: mocks.selectWhere });
  mocks.selectWhere.mockImplementation(async () => [
    structuredClone(selectedBusiness),
  ]);
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
  mocks.file.mockReturnValue({
    save: mocks.save,
    makePublic: mocks.makePublic,
    delete: mocks.deleteObject,
  });
  mocks.save.mockImplementation(async () => {
    sideEffects.push("storage-save");
  });
  mocks.makePublic.mockImplementation(async () => {
    sideEffects.push("storage-public");
  });
  mocks.deleteObject.mockImplementation(async () => {
    sideEffects.push("storage-delete");
  });
  mocks.ensureImageEvidenceSchema.mockResolvedValue(undefined);
  mocks.poolQuery.mockImplementation(async () => {
    sideEffects.push("receipt-write");
    return { rows: [] };
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
    [
      "an unlisted storage-looking URL",
      `https://storage.googleapis.com/${bucketId}/business-photos/${businessId}/unlisted.jpg`,
    ],
  ])(
    "rejects %s before object-key derivation, storage delete, or row mutation",
    async (_label, url) => {
      const { response } = await invoke({ url });

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({ error: "Photo not found" });
      expect(mocks.select).toHaveBeenCalledTimes(1);
      expectNoDeleteMutation();
    },
  );

  it("preserves authorized own-photo removal and its existing response shape", async () => {
    const { response } = await invoke({ url: ownPhoto });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ photos: [keepPhoto], imageUrl: keepPhoto });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      photos: [keepPhoto],
      imageUrl: keepPhoto,
    });
    expect(mocks.bucket).toHaveBeenCalledExactlyOnceWith(bucketId);
    expect(mocks.file).toHaveBeenCalledExactlyOnceWith(
      `business-photos/${businessId}/owned.jpg`,
    );
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
    const source = readFileSync(
      new URL("../businesses.ts", import.meta.url),
      "utf8",
    );
    const start = source.indexOf('router.delete("/businesses/mine/photos"');
    const end = source.indexOf(
      '\nrouter.patch(\n  "/businesses/mine/photos/cover"',
      start,
    );
    const handler = source.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(handler).toContain(".where(approvedOwnerPredicate(String(userId)))");
    expect(handler).toContain(
      "const currentPhotos = Array.isArray(business.photos) ? business.photos : [];",
    );
    expect(handler).toContain("if (!currentPhotos.includes(url)) {");
    expect(handler).toContain(
      'res.status(400).json({ error: "Photo not found" });',
    );
    expect(handler.indexOf("if (!currentPhotos.includes(url))")).toBeLessThan(
      handler.indexOf(
        "const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;",
      ),
    );
    expect(handler.indexOf("if (!currentPhotos.includes(url))")).toBeLessThan(
      handler.indexOf("await db\n      .update(businessesTable)"),
    );
    expect(
      handler.indexOf("await db\n      .update(businessesTable)"),
    ).toBeLessThan(
      handler.indexOf(
        "const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;",
      ),
    );
  });
});

const selectedBusinessId = "business-b";
const selectedOwnPhoto = `https://storage.googleapis.com/${bucketId}/business-photos/${selectedBusinessId}/owned.jpg`;
const selectedKeepPhoto = `https://storage.googleapis.com/${bucketId}/business-photos/${selectedBusinessId}/keep.jpg`;

type SelectedOperation = "upload" | "delete" | "cover";

function selectedRouteFor(operation: SelectedOperation) {
  switch (operation) {
    case "upload":
      return "post /businesses/mine/managed/:businessId/photos";
    case "delete":
      return "delete /businesses/mine/managed/:businessId/photos";
    case "cover":
      return "patch /businesses/mine/managed/:businessId/photos/cover";
  }
}

async function invokeSelectedPhoto(
  operation: SelectedOperation,
  options: {
    businessId?: string;
    user?: { id?: string } | null;
    url?: string;
    file?: Record<string, unknown> | null;
  } = {},
) {
  const handler = mocks.handlers.get(selectedRouteFor(operation));
  expect(handler).toBeTypeOf("function");
  const req = {
    user: "user" in options ? options.user : { id: ownerId },
    params: { businessId: options.businessId ?? selectedBusinessId },
    body: { url: options.url ?? selectedOwnPhoto },
    file:
      operation === "upload"
        ? options.file === null
          ? undefined
          : (options.file ?? {
              originalname: "photo.jpg",
              mimetype: "image/jpeg",
              buffer: Buffer.from("photo"),
            })
        : undefined,
    log: { error: vi.fn() },
  } as unknown as Request;
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockImplementation((status: number) => {
    response.statusCode = status;
    return response;
  });
  response.json.mockImplementation((body: unknown) => {
    response.body = body;
    return response;
  });
  await handler!(req, response as unknown as Response);
  return { req, response };
}

function selectOnlySelectedBusiness() {
  selectedBusiness = {
    id: selectedBusinessId,
    photos: [selectedOwnPhoto, selectedKeepPhoto],
    pendingPhotos: [],
    imageUrl: selectedOwnPhoto,
  };
  mocks.selectWhere.mockImplementation(async () => [
    structuredClone(selectedBusiness),
  ]);
}

function expectNoSelectedPersistentEffect() {
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.bucket).not.toHaveBeenCalled();
  expect(mocks.file).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.makePublic).not.toHaveBeenCalled();
  expect(mocks.deleteObject).not.toHaveBeenCalled();
  expect(mocks.poolQuery).not.toHaveBeenCalled();
  expect(writes).toEqual([]);
  expect(sideEffects).toEqual([]);
}

describe("managed selected-business photo gallery isolation", () => {
  beforeEach(() => {
    selectOnlySelectedBusiness();
  });

  it("registers narrowly selected photo upload, cover, and delete routes", () => {
    expect(
      mocks.handlers.get("post /businesses/mine/managed/:businessId/photos"),
    ).toBeTypeOf("function");
    expect(
      mocks.handlers.get(
        "patch /businesses/mine/managed/:businessId/photos/cover",
      ),
    ).toBeTypeOf("function");
    expect(
      mocks.handlers.get("delete /businesses/mine/managed/:businessId/photos"),
    ).toBeTypeOf("function");
  });

  it.each<SelectedOperation>(["upload", "cover", "delete"])(
    "rejects anonymous selected photo %s before owner lookup or persistent effects",
    async (operation) => {
      const { response } = await invokeSelectedPhoto(operation, { user: null });

      expect(response.statusCode).toBe(401);
      expect(response.body).toEqual({ error: "Unauthorized" });
      expect(mocks.select).not.toHaveBeenCalled();
      expectNoSelectedPersistentEffect();
    },
  );

  it("uploads only the explicitly selected Business B, preserving pending review and the ten-photo contract", async () => {
    const { response } = await invokeSelectedPhoto("upload");

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      pending: true,
      photos: [selectedOwnPhoto, selectedKeepPhoto],
      imageUrl: selectedOwnPhoto,
    });
    expect(writes).toHaveLength(1);
    expect(writes[0]?.pendingPhotos).toHaveLength(1);
    expect(JSON.stringify(mocks.selectWhere.mock.calls[0]?.[0])).toContain(
      selectedBusinessId,
    );
    expect(mocks.file.mock.calls[0]?.[0]).toContain(
      `business-photos-pending/${selectedBusinessId}/`,
    );
    expect(sideEffects).toEqual([
      "storage-save",
      "storage-public",
      "db-update",
      "receipt-write",
    ]);
  });

  it("does not run storage, evidence, or row mutations for cross-owner, revoked, or missing selected authorization", async () => {
    mocks.selectWhere.mockResolvedValueOnce([]);
    const crossOwner = await invokeSelectedPhoto("upload", {
      businessId: businessId,
    });
    expect(crossOwner.response.statusCode).toBe(404);
    expect(crossOwner.response.body).toEqual({
      error: "Managed business not found.",
    });
    expectNoSelectedPersistentEffect();

    vi.clearAllMocks();
    writes = [];
    sideEffects = [];
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.selectWhere });
    mocks.selectWhere.mockResolvedValueOnce([]);
    const revoked = await invokeSelectedPhoto("delete");
    expect(revoked.response.statusCode).toBe(404);
    expect(revoked.response.body).toEqual({
      error: "Managed business not found.",
    });
    expectNoSelectedPersistentEffect();

    const missing = await invokeSelectedPhoto("cover", { businessId: "" });
    expect(missing.response.statusCode).toBe(404);
    expect(missing.response.body).toEqual({
      error: "Managed business not found.",
    });
    expectNoSelectedPersistentEffect();
  });

  it("enforces gallery membership for selected cover and delete before mutation or object cleanup", async () => {
    const cover = await invokeSelectedPhoto("cover", { url: foreignPhoto });
    expect(cover.response.statusCode).toBe(400);
    expect(cover.response.body).toEqual({
      error: "Photo not found in your gallery",
    });
    expectNoSelectedPersistentEffect();

    vi.clearAllMocks();
    writes = [];
    sideEffects = [];
    selectOnlySelectedBusiness();
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.selectWhere });
    const deletion = await invokeSelectedPhoto("delete", { url: foreignPhoto });
    expect(deletion.response.statusCode).toBe(400);
    expect(deletion.response.body).toEqual({ error: "Photo not found" });
    expectNoSelectedPersistentEffect();
  });

  it("retains the selected upload cap before storage or database mutation", async () => {
    selectedBusiness = {
      id: selectedBusinessId,
      photos: Array.from(
        { length: 9 },
        (_, index) => `https://example.test/photo-${index}.jpg`,
      ),
      pendingPhotos: ["https://example.test/pending.jpg"],
      imageUrl: null,
    };

    const { response } = await invokeSelectedPhoto("upload");

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: "Maximum of 10 photos allowed (including those pending review)",
    });
    expectNoSelectedPersistentEffect();
  });

  it("updates only selected Business B cover and never touches storage", async () => {
    const { response } = await invokeSelectedPhoto("cover", {
      url: selectedKeepPhoto,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ imageUrl: selectedKeepPhoto });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ imageUrl: selectedKeepPhoto });
    expect(mocks.bucket).not.toHaveBeenCalled();
    expect(mocks.poolQuery).not.toHaveBeenCalled();
    expect(sideEffects).toEqual(["db-update"]);
  });

  it("persists selected Business B deletion before best-effort cleanup and preserves cover fallback", async () => {
    const { response } = await invokeSelectedPhoto("delete");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      photos: [selectedKeepPhoto],
      imageUrl: selectedKeepPhoto,
    });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      photos: [selectedKeepPhoto],
      imageUrl: selectedKeepPhoto,
    });
    expect(mocks.file).toHaveBeenCalledWith(
      `business-photos/${selectedBusinessId}/owned.jpg`,
    );
    expect(sideEffects).toEqual(["db-update", "storage-delete"]);
  });

  it("does not clean up an object when selected deletion persistence fails", async () => {
    mocks.update.mockImplementationOnce(() => {
      sideEffects.push("db-update");
      throw new Error("database unavailable");
    });

    const { response } = await invokeSelectedPhoto("delete");

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: "Failed to delete photo" });
    expect(mocks.bucket).not.toHaveBeenCalled();
    expect(mocks.deleteObject).not.toHaveBeenCalled();
    expect(sideEffects).toEqual(["db-update"]);
  });

  it("keeps the legacy photo routes present while selected routes bind the explicit id and owner predicate", () => {
    const source = readFileSync(
      new URL("../businesses.ts", import.meta.url),
      "utf8",
    );
    const selectedStart = source.indexOf(
      'router.post(\n  "/businesses/mine/managed/:businessId/photos"',
    );
    const selectedEnd = source.indexOf(
      '\nrouter.post(\n  "/businesses/mine/videos"',
      selectedStart,
    );
    const selected = source.slice(selectedStart, selectedEnd);

    expect(source).toContain('router.post(\n  "/businesses/mine/photos"');
    expect(source).toContain('router.delete("/businesses/mine/photos"');
    expect(source).toContain('"/businesses/mine/photos/cover"');
    expect(selectedStart).toBeGreaterThanOrEqual(0);
    expect(selectedEnd).toBeGreaterThan(selectedStart);
    expect(selected).toContain("eq(businessesTable.id, businessId)");
    expect(selected).toContain("approvedOwnerPredicate(String(userId))");
    expect(selected).toContain(
      "currentPhotos.length + currentPending.length >= 10",
    );
    expect(selected).toContain("if (!currentPhotos.includes(url))");
    expect(selected.indexOf("if (!currentPhotos.includes(url))")).toBeLessThan(
      selected.lastIndexOf(
        "const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;",
      ),
    );
  });
});

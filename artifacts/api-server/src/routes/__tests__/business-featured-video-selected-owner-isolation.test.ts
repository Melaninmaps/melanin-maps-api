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
  featuredVideoUrl: string | null;
};
type Write = {
  updates: Record<string, unknown>;
  condition: unknown;
};

const mocks = vi.hoisted(() => {
  const unexpected = vi.fn(() => {
    throw new Error("Unexpected boundary invocation");
  });
  const handlers = new Map<string, Handler>();
  return {
    handlers,
    unexpected,
    select: vi.fn(),
    from: vi.fn(),
    selectWhere: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    updateWhere: vi.fn(),
    returning: vi.fn(),
    bucket: vi.fn(),
    file: vi.fn(),
    save: vi.fn(),
    deleteObject: vi.fn(),
    table: {
      id: "businesses.id",
      name: "businesses.name",
      featuredVideoUrl: "businesses.featured_video_url",
      updatedAt: "businesses.updated_at",
    },
  };
});

vi.mock("express", () => ({
  Router: () =>
    Object.fromEntries(
      ["get", "post", "put", "patch", "delete", "use"].map((method) => [
        method,
        (path: unknown, ...handlers: Handler[]) => {
          if (typeof path === "string") {
            mocks.handlers.set(`${method} ${path}`, handlers.at(-1)!);
          }
        },
      ]),
    ),
}));
vi.mock("multer", () => ({
  default: Object.assign(
    () => ({
      single: () => (_req: Request, _res: Response, next: () => void) => next(),
      array: () => (_req: Request, _res: Response, next: () => void) => next(),
    }),
    { memoryStorage: () => ({}) },
  ),
}));
vi.mock("@workspace/db", () => ({
  db: {
    select: mocks.select,
    update: mocks.update,
    insert: mocks.unexpected,
    delete: mocks.unexpected,
  },
  pool: { query: mocks.unexpected, connect: mocks.unexpected },
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
vi.mock("drizzle-orm", () => {
  const sql = Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      kind: "sql",
      text: strings.join("?").replace(/\s+/g, " ").trim(),
      values,
    }),
    { raw: (value: string) => value, join: mocks.unexpected },
  );
  return {
    eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
    and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
    or: mocks.unexpected,
    ilike: mocks.unexpected,
    desc: mocks.unexpected,
    asc: (column: string) => ({ kind: "asc", column }),
    sql,
    gt: mocks.unexpected,
    count: mocks.unexpected,
    inArray: mocks.unexpected,
    ne: mocks.unexpected,
  };
});
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
  ensureBusinessImageEvidenceSchema: mocks.unexpected,
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

const ownerId = "owner-a";
const businessA: Business = {
  id: "business-a",
  featuredVideoUrl:
    "https://storage.googleapis.com/featured-video-test/businesses/business-a/featured-video.mp4",
};
const businessB: Business = {
  id: "business-b",
  featuredVideoUrl:
    "https://storage.googleapis.com/featured-video-test/businesses/business-b/featured-video.mp4",
};

type Operation =
  | "legacy-upload"
  | "legacy-delete"
  | "selected-upload"
  | "selected-delete";

let selectedRows: Business[];
let writes: Write[];
let objectKeys: string[];
let databaseFailure = false;
let storageSaveFailure = false;
let storageDeleteFailure = false;

function routeFor(operation: Operation) {
  switch (operation) {
    case "legacy-upload":
      return "post /businesses/mine/featured-video/upload";
    case "legacy-delete":
      return "delete /businesses/mine/featured-video/hosted";
    case "selected-upload":
      return "post /businesses/mine/managed/:businessId/featured-video/upload";
    case "selected-delete":
      return "delete /businesses/mine/managed/:businessId/featured-video/hosted";
  }
}

async function invoke(
  operation: Operation,
  options: {
    user?: { id?: string } | null;
    businessId?: string;
    file?: Record<string, unknown> | null;
  } = {},
) {
  const handler = mocks.handlers.get(routeFor(operation));
  expect(handler).toBeTypeOf("function");
  const isUpload = operation.endsWith("upload");
  const req = {
    user: "user" in options ? options.user : { id: ownerId },
    params: { businessId: options.businessId ?? businessB.id },
    file: isUpload
      ? options.file === null
        ? undefined
        : (options.file ?? {
            originalname: "featured.mp4",
            mimetype: "video/mp4",
            buffer: Buffer.from("test"),
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

function expectNoStorageOrWrite() {
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.bucket).not.toHaveBeenCalled();
  expect(mocks.file).not.toHaveBeenCalled();
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.deleteObject).not.toHaveBeenCalled();
  expect(writes).toEqual([]);
  expect(objectKeys).toEqual([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DEFAULT_OBJECT_STORAGE_BUCKET_ID", "featured-video-test");
  selectedRows = [structuredClone(businessB)];
  writes = [];
  objectKeys = [];
  databaseFailure = false;
  storageSaveFailure = false;
  storageDeleteFailure = false;

  mocks.select.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ where: mocks.selectWhere });
  mocks.selectWhere.mockReturnValue({
    orderBy: mocks.orderBy,
    limit: mocks.limit,
  });
  mocks.orderBy.mockReturnValue({ limit: mocks.limit });
  mocks.limit.mockImplementation(async (limit: number) =>
    selectedRows.slice(0, limit).map((business) => structuredClone(business)),
  );

  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.set.mockImplementation((updates: Record<string, unknown>) => ({
    where: mocks.updateWhere.mockImplementation((condition: unknown) => {
      writes.push({ updates: structuredClone(updates), condition });
      if (databaseFailure) throw new Error("database unavailable");
      return { returning: mocks.returning };
    }),
  }));
  mocks.returning.mockImplementation(async () => [
    { featuredVideoUrl: writes.at(-1)?.updates.featuredVideoUrl ?? null },
  ]);

  mocks.bucket.mockReturnValue({ file: mocks.file });
  mocks.file.mockImplementation((objectKey: string) => {
    objectKeys.push(objectKey);
    return { save: mocks.save, delete: mocks.deleteObject };
  });
  mocks.save.mockImplementation(async () => {
    if (storageSaveFailure) throw new Error("storage unavailable");
  });
  mocks.deleteObject.mockImplementation(async () => {
    if (storageDeleteFailure) throw new Error("storage unavailable");
  });
});

afterEach(() => {
  expect(mocks.unexpected).not.toHaveBeenCalled();
});
afterAll(() => vi.unstubAllEnvs());

describe("hosted featured-video selected-owner isolation", () => {
  it("retains anonymous pre-side-effect rejection for selected hosted upload and delete", async () => {
    const upload = await invoke("selected-upload", { user: null });
    const deletion = await invoke("selected-delete", { user: null });

    expect(upload.response.statusCode).toBe(401);
    expect(upload.response.body).toEqual({ error: "Unauthorized" });
    expect(deletion.response.statusCode).toBe(401);
    expect(deletion.response.body).toEqual({ error: "Unauthorized" });
    expect(mocks.select).not.toHaveBeenCalled();
    expectNoStorageOrWrite();
  });

  it("uploads only explicitly selected approved Business B and writes only its object and row", async () => {
    selectedRows = [structuredClone(businessB)];

    const { response } = await invoke("selected-upload", {
      businessId: businessB.id,
    });

    const expectedUrl =
      "https://storage.googleapis.com/featured-video-test/businesses/business-b/featured-video.mp4";
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ featuredVideoUrl: expectedUrl });
    expect(objectKeys).toEqual(["businesses/business-b/featured-video.mp4"]);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.updates).toMatchObject({ featuredVideoUrl: expectedUrl });
    expect(JSON.stringify(writes[0]?.condition)).toContain(businessB.id);
    expect(JSON.stringify(writes[0]?.condition)).not.toContain(businessA.id);
  });

  it("deletes only explicitly selected approved Business B hosted media and row", async () => {
    selectedRows = [structuredClone(businessB)];

    const { response } = await invoke("selected-delete", {
      businessId: businessB.id,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(objectKeys).toEqual(["businesses/business-b/featured-video.mp4"]);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.updates).toMatchObject({ featuredVideoUrl: null });
    expect(JSON.stringify(writes[0]?.condition)).toContain(businessB.id);
    expect(JSON.stringify(writes[0]?.condition)).not.toContain(businessA.id);
    expect(mocks.updateWhere.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteObject.mock.invocationCallOrder[0]!,
    );
  });

  it("returns a neutral selected-resource denial for cross-business and missing selection before side effects", async () => {
    selectedRows = [];
    const crossBusiness = await invoke("selected-upload", {
      businessId: businessA.id,
    });
    expect(crossBusiness.response.statusCode).toBe(404);
    expect(crossBusiness.response.body).toEqual({
      error: "Managed business not found.",
    });
    expectNoStorageOrWrite();

    const missingSelection = await invoke("selected-delete", {
      businessId: "",
    });
    expect(missingSelection.response.statusCode).toBe(404);
    expect(missingSelection.response.body).toEqual({
      error: "Managed business not found.",
    });
    expectNoStorageOrWrite();
  });

  it("returns BUSINESS_SELECTION_REQUIRED for legacy multi-business hosted upload and delete before side effects", async () => {
    selectedRows = [structuredClone(businessA), structuredClone(businessB)];

    const upload = await invoke("legacy-upload");
    const deletion = await invoke("legacy-delete");

    for (const result of [upload, deletion]) {
      expect(result.response.statusCode).toBe(409);
      expect(result.response.body).toEqual({
        error: "Select a business before managing its featured video.",
        code: "BUSINESS_SELECTION_REQUIRED",
      });
    }
    expectNoStorageOrWrite();
  });

  it("retains successful legacy single-business hosted upload and delete behavior", async () => {
    selectedRows = [structuredClone(businessA)];

    const upload = await invoke("legacy-upload");
    const deletion = await invoke("legacy-delete");

    expect(upload.response.statusCode).toBe(200);
    expect(upload.response.body).toEqual({
      featuredVideoUrl:
        "https://storage.googleapis.com/featured-video-test/businesses/business-a/featured-video.mp4",
    });
    expect(deletion.response.statusCode).toBe(200);
    expect(deletion.response.body).toEqual({ ok: true });
    expect(objectKeys).toEqual([
      "businesses/business-a/featured-video.mp4",
      "businesses/business-a/featured-video.mp4",
    ]);
    expect(writes).toHaveLength(2);
  });

  it("contains storage and database failures without a success response or unintended later write", async () => {
    storageSaveFailure = true;
    const storageFailure = await invoke("selected-upload", {
      businessId: businessB.id,
    });

    expect(storageFailure.response.statusCode).toBe(500);
    expect(storageFailure.response.body).toEqual({
      error: "Failed to upload featured video",
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(objectKeys).toEqual(["businesses/business-b/featured-video.mp4"]);

    vi.clearAllMocks();
    writes = [];
    objectKeys = [];
    selectedRows = [structuredClone(businessB)];
    databaseFailure = true;
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.from.mockReturnValue({ where: mocks.selectWhere });
    mocks.selectWhere.mockReturnValue({
      orderBy: mocks.orderBy,
      limit: mocks.limit,
    });
    mocks.orderBy.mockReturnValue({ limit: mocks.limit });
    mocks.limit.mockImplementation(async (limit: number) =>
      selectedRows.slice(0, limit),
    );
    mocks.update.mockReturnValue({ set: mocks.set });
    mocks.set.mockImplementation((updates: Record<string, unknown>) => ({
      where: mocks.updateWhere.mockImplementation((condition: unknown) => {
        writes.push({ updates: structuredClone(updates), condition });
        throw new Error("database unavailable");
      }),
    }));
    mocks.bucket.mockReturnValue({ file: mocks.file });
    mocks.file.mockImplementation((objectKey: string) => {
      objectKeys.push(objectKey);
      return { save: mocks.save, delete: mocks.deleteObject };
    });
    mocks.save.mockResolvedValue(undefined);

    const databaseFailureResult = await invoke("selected-upload", {
      businessId: businessB.id,
    });
    expect(databaseFailureResult.response.statusCode).toBe(500);
    expect(databaseFailureResult.response.body).toEqual({
      error: "Failed to upload featured video",
    });
    expect(writes).toHaveLength(1);
    expect(objectKeys).toEqual(["businesses/business-b/featured-video.mp4"]);
  });

  it("retains best-effort hosted object cleanup when selected deletion persistence succeeds", async () => {
    storageDeleteFailure = true;

    const { response } = await invoke("selected-delete", {
      businessId: businessB.id,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(writes).toHaveLength(1);
    expect(objectKeys).toEqual(["businesses/business-b/featured-video.mp4"]);
    expect(mocks.deleteObject).toHaveBeenCalledTimes(1);
  });

  it("does not remove selected hosted media when its authorized row update fails", async () => {
    databaseFailure = true;

    const { response } = await invoke("selected-delete", {
      businessId: businessB.id,
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: "Failed to delete hosted featured video",
    });
    expect(writes).toHaveLength(1);
    expect(objectKeys).toEqual([]);
    expect(mocks.deleteObject).not.toHaveBeenCalled();
  });
});

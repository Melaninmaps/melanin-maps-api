import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  transaction: vi.fn(),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ text: strings.join("?"), values })),
  logInfo: vi.fn(),
  businessesTable: {
    id: "businesses.id",
    category: "businesses.category",
    subcategory: "businesses.subcategory",
    ownershipDesignations: "businesses.ownershipDesignations",
    vibes: "businesses.vibes",
  },
  identityTable: { id: "business_identity.id", businessId: "business_identity.businessId" },
}));

vi.mock("@workspace/db", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    transaction: mocks.transaction,
  },
  businessesTable: mocks.businessesTable,
  businessIdentityTable: mocks.identityTable,
}));

vi.mock("@workspace/constants", () => ({
  OWNERSHIP_DESIGNATIONS: [],
  getBusinessExperiencePolicy: vi.fn(() => ({ vibeChoices: [] })),
  isBlackOwned: vi.fn(() => false),
  normalizeOwnerExperienceKey: vi.fn((value: string) => value),
}));

vi.mock("drizzle-orm", () => ({
  and: mocks.and,
  eq: mocks.eq,
  sql: mocks.sql,
}));

import businessIdentityRouter from "../business-identity";

type RouteHandler = (request: RouteRequest, response: ReturnType<typeof responseMock>) => Promise<void>;
type RouteRequest = {
  user?: { id: string };
  params: { businessId?: string };
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  log: { info: ReturnType<typeof vi.fn> };
};

type QueryRow = Record<string, unknown>;

function routeHandler(method: "get" | "patch", path: string): RouteHandler {
  const layer = (businessIdentityRouter as unknown as {
    stack: Array<{ route?: { path?: string; methods?: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> } }>;
  }).stack.find((candidate) => candidate.route?.path === path && candidate.route.methods?.[method]);
  const handler = layer?.route?.stack[0]?.handle;
  if (!handler) throw new Error(`Missing ${method.toUpperCase()} ${path}`);
  return handler;
}

function responseMock() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

function request(overrides: Partial<RouteRequest> = {}): RouteRequest {
  return {
    user: { id: "owner-1" },
    params: { businessId: "business-b" },
    query: {},
    body: {},
    log: { info: mocks.logInfo },
    ...overrides,
  };
}

function rowsQuery(rows: QueryRow[]) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  };
}

function selectedBusiness(id = "business-b") {
  return {
    id,
    category: "Food",
    subcategory: null,
    ownershipDesignations: [],
    vibes: [],
  };
}

function existingIdentity() {
  return {
    id: "identity-1",
    businessId: "business-b",
    ownershipBadges: [],
    vibes: [],
  };
}

function selectedOwnerSql() {
  const predicate = mocks.sql.mock.results[0]?.value as { text?: string; values?: unknown[] } | undefined;
  expect(predicate?.text).toContain("FROM business_owner_links bol");
  expect(predicate?.text).toContain("bol.role = 'owner'");
  expect(predicate?.text).toContain("bol.status = 'approved'");
  expect(predicate?.text).toContain("bol.revoked_at IS NULL");
  expect(predicate?.values).toContain("owner-1");
}

describe("selected managed-business Identity route isolation", () => {
  const selectedGet = routeHandler("get", "/businesses/mine/managed/:businessId/identity");
  const selectedPatch = routeHandler("patch", "/businesses/mine/managed/:businessId/identity");
  const legacyGet = routeHandler("get", "/businesses/mine/identity");

  beforeEach(() => {
    mocks.select.mockReset();
    mocks.insert.mockReset();
    mocks.transaction.mockReset();
    mocks.and.mockClear();
    mocks.eq.mockClear();
    mocks.sql.mockClear();
    mocks.logInfo.mockClear();
  });

  it("returns 401 before any selected-business lookup for an anonymous request", async () => {
    const response = responseMock();

    await selectedGet(request({ user: undefined }), response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it.each(["outsider", "revoked owner", "former owner", "zero managed businesses"])(
    "returns no selected Identity data for a %s",
    async () => {
      mocks.select.mockReturnValueOnce(rowsQuery([]));
      const response = responseMock();

      await selectedGet(request(), response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({ error: "No business found for this account" });
      expect(mocks.select).toHaveBeenCalledTimes(1);
      expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.id, "business-b");
      selectedOwnerSql();
    },
  );

  it("binds a selected request to its exact managed business even when the owner manages multiple businesses", async () => {
    mocks.select
      .mockReturnValueOnce(rowsQuery([selectedBusiness("business-b")]))
      .mockReturnValueOnce(rowsQuery([existingIdentity()]));
    const response = responseMock();

    await selectedGet(request(), response);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      business: { id: "business-b", category: "Food", subcategory: null },
    }));
    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.id, "business-b");
    selectedOwnerSql();
  });

  it("rejects an invalid selected route parameter before querying or falling back to legacy ownership", async () => {
    const response = responseMock();

    await selectedGet(request({ params: { businessId: "   " } }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: "A business selection is required." });
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("preserves the legacy no-selected GET behavior", async () => {
    mocks.select
      .mockReturnValueOnce(rowsQuery([selectedBusiness("legacy-business")]))
      .mockReturnValueOnce(rowsQuery([{ ...existingIdentity(), businessId: "legacy-business" }]));
    const response = responseMock();

    await legacyGet(request({ params: {}, query: {} }), response);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      business: { id: "legacy-business", category: "Food", subcategory: null },
    }));
    expect(mocks.eq).not.toHaveBeenCalledWith(mocks.businessesTable.id, expect.anything());
    selectedOwnerSql();
  });

  it("updates only the exact selected business after current-owner authorization", async () => {
    mocks.select
      .mockReturnValueOnce(rowsQuery([selectedBusiness()]))
      .mockReturnValueOnce(rowsQuery([{ id: "identity-1" }]));
    const saved = { ...existingIdentity(), businessStory: "Our community story" };
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      update: () => ({ set: () => ({ where: () => ({ returning: async () => [saved] }) }) }),
      insert: () => ({ values: () => ({ returning: async () => [saved] }) }),
    }));
    const response = responseMock();

    await selectedPatch(request({ body: { businessStory: "Our community story" } }), response);

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ identity: saved });
    expect(mocks.eq).toHaveBeenCalledWith(mocks.businessesTable.id, "business-b");
    expect(mocks.eq).toHaveBeenCalledWith(mocks.identityTable.businessId, "business-b");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    selectedOwnerSql();
  });

  it("denies an unauthorized selected PATCH before any identity mutation", async () => {
    mocks.select.mockReturnValueOnce(rowsQuery([]));
    const response = responseMock();

    await selectedPatch(request(), response);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(mocks.transaction).not.toHaveBeenCalled();
    selectedOwnerSql();
  });
});

import { beforeAll, describe, expect, it, vi } from "vitest";

type RegisteredRoute = {
  method: "get" | "post" | "patch";
  path: string;
  handlers: Array<(req: any, res: any, next?: () => Promise<void>) => unknown>;
};

const mocked = vi.hoisted(() => {
  const routes: RegisteredRoute[] = [];
  const emptyChain: any = {
    from: () => emptyChain,
    where: () => emptyChain,
    limit: () => [],
    orderBy: () => emptyChain,
    groupBy: () => emptyChain,
  };
  const select = vi.fn(() => emptyChain);
  const update = vi.fn(() => ({ set: () => ({ where: () => [] }) }));
  const insert = vi.fn(() => ({ values: () => ({ returning: () => [] }) }));
  const table = new Proxy({}, { get: (_target, key) => String(key) });
  return {
    routes,
    db: { select, update, insert },
    select,
    update,
    insert,
    table,
    push: vi.fn(),
    create: vi.fn(),
  };
});

vi.mock("express", () => ({
  Router: () => ({
    get: (path: string, ...handlers: RegisteredRoute["handlers"]) =>
      mocked.routes.push({ method: "get", path, handlers }),
    post: (path: string, ...handlers: RegisteredRoute["handlers"]) =>
      mocked.routes.push({ method: "post", path, handlers }),
    patch: (path: string, ...handlers: RegisteredRoute["handlers"]) =>
      mocked.routes.push({ method: "patch", path, handlers }),
  }),
}));

vi.mock("@workspace/db", () => ({
  db: mocked.db,
  businessesTable: mocked.table,
  savedPlacesTable: mocked.table,
  reviewsTable: mocked.table,
  businessProfileViewsTable: mocked.table,
  businessSkipFeedbackTable: mocked.table,
  businessClickEventsTable: mocked.table,
  businessOwnerLinksTable: mocked.table,
  businessIdentityTable: mocked.table,
  businessPromotionsTable: mocked.table,
  conversations: mocked.table,
  messages: mocked.table,
}));

vi.mock("drizzle-orm", () => ({
  and: (...parts: unknown[]) => parts,
  avg: (value: unknown) => value,
  count: () => "count",
  desc: (value: unknown) => value,
  eq: (...parts: unknown[]) => parts,
  gt: (...parts: unknown[]) => parts,
  inArray: (...parts: unknown[]) => parts,
  isNull: (value: unknown) => value,
  ne: (...parts: unknown[]) => parts,
  sql: Object.assign((strings: TemplateStringsArray) => strings.join(""), {
    raw: (value: string) => value,
  }),
}));

vi.mock("../../middleware/requireMembership", () => ({
  TIER_RANK: { navigator: 1, trailblazer: 2 },
  getUserTier: vi.fn(async () => "navigator"),
  requireMembership: () => (req: any, res: any, next: () => Promise<void>) => {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    return next();
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));
vi.mock("../../lib/contentFilter", () => ({
  checkContent: () => ({ ok: true }),
}));
vi.mock("../../lib/pushNotifications", () => ({ sendPushToUser: mocked.push }));
vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: undefined,
}));
vi.mock("../../stripeClient", () => ({
  getUncachableStripeClient: mocked.create,
}));

const selectedRoutes = [
  {
    method: "get" as const,
    path: "/businesses/mine/managed/:businessId/analytics",
  },
  {
    method: "get" as const,
    path: "/businesses/mine/managed/:businessId/skip-feedback",
  },
  {
    method: "patch" as const,
    path: "/businesses/mine/managed/:businessId/feedback-opt-in",
  },
  {
    method: "get" as const,
    path: "/businesses/mine/managed/:businessId/post-nudge",
  },
  {
    method: "post" as const,
    path: "/businesses/mine/managed/:businessId/post-nudge/notify",
  },
  {
    method: "get" as const,
    path: "/businesses/mine/managed/:businessId/post-nudge/captions",
  },
  {
    method: "get" as const,
    path: "/businesses/mine/managed/:businessId/growth-tools",
  },
];

function responseRecorder() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
  };
  return response;
}

async function invoke(
  route: RegisteredRoute,
  req: any,
  res: any,
): Promise<void> {
  let index = -1;
  const next = async () => {
    index += 1;
    const handler = route.handlers[index];
    if (handler) await handler(req, res, next);
  };
  await next();
}

beforeAll(async () => {
  await import("../businesses-analytics");
  await import("../skip-feedback");
  await import("../post-nudge");
  await import("../promote");
});

describe("selected dashboard context routes", () => {
  it("registers every approved selected managed read or opt-in route and no selected payment route", () => {
    for (const expected of selectedRoutes) {
      expect(
        mocked.routes.some(
          (route) =>
            route.method === expected.method && route.path === expected.path,
        ),
      ).toBe(true);
    }
    expect(
      mocked.routes.some(
        (route) =>
          route.path.includes("/managed/:businessId/") &&
          /checkout|spotlight|promote/.test(route.path),
      ),
    ).toBe(false);
  });

  it.each(selectedRoutes)(
    "rejects anonymous access before any owner-link, data, provider, or mutation call: $method $path",
    async (expected) => {
      mocked.select.mockClear();
      mocked.update.mockClear();
      mocked.insert.mockClear();
      mocked.push.mockClear();
      mocked.create.mockClear();
      const route = mocked.routes.find(
        (candidate) =>
          candidate.method === expected.method &&
          candidate.path === expected.path,
      );
      expect(route).toBeTruthy();
      const res = responseRecorder();
      await invoke(
        route!,
        {
          user: undefined,
          params: { businessId: "business-b" },
          body: { enabled: true },
          log: { error: vi.fn() },
        },
        res,
      );
      expect(res.statusCode).toBe(401);
      expect(mocked.select).not.toHaveBeenCalled();
      expect(mocked.update).not.toHaveBeenCalled();
      expect(mocked.insert).not.toHaveBeenCalled();
      expect(mocked.push).not.toHaveBeenCalled();
      expect(mocked.create).not.toHaveBeenCalled();
    },
  );

  it.each(selectedRoutes)(
    "uses a neutral default-deny owner gate before selected business data or side effects: $method $path",
    async (expected) => {
      mocked.select.mockClear();
      mocked.update.mockClear();
      mocked.insert.mockClear();
      mocked.push.mockClear();
      mocked.create.mockClear();
      const route = mocked.routes.find(
        (candidate) =>
          candidate.method === expected.method &&
          candidate.path === expected.path,
      );
      expect(route).toBeTruthy();
      const res = responseRecorder();
      await invoke(
        route!,
        {
          user: { id: "owner-a" },
          params: { businessId: "business-b" },
          body: { enabled: true },
          log: { error: vi.fn() },
        },
        res,
      );
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: "No business found." });
      expect(mocked.select).toHaveBeenCalledTimes(1);
      expect(mocked.update).not.toHaveBeenCalled();
      expect(mocked.insert).not.toHaveBeenCalled();
      expect(mocked.push).not.toHaveBeenCalled();
      expect(mocked.create).not.toHaveBeenCalled();
    },
  );
});

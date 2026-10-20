import express, { type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const poolQuery = vi.hoisted(() => vi.fn());
const providerFetch = vi.hoisted(() => vi.fn());

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
  db: {},
  businessesTable: {},
  businessBroadcastsTable: {},
  businessNotificationPrefsTable: {},
  savedPlacesTable: {},
  pushTokensTable: {},
  BROADCAST_QUOTA: { free: 3, growth: 10, premium: 30, enterprise: Infinity },
  BROADCAST_TYPES: ["event", "offer", "product", "update", "community", "emergency"],
}));

import broadcastsRouter from "../broadcasts";

type TestUser = { id: string } | null;

function createApp(user: TestUser) {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    if (user) request.user = user as any;
    next();
  });
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.log = { info: vi.fn() } as any;
    next();
  });
  app.use("/api", broadcastsRouter);
  return app;
}

const selectedBusiness = {
  id: "selected-business",
  name: "Selected Business",
  marketplaceTier: "free",
  verified: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", providerFetch);
});

describe("selected owner Broadcasts routes", () => {
  it("rejects an anonymous selected-business read before querying persistence", async () => {
    const response = await supertest(createApp(null))
      .get("/api/businesses/selected-business/broadcasts");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expect(poolQuery).not.toHaveBeenCalled();
  });

  it.each(["an outsider", "a revoked owner"]) (
    "rejects %s through the approved unrevoked owner-link predicate",
    async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] });

      const response = await supertest(createApp({ id: "member-1" }))
        .get("/api/businesses/selected-business/broadcasts");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "An approved business owner link is required",
      });
      const [sql, params] = poolQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("business_owner_links bol");
      expect(sql).toContain("bol.role = 'owner'");
      expect(sql).toContain("bol.status = 'approved'");
      expect(sql).toContain("bol.revoked_at IS NULL");
      expect(params).toEqual(["selected-business", "member-1"]);
    },
  );

  it("returns only the authorized selected business history and quota", async () => {
    poolQuery
      .mockResolvedValueOnce({ rows: [selectedBusiness] })
      .mockResolvedValueOnce({ rows: [{ id: "broadcast-1", title: "Open late" }] })
      .mockResolvedValueOnce({ rows: [{ used: 1 }] });

    const response = await supertest(createApp({ id: "member-1" }))
      .get("/api/businesses/selected-business/broadcasts");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      broadcasts: [{ id: "broadcast-1", title: "Open late" }],
      quota: { used: 1, limit: 3, remaining: 2 },
      tier: "free",
    });
    expect(poolQuery.mock.calls[1]?.[1]).toEqual(["selected-business"]);
  });

  it("persists a valid selected-business broadcast without a provider dispatch", async () => {
    poolQuery
      .mockResolvedValueOnce({ rows: [selectedBusiness] })
      .mockResolvedValueOnce({ rows: [{ used: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: "broadcast-2", type: "event", title: "Tonight", body: "See you there" }] });

    const response = await supertest(createApp({ id: "member-1" }))
      .post("/api/businesses/selected-business/broadcasts")
      .send({ type: "event", title: "Tonight", body: "See you there" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      broadcast: { id: "broadcast-2", type: "event", title: "Tonight", body: "See you there" },
      delivered: 0,
      message: "Broadcast saved.",
    });
    expect(poolQuery.mock.calls[2]?.[1]).toEqual([
      "selected-business",
      "Selected Business",
      "event",
      "Tonight",
      "See you there",
    ]);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it("keeps existing validation shape and rejects unverified selected businesses", async () => {
    const invalid = await supertest(createApp({ id: "member-1" }))
      .post("/api/businesses/selected-business/broadcasts")
      .send({ type: "unknown", title: "Title", body: "Body" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toMatch(/^type must be one of:/);
    expect(poolQuery).not.toHaveBeenCalled();

    poolQuery.mockResolvedValueOnce({ rows: [{ ...selectedBusiness, verified: false }] });
    const unverified = await supertest(createApp({ id: "member-1" }))
      .get("/api/businesses/selected-business/broadcasts");
    expect(unverified.status).toBe(403);
    expect(unverified.body).toEqual({
      error: "Broadcasts are only available to verified businesses.",
      code: "unverified",
    });
  });
});

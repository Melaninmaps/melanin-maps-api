import express, { type Express, type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { poolConnect } = vi.hoisted(() => ({
  poolConnect: vi.fn(),
}));

vi.mock("@workspace/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/db")>();
  return {
    ...actual,
    pool: { connect: poolConnect },
  };
});

import businessRouter from "../businesses";

type QueryCall = readonly [sql: string, values?: readonly unknown[]];

const existingBusiness = {
  id: "business-1000-words",
  name: "1000 Words Inc.",
  description: "Existing art-space description.",
  address: "3328 E 10th St Suite C",
  city: "Indianapolis",
  state: "IN",
  latitude: null,
  longitude: null,
  phone: null,
  website: "https://1000wordsindy.com/",
  hours: null,
  price_range: null,
  instagram: null,
  tiktok: null,
  facebook: null,
  twitter: null,
  youtube: null,
  pinterest: null,
  ownership_designations: [],
  vibes: [],
  tags: [],
  category: "Retail & Culture",
  subcategory: "Art Gallery",
  photos: [],
  listing_status: "approved",
  is_duplicate: false,
};

function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.user = { id: "admin-1", role: "admin" } as any;
    request.log = { error: vi.fn(), info: vi.fn(), warn: vi.fn() } as any;
    next();
  });
  app.use("/api", businessRouter);
  return app;
}

beforeEach(() => {
  const calls: QueryCall[] = [];
  const client = {
    query: vi.fn(async (sql: string, values?: readonly unknown[]) => {
      calls.push([sql, values]);
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("FROM businesses WHERE id = $1") && sql.includes("FOR UPDATE")) {
        return { rows: [existingBusiness] };
      }
      if (sql.startsWith("UPDATE businesses SET")) {
        const descriptionIndex = sql.indexOf("description = $1") >= 0 ? 0 : -1;
        expect(descriptionIndex).toBe(0);
        expect(values?.[descriptionIndex]).toBe("1000 Words Inc.\n\nHosts free public art events and Black/Brown artist programs.");
        return {
          rows: [{
            ...existingBusiness,
            description: values?.[descriptionIndex],
          }],
        };
      }
      if (sql.includes("business_admin_profile_edit_audit_events")) return { rows: [] };
      throw new Error(`Unexpected query: ${sql}`);
    }),
    release: vi.fn(),
  };
  poolConnect.mockResolvedValue(client);
  (poolConnect as any).calls = calls;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/admin/businesses/:id/profile imported description normalization", () => {
  it("normalizes harmless import formatting and persists the parameterized normalized value through the actual admin route", async () => {
    const response = await supertest(createApp())
      .patch("/api/admin/businesses/business-1000-words/profile")
      .send({
        description: "\uFEFF1000 Words Inc.\r\n\r\nHosts free public art events\tand Black/Brown artist programs.\u00A0",
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "Profile saved.",
      mapPinInvalidated: false,
      business: {
        id: "business-1000-words",
        description: "1000 Words Inc.\n\nHosts free public art events and Black/Brown artist programs.",
      },
    });
    expect(poolConnect).toHaveBeenCalledTimes(1);
    const client = await poolConnect.mock.results[0]?.value;
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls.map(([sql]: [string]) => sql)).toEqual(expect.arrayContaining([
      "BEGIN",
      "COMMIT",
    ]));
  });

  it("rejects a boundary form-feed after the existing-profile lock without issuing an update", async () => {
    const response = await supertest(createApp())
      .patch("/api/admin/businesses/business-1000-words/profile")
      .send({ description: "\u000C1000 Words Inc." });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "description contains invalid control characters" });
    const client = await poolConnect.mock.results[0]?.value;
    const queries = client.query.mock.calls.map(([sql]: [string]) => sql);
    expect(queries).toEqual(expect.arrayContaining(["BEGIN", "ROLLBACK"]));
    expect(queries.some((sql: string) => sql.includes("FROM businesses WHERE id = $1 FOR UPDATE"))).toBe(true);
    expect(client.query.mock.calls.some(([sql]: [string]) => sql.startsWith("UPDATE businesses SET"))).toBe(false);
  });
});

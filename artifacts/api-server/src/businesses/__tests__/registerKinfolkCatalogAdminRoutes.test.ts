import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  parseKinfolkCatalogStateChange,
  registerKinfolkCatalogAdminRoutes,
} from "../registerKinfolkCatalogAdminRoutes";

function makeDatabase() {
  const query = vi.fn(async (statement: string) => {
    if (statement.includes("COUNT(*)::text")) return { rows: [{ total: "1" }] };
    if (statement.includes("FROM business_catalog_cohort_memberships m")) return {
      rows: [{
        business_id: "business-1", name: "Community Books", city: "Philadelphia", state_code: "PA",
        category: "Books", listing_status: "live_unclaimed", is_duplicate: false,
        catalog_state: "intake", reason: "Review intake provenance", updated_at: "2026-10-05T00:00:00.000Z", created_at: "2026-10-05T00:00:00.000Z",
      }],
    };
    if (statement.includes("FROM businesses WHERE id = $1 FOR UPDATE")) return { rows: [{ id: "business-1", name: "Community Books", is_duplicate: false }] };
    if (statement.includes("FROM business_catalog_cohort_memberships") && statement.includes("FOR UPDATE")) return { rows: [] };
    if (statement.includes("INSERT INTO business_catalog_cohort_memberships")) return { rows: [{ business_id: "business-1", state: "intake", reason: "Review intake provenance", created_at: "2026-10-05T00:00:00.000Z", updated_at: "2026-10-05T00:00:00.000Z" }] };
    return { rows: [] };
  });
  const client = { query, release: vi.fn() };
  return { query, connect: vi.fn().mockResolvedValue(client), client };
}

function appWith(role: "admin" | "member", database = makeDatabase()) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: "admin-user", role, email: `${role}@example.test` } as any;
    req.log = { error: vi.fn() } as any;
    next();
  });
  registerKinfolkCatalogAdminRoutes(app, database as any);
  return { app, database };
}

describe("Kinfolk Catalog cohort routes", () => {
  it("requires an authorized administrator before reading or changing the cohort", async () => {
    const { app, database } = appWith("member");
    await request(app).get("/api/admin/kinfolk-catalog").expect(403);
    await request(app).patch("/api/admin/kinfolk-catalog/business-1").send({ state: "intake", reason: "Review intake provenance" }).expect(403);
    expect(database.connect).not.toHaveBeenCalled();
  });

  it("lists only existing durable cohort membership rows", async () => {
    const { app } = appWith("admin");
    const response = await request(app).get("/api/admin/kinfolk-catalog?search=books").expect(200);
    expect(response.body).toMatchObject({ filteredTotal: 1, memberships: [{ businessId: "business-1", catalogState: "intake" }] });
  });

  it("adds an existing canonical business through a transaction and audit receipt without mutating the businesses table", async () => {
    const { app, database } = appWith("admin");
    const response = await request(app)
      .patch("/api/admin/kinfolk-catalog/business-1")
      .send({ state: "intake", reason: "Review intake provenance" })
      .expect(200);
    expect(response.body.membership).toMatchObject({ business_id: "business-1", state: "intake" });
    const statements = database.query.mock.calls.map(([statement]: [string]) => statement);
    expect(statements).toContain("BEGIN");
    expect(statements).toContain("COMMIT");
    expect(statements.some((statement: string) => statement.includes("INSERT INTO business_catalog_cohort_audit_events"))).toBe(true);
    expect(statements.some((statement: string) => /^\s*UPDATE businesses/i.test(statement))).toBe(false);
  });

  it("rejects invalid states before opening a database transaction", async () => {
    const { app, database } = appWith("admin");
    await request(app).patch("/api/admin/kinfolk-catalog/business-1").send({ state: "published", reason: "No" }).expect(400);
    expect(database.connect).not.toHaveBeenCalled();
  });

  it("requires one of the bounded cohort states and an audit reason", () => {
    expect(parseKinfolkCatalogStateChange({ state: "review", reason: "Source needs a human review." })).toEqual({ state: "review", reason: "Source needs a human review." });
    expect(() => parseKinfolkCatalogStateChange({ state: "published", reason: "No" })).toThrow("state must be");
  });
});

import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  parseKinfolkCatalogStateChange,
  registerKinfolkCatalogAdminRoutes,
} from "../registerKinfolkCatalogAdminRoutes";

type MockCatalogOptions = {
  eligible?: boolean;
  isDuplicate?: boolean;
  membership?: { state: "intake" | "review" | "ready" | "held" | "removed"; reason?: string } | null;
};

function makeDatabase({
  eligible = true,
  isDuplicate = false,
  membership = null,
}: MockCatalogOptions = {}) {
  const query = vi.fn(async (statement: string, values?: readonly unknown[]) => {
    if (statement.includes("COUNT(*)::text")) return { rows: [{ total: "1" }] };
    if (statement.includes("FROM public.public_businesses AS current_kinfolk")) {
      return { rows: eligible ? [{ id: "business-1" }] : [] };
    }
    if (statement.includes("FROM businesses WHERE id = $1 FOR UPDATE")) {
      return { rows: [{ id: "business-1", name: "Community Books", is_duplicate: isDuplicate }] };
    }
    if (statement.includes("FROM business_catalog_cohort_memberships") && statement.includes("FOR UPDATE")) {
      return membership
        ? { rows: [{ state: membership.state, reason: membership.reason ?? "Existing catalog review", updated_at: "2026-10-05T00:00:00.000Z" }] }
        : { rows: [] };
    }
    if (statement.includes("FROM business_catalog_cohort_memberships m")) return {
      rows: [{
        business_id: "business-1", name: "Community Books", city: "Philadelphia", state_code: "PA",
        category: "Books", listing_status: "live_unclaimed", is_duplicate: false,
        catalog_state: "intake", reason: "Review intake provenance", updated_at: "2026-10-05T00:00:00.000Z", created_at: "2026-10-05T00:00:00.000Z",
      }],
    };
    if (statement.includes("WHERE cohort_key = $1 AND business_id = ANY($2::text[])")) return {
      rows: [{ business_id: "business-1", state: "ready", reason: "Ready for current catalog", updated_at: "2026-10-05T00:00:00.000Z" }],
    };
    if (statement.includes("INSERT INTO business_catalog_cohort_memberships")) return {
      rows: [{
        business_id: "business-1", state: values?.[2] ?? "intake", reason: values?.[3] ?? "Review intake provenance",
        created_at: "2026-10-05T00:00:00.000Z", updated_at: "2026-10-05T00:00:00.000Z",
      }],
    };
    if (statement.includes("UPDATE business_catalog_cohort_memberships")) return {
      rows: [{
        business_id: "business-1", state: values?.[0] ?? "removed", reason: values?.[1] ?? "Review intake provenance",
        created_at: "2026-10-05T00:00:00.000Z", updated_at: "2026-10-05T00:00:00.000Z",
      }],
    };
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

function statementsFor(database: ReturnType<typeof makeDatabase>): string[] {
  return database.query.mock.calls.map(([statement]: [string]) => statement);
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

  it("returns only durable membership status for requested Admin inventory rows", async () => {
    const { app, database } = appWith("admin");
    const response = await request(app).get("/api/admin/kinfolk-catalog?businessIds=business-1").expect(200);
    expect(response.body).toMatchObject({ memberships: [{ businessId: "business-1", catalogState: "ready" }] });
    expect(statementsFor(database).some((statement) => statement.includes("business_id = ANY($2::text[])"))).toBe(true);
  });

  it("adds an eligible canonical business through a transaction and audit receipt without mutating the businesses table", async () => {
    const { app, database } = appWith("admin");
    const response = await request(app)
      .patch("/api/admin/kinfolk-catalog/business-1")
      .send({ state: "ready", reason: "Documented public catalog review" })
      .expect(200);
    expect(response.body.membership).toMatchObject({ business_id: "business-1", state: "ready" });
    const statements = statementsFor(database);
    expect(statements).toContain("BEGIN");
    expect(statements).toContain("COMMIT");
    expect(statements.some((statement) => statement.includes("FROM public.public_businesses AS current_kinfolk"))).toBe(true);
    expect(statements.findIndex((statement) => statement.includes("FROM public.public_businesses AS current_kinfolk")))
      .toBeLessThan(statements.findIndex((statement) => statement.includes("INSERT INTO business_catalog_cohort_memberships")));
    expect(statements.some((statement) => statement.includes("INSERT INTO business_catalog_cohort_audit_events"))).toBe(true);
    expect(statements.some((statement) => /^\s*UPDATE businesses/i.test(statement))).toBe(false);
  });

  it("rejects duplicate and non-current businesses before any Catalog upsert", async () => {
    const duplicate = appWith("admin", makeDatabase({ isDuplicate: true }));
    await request(duplicate.app)
      .patch("/api/admin/kinfolk-catalog/business-1")
      .send({ state: "ready", reason: "Documented public catalog review" })
      .expect(409);
    expect(statementsFor(duplicate.database).some((statement) => statement.includes("FROM public.public_businesses AS current_kinfolk"))).toBe(false);
    expect(statementsFor(duplicate.database).some((statement) => statement.includes("INSERT INTO business_catalog_cohort_memberships"))).toBe(false);

    const ineligible = appWith("admin", makeDatabase({ eligible: false }));
    await request(ineligible.app)
      .patch("/api/admin/kinfolk-catalog/business-1")
      .send({ state: "ready", reason: "Documented public catalog review" })
      .expect(409);
    expect(statementsFor(ineligible.database).some((statement) => statement.includes("FROM public.public_businesses AS current_kinfolk"))).toBe(true);
    expect(statementsFor(ineligible.database).some((statement) => statement.includes("INSERT INTO business_catalog_cohort_memberships"))).toBe(false);
  });

  it("allows removed only for an existing membership and never creates a removed row", async () => {
    const absent = appWith("admin", makeDatabase());
    await request(absent.app)
      .patch("/api/admin/kinfolk-catalog/business-1")
      .send({ state: "removed", reason: "Editorial removal review" })
      .expect(409);
    expect(statementsFor(absent.database).some((statement) => statement.includes("INSERT INTO business_catalog_cohort_memberships"))).toBe(false);

    const existing = appWith("admin", makeDatabase({ membership: { state: "ready" } }));
    const response = await request(existing.app)
      .patch("/api/admin/kinfolk-catalog/business-1")
      .send({ state: "removed", reason: "Editorial removal review" })
      .expect(200);
    expect(response.body.membership).toMatchObject({ state: "removed" });
    const statements = statementsFor(existing.database);
    expect(statements.some((statement) => statement.includes("UPDATE business_catalog_cohort_memberships"))).toBe(true);
    expect(statements.some((statement) => statement.includes("INSERT INTO business_catalog_cohort_memberships"))).toBe(false);
    expect(statements.some((statement) => /^\s*UPDATE businesses/i.test(statement))).toBe(false);
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

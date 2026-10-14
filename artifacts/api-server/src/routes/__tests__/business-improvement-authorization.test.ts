import express, { type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  poolQuery,
  insertValues,
  selectPlans,
  openaiCreate,
  drizzleAnd,
  drizzleEq,
} = vi.hoisted(() => ({
  poolQuery: vi.fn(),
  insertValues: vi.fn(),
  selectPlans: vi.fn(),
  openaiCreate: vi.fn(),
  drizzleAnd: vi.fn((...conditions: unknown[]) => ({ kind: "and", conditions })),
  drizzleEq: vi.fn((column: unknown, value: unknown) => ({ kind: "eq", column, value })),
}));

const dbSelect = vi.hoisted(() => vi.fn(() => ({
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({ limit: selectPlans })),
    })),
  })),
})));

vi.mock("@workspace/db", () => ({
  db: {
    insert: vi.fn(() => ({ values: insertValues })),
    select: dbSelect,
  },
  pool: { query: poolQuery },
  businessImprovementPlansTable: {
    businessId: "business_id",
    userId: "user_id",
    createdAt: "created_at",
  },
  usersTable: {},
  businessesTable: {},
}));

vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: { chat: { completions: { create: openaiCreate } } },
}));

vi.mock("drizzle-orm", () => ({
  and: drizzleAnd,
  eq: drizzleEq,
  desc: vi.fn((column: unknown) => ({ kind: "desc", column })),
}));

import businessImprovementRouter from "../business-improvement";

const ownerBusiness = { id: "business-owned-by-member" };
const ownerPlan = {
  id: "plan-owned-by-member",
  businessId: ownerBusiness.id,
  userId: "approved-owner",
  issueDescription: "private owner context",
};

function createApp(userId: string | null) {
  const app = express();
  app.use(express.json());
  app.use((request: Request, _response: Response, next: NextFunction) => {
    if (userId) request.user = { id: userId } as Request["user"];
    request.log = { error: vi.fn() } as any;
    next();
  });
  app.use("/api", businessImprovementRouter);
  return app;
}

function validRequest() {
  return {
    businessId: ownerBusiness.id,
    businessName: "Authorized Business",
    businessCategory: "Professional Services",
    businessCity: "Philadelphia",
    issueType: "operations",
    serviceTypes: ["Marketing Agency"],
    budget: "$1,000",
    timeline: "one month",
  };
}

function authorizationQuery(): string {
  const call = poolQuery.mock.calls.find(([sql]) => String(sql).includes("business_owner_links bol"));
  expect(call).toBeDefined();
  return String(call![0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  insertValues.mockResolvedValue(undefined);
  selectPlans.mockResolvedValue([]);
  openaiCreate.mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          summary: "Owner-scoped plan",
          roadmap: [],
          grantOpportunities: [],
          totalEstimateRange: "$1,000",
          nextSteps: [],
          legalNote: "Owner review required.",
        }),
      },
    }],
  });
});

describe("business improvement plan owner authorization", () => {
  it("requires authentication before any owner-link lookup or private-plan read", async () => {
    const response = await supertest(createApp(null))
      .get(`/api/business-improvement/${ownerBusiness.id}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
    expect(poolQuery).not.toHaveBeenCalled();
    expect(dbSelect).not.toHaveBeenCalled();
  });

  it("denies a non-owner before provider work or persistence", async () => {
    poolQuery.mockResolvedValue({ rows: [] });

    const response = await supertest(createApp("non-owner"))
      .post("/api/business-improvement")
      .send(validRequest());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "An approved business owner link is required" });
    expect(authorizationQuery()).toContain("bol.role = 'owner'");
    expect(authorizationQuery()).toContain("bol.status = 'approved'");
    expect(authorizationQuery()).toContain("bol.revoked_at IS NULL");
    expect(poolQuery.mock.calls[0][1]).toEqual([ownerBusiness.id, "non-owner"]);
    expect(openaiCreate).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("treats a revoked owner link as unavailable without revealing private plans", async () => {
    poolQuery.mockResolvedValue({ rows: [] });

    const response = await supertest(createApp("revoked-owner"))
      .get(`/api/business-improvement/${ownerBusiness.id}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "An approved business owner link is required" });
    expect(authorizationQuery()).toContain("bol.revoked_at IS NULL");
    expect(poolQuery.mock.calls[0][1]).toEqual([ownerBusiness.id, "revoked-owner"]);
    expect(dbSelect).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain("private owner context");
  });

  it("allows an approved owner to create a plan and persists the authorized business and requester", async () => {
    poolQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("business_owner_links bol")) return { rows: [ownerBusiness] };
      if (sql.includes("FROM businesses b")) return { rows: [] };
      return { rows: [] };
    });

    const response = await supertest(createApp("approved-owner"))
      .post("/api/business-improvement")
      .send(validRequest());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ summary: "Owner-scoped plan" });
    expect(openaiCreate).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      businessId: ownerBusiness.id,
      userId: "approved-owner",
    }));
  });

  it("returns plans only to the approved requester and scopes the read to both business and user", async () => {
    poolQuery.mockResolvedValue({ rows: [ownerBusiness] });
    selectPlans.mockResolvedValue([ownerPlan]);

    const response = await supertest(createApp("approved-owner"))
      .get(`/api/business-improvement/${ownerBusiness.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ plans: [ownerPlan] });
    expect(drizzleAnd).toHaveBeenCalledTimes(1);
    expect(drizzleEq).toHaveBeenCalledWith("business_id", ownerBusiness.id);
    expect(drizzleEq).toHaveBeenCalledWith("user_id", "approved-owner");
  });

  it("does not return one approved owner's plans to another approved owner of the same business", async () => {
    poolQuery.mockResolvedValue({ rows: [ownerBusiness] });
    selectPlans.mockResolvedValue([]);

    const response = await supertest(createApp("other-approved-owner"))
      .get(`/api/business-improvement/${ownerBusiness.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ plans: [] });
    expect(drizzleEq).toHaveBeenCalledWith("business_id", ownerBusiness.id);
    expect(drizzleEq).toHaveBeenCalledWith("user_id", "other-approved-owner");
  });
});

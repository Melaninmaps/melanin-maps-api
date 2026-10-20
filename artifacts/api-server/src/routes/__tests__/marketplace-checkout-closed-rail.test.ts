import { readFileSync } from "node:fs";
import express, { type NextFunction, type Request, type Response } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbSelect, getUncachableStripeClient, checkoutSessionCreate, logError } = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getUncachableStripeClient: vi.fn(),
  checkoutSessionCreate: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: { select: dbSelect },
  businessesTable: {},
  businessListingsTable: {},
}));

vi.mock("../../stripeClient", () => ({
  getUncachableStripeClient,
}));

import connectRouter from "../connect";

const COMMERCIAL_RAIL_CLOSED = {
  error: "Marketplace checkout is temporarily unavailable.",
  code: "COMMERCIAL_RAIL_CLOSED",
};

function createApp(rejectBodyAccess = false) {
  const app = express();
  app.use(express.json());
  if (rejectBodyAccess) {
    app.use((request: Request, _response: Response, next: NextFunction) => {
      Object.defineProperty(request, "body", {
        configurable: true,
        get() {
          throw new Error("Closed marketplace checkout must not inspect request.body");
        },
      });
      next();
    });
  }
  app.use((request: Request, _response: Response, next: NextFunction) => {
    request.log = { error: logError } as any;
    next();
  });
  app.use("/api", connectRouter);
  return app;
}

function expectNoCommercialSideEffects() {
  expect(dbSelect).not.toHaveBeenCalled();
  expect(getUncachableStripeClient).not.toHaveBeenCalled();
  expect(checkoutSessionCreate).not.toHaveBeenCalled();
  expect(logError).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  getUncachableStripeClient.mockResolvedValue({
    checkout: { sessions: { create: checkoutSessionCreate } },
  });
});

describe("closed marketplace checkout initiator", () => {
  it("returns the exact generic 409 before body, database, Stripe, session, or logging activity", async () => {
    const response = await supertest(createApp(true))
      .post("/api/connect/listings/listing-private/checkout")
      .send({
        quantity: 999,
        successUrl: "https://attacker.example/success",
        cancelUrl: "https://attacker.example/cancel",
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual(COMMERCIAL_RAIL_CLOSED);
    expect(response.headers.location).toBeUndefined();
    expect(response.body).not.toHaveProperty("url");
    expect(response.body).not.toHaveProperty("sessionId");
    expectNoCommercialSideEffects();
  });

  it("keeps the checkout handler structurally limited to the generic closed-rail response", () => {
    const source = readFileSync(new URL("../connect.ts", import.meta.url), "utf8");
    const start = source.indexOf('router.post("/connect/listings/:id/checkout"');
    const end = source.indexOf("\n});", start);
    const handler = source.slice(start, end + "\n});".length);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(handler).toContain("res.status(409).json(COMMERCIAL_RAIL_CLOSED);");
    expect(handler).not.toMatch(/req\.body|req\.params|db\.|getUncachableStripeClient|process\.env|checkout\.sessions|req\.log/);
  });
});

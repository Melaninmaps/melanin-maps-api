import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
  fetch: vi.fn(),
  poolQuery: vi.fn(),
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@workspace/db", () => ({
  pool: { query: fakes.poolQuery },
}));

import revenueCatRouter from "../revenuecat";

const DISABLED_RESPONSE = {
  code: "REVENUECAT_DISABLED",
  error: "RevenueCat purchases and restores are currently unavailable.",
};

function app(): express.Express {
  const server = express();
  server.use((req, _res, next) => {
    (req as { user?: { id: string } }).user = { id: "member-identifier-must-not-log" };
    (req as unknown as { log?: typeof fakes.logger }).log = fakes.logger;
    next();
  });
  server.use(revenueCatRouter);
  return server;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fakes.fetch);
});

afterEach(() => vi.unstubAllGlobals());

describe("RevenueCat default-disabled server rail", () => {
  it("returns the identical generic 409 response before any provider, pool, shared-field, or identifier-log path for varied sync and webhook requests", async () => {
    const server = app();
    const responses = await Promise.all([
      request(server)
        .post("/revenuecat/sync")
        .send({ productIdentifier: "mwm_trailblazer_monthly" }),
      request(server)
        .post("/revenuecat/sync")
        .set("authorization", "Bearer member-identifier-must-not-log")
        .send({ productIdentifier: "unrecognized-product" }),
      request(server)
        .post("/revenuecat/webhook")
        .send({
          event: {
            app_user_id: "member-identifier-must-not-log",
            product_id: "mwm_navigator_annual",
            type: "INITIAL_PURCHASE",
          },
        }),
      request(server)
        .post("/revenuecat/webhook")
        .set("authorization", "sensitive-webhook-value")
        .send({ event: { type: "EXPIRATION" } }),
    ]);

    for (const response of responses) {
      expect(response.statusCode).toBe(409);
      expect(response.body).toEqual(DISABLED_RESPONSE);
    }
    expect(responses.map((response) => JSON.stringify(response.body))).toEqual([
      JSON.stringify(DISABLED_RESPONSE),
      JSON.stringify(DISABLED_RESPONSE),
      JSON.stringify(DISABLED_RESPONSE),
      JSON.stringify(DISABLED_RESPONSE),
    ]);

    expect(fakes.fetch).not.toHaveBeenCalled();
    expect(fakes.poolQuery).not.toHaveBeenCalled();
    expect(fakes.logger.info).not.toHaveBeenCalled();
    expect(fakes.logger.warn).not.toHaveBeenCalled();
    expect(fakes.logger.error).not.toHaveBeenCalled();

    const emittedLogs = JSON.stringify({
      error: fakes.logger.error.mock.calls,
      info: fakes.logger.info.mock.calls,
      warn: fakes.logger.warn.mock.calls,
    });
    expect(emittedLogs).not.toContain("member-identifier-must-not-log");
    expect(emittedLogs).not.toContain("sensitive-webhook-value");
  });

  it("contains no active request, environment, provider, database, shared-field, or logger path behind the disabled endpoints", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile(new URL("../revenuecat.ts", import.meta.url), "utf8"),
    );

    for (const prohibitedSource of [
      "@workspace/db",
      "fetch(",
      "process.env",
      "req.body",
      "req.headers",
      "req.user",
      "req.log",
      "member_type",
      "stripe_subscription_id",
      ".query(",
    ]) {
      expect(source).not.toContain(prohibitedSource);
    }
    expect(source).toContain('router.post("/revenuecat/sync", revenueCatDisabled)');
    expect(source).toContain('router.post("/revenuecat/webhook", revenueCatDisabled)');
  });
});

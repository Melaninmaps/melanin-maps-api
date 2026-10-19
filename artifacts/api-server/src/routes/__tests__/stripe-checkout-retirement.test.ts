import { readFileSync } from "node:fs";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  poolQuery,
  getUser,
  updateUserStripeInfo,
  getUncachableStripeClient,
  createCustomer,
  createCheckoutSession,
  stripeCustomerCreate,
  stripeCheckoutCreate,
} = vi.hoisted(() => ({
  poolQuery: vi.fn(),
  getUser: vi.fn(),
  updateUserStripeInfo: vi.fn(),
  getUncachableStripeClient: vi.fn(),
  createCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
  stripeCustomerCreate: vi.fn(),
  stripeCheckoutCreate: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  pool: { query: poolQuery },
}));

vi.mock("../../storage", () => ({
  storage: {
    getUser,
    updateUserStripeInfo,
  },
}));

vi.mock("../../stripeClient", () => ({
  getUncachableStripeClient,
}));

vi.mock("../../stripeService", () => ({
  stripeService: {
    createCustomer,
    createCheckoutSession,
  },
}));

vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    customers: { create: stripeCustomerCreate },
    checkout: { sessions: { create: stripeCheckoutCreate } },
  })),
}));

import billingRouter from "../billing";
import membershipFamilyRouter from "../membership-family";
import stripeRouter from "../stripe";

const CHECKOUT_UNAVAILABLE = {
  error:
    "Membership checkout is temporarily unavailable while the approved catalog and entitlement lifecycle are being reconciled.",
  code: "MEMBERSHIP_CHECKOUT_CATALOG_RECONCILIATION_REQUIRED",
};

const checkoutPaths = [
  "/api/stripe/checkout",
  "/api/billing/checkout",
  "/api/membership/family/add-seat",
] as const;

type AppUser = { id: string } | null;

function createApp(user: AppUser, rejectBodyAccess = false) {
  const app = express();
  app.use(express.json());

  if (rejectBodyAccess) {
    app.use((request: Request, _response: Response, next: NextFunction) => {
      Object.defineProperty(request, "body", {
        configurable: true,
        get() {
          throw new Error(
            "Checkout handlers must not inspect request.body while enrollment is closed",
          );
        },
      });
      next();
    });
  }

  app.use((request: Request, _response: Response, next: NextFunction) => {
    if (user) request.user = user as any;
    request.log = { error: vi.fn(), info: vi.fn() } as any;
    next();
  });
  app.use("/api", stripeRouter);
  app.use("/api", billingRouter);
  app.use("/api", membershipFamilyRouter);
  return app;
}

function expectNoCheckoutSideEffects() {
  expect(poolQuery).not.toHaveBeenCalled();
  expect(getUser).not.toHaveBeenCalled();
  expect(updateUserStripeInfo).not.toHaveBeenCalled();
  expect(getUncachableStripeClient).not.toHaveBeenCalled();
  expect(createCustomer).not.toHaveBeenCalled();
  expect(createCheckoutSession).not.toHaveBeenCalled();
  expect(stripeCustomerCreate).not.toHaveBeenCalled();
  expect(stripeCheckoutCreate).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("closed membership checkout initiators", () => {
  it.each(checkoutPaths)(
    "returns the exact no-side-effect 409 for %s despite forged enrollment input",
    async (path) => {
      const response = await supertest(createApp({ id: "member-a" }))
        .post(path)
        .send({
          priceId: "forged-price",
          plan: "trailblazer",
          planType: "founding",
          interval: "annual",
          trialEndsAt: "2099-01-01T00:00:00.000Z",
          memberType: "trailblazer",
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual(CHECKOUT_UNAVAILABLE);
      expect(response.headers.location).toBeUndefined();
      expect(response.body).not.toHaveProperty("url");
      expect(response.body).not.toHaveProperty("checkoutUrl");
      expectNoCheckoutSideEffects();
    },
  );

  it.each(checkoutPaths)(
    "does not inspect request.body before returning 409 for %s",
    async (path) => {
      const response = await supertest(
        createApp({ id: "member-a" }, true),
      ).post(path);

      expect(response.status).toBe(409);
      expect(response.body).toEqual(CHECKOUT_UNAVAILABLE);
      expectNoCheckoutSideEffects();
    },
  );

  it.each(checkoutPaths)(
    "preserves direct-router authentication for %s",
    async (path) => {
      const response = await supertest(createApp(null)).post(path);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Authentication required" });
      expectNoCheckoutSideEffects();
    },
  );

  it("keeps aggregate authentication ahead of all three checkout routers", () => {
    const source = readFileSync(
      new URL("../index.ts", import.meta.url),
      "utf8",
    );
    const auth = source.indexOf("router.use(requireAuth);");

    expect(auth).toBeGreaterThanOrEqual(0);
    expect(auth).toBeLessThan(source.indexOf("router.use(stripeRouter);"));
    expect(auth).toBeLessThan(source.indexOf("router.use(billingRouter);"));
    expect(auth).toBeLessThan(
      source.indexOf("router.use(membershipFamilyRouter);"),
    );
  });
});

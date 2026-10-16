import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasActivePaidMembershipTrial } from "../../constants/membershipTiers";
import {
  decideMembershipSubscriptionEntitlement,
  isEntitlingStripeSubscriptionStatus,
} from "../stripeMembershipEntitlement";
import { verifyStripeWebhookSignature } from "../../stripeClient";

const legacyCheckoutSource = readFileSync(new URL("../../routes/stripe.ts", import.meta.url), "utf8");
const billingCheckoutSource = readFileSync(new URL("../../routes/billing.ts", import.meta.url), "utf8");
const userProfileSource = readFileSync(new URL("../../routes/users.ts", import.meta.url), "utf8");
const billingCheckoutOnly = billingCheckoutSource.slice(
  billingCheckoutSource.indexOf('router.post("/billing/checkout"'),
  billingCheckoutSource.indexOf('router.post("/billing/portal"'),
);

describe("Stripe membership entitlement policy", () => {
  it("does not grant access from a Checkout completion alone", () => {
    expect(legacyCheckoutSource).toContain('res.status(410).json({');
    expect(legacyCheckoutSource).not.toContain("updateUserStripeInfo(user.id, { memberType, trialEndsAt })");
    expect(billingCheckoutOnly).not.toContain("memberType:");
  });

  it("grants Navigator or Trailblazer only for active or provider-managed trial subscriptions", () => {
    expect(decideMembershipSubscriptionEntitlement({ status: "active", metadata: { planType: "navigator" } }))
      .toEqual({ action: "grant", plan: "navigator" });
    expect(decideMembershipSubscriptionEntitlement({ status: "trialing", metadata: { planType: "trailblazer" } }))
      .toEqual({ action: "grant", plan: "trailblazer" });
  });

  it("revokes access for abandoned, failed, expired, and cancelled subscription states", () => {
    for (const status of ["incomplete", "incomplete_expired", "past_due", "unpaid", "canceled", "paused"]) {
      expect(decideMembershipSubscriptionEntitlement({ status, metadata: { planType: "navigator" } }))
        .toEqual({ action: "revoke" });
      expect(isEntitlingStripeSubscriptionStatus(status)).toBe(false);
    }
  });

  it("keeps a successful renewal active and fails closed for an unknown plan", () => {
    expect(decideMembershipSubscriptionEntitlement({ status: "active", metadata: { planType: "trailblazer" } }))
      .toEqual({ action: "grant", plan: "trailblazer" });
    expect(decideMembershipSubscriptionEntitlement({ status: "active", metadata: { planType: "individual" } }))
      .toEqual({ action: "revoke" });
  });

  it("never treats a bare or expired profile trial date as paid access", () => {
    const now = new Date("2026-10-16T12:00:00.000Z");
    expect(hasActivePaidMembershipTrial({ memberType: "individual", trialEndsAt: new Date("2026-10-20T00:00:00.000Z") }, now)).toBe(false);
    expect(hasActivePaidMembershipTrial({ memberType: "navigator", trialEndsAt: new Date("2026-10-15T00:00:00.000Z") }, now)).toBe(false);
    expect(hasActivePaidMembershipTrial({ memberType: "navigator", trialEndsAt: new Date("2026-10-20T00:00:00.000Z") }, now)).toBe(true);
    expect(userProfileSource).not.toContain("Auto-start 90-day community premium trial");
  });
});

describe("Stripe webhook verification", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a valid Stripe signature and rejects a forged payload before handling it", async () => {
    const secret = "whsec_payment_entitlement_regression_secret";
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_payment_entitlement_regression_key");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);

    const payload = Buffer.from(JSON.stringify({ id: "evt_regression", type: "customer.subscription.updated", data: { object: {} } }));
    const signature = Stripe.webhooks.generateTestHeaderString({ payload: payload.toString("utf8"), secret });

    await expect(verifyStripeWebhookSignature(payload, signature)).resolves.toMatchObject({ id: "evt_regression" });
    await expect(verifyStripeWebhookSignature(Buffer.from("{}"), signature)).rejects.toThrow();
  });
});

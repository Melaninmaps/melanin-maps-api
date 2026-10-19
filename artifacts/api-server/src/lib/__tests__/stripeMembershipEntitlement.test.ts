import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasActivePaidMembershipTrial } from "../../constants/membershipTiers";
import { getPersonalMembershipTier } from "../../middleware/requireMembership";
import {
  decideMembershipSubscriptionEntitlement,
  isEntitlingStripeSubscriptionStatus,
  providerTrialEndsAt,
} from "../stripeMembershipEntitlement";
import { verifyStripeWebhookSignature } from "../../stripeClient";

const legacyCheckoutSource = readFileSync(new URL("../../routes/stripe.ts", import.meta.url), "utf8");
const billingCheckoutSource = readFileSync(new URL("../../routes/billing.ts", import.meta.url), "utf8");
const userProfileSource = readFileSync(new URL("../../routes/users.ts", import.meta.url), "utf8");
const billingStatusSource = billingCheckoutSource.slice(0, billingCheckoutSource.indexOf('router.post("/billing/checkout"'));
const membershipFamilySource = readFileSync(new URL("../../routes/membership-family.ts", import.meta.url), "utf8");
const webhookSource = readFileSync(new URL("../../webhookHandlers.ts", import.meta.url), "utf8");
const webBillingSource = readFileSync(new URL("../../../../web/src/pages/billing.tsx", import.meta.url), "utf8");
const billingCheckoutOnly = billingCheckoutSource.slice(
  billingCheckoutSource.indexOf('router.post("/billing/checkout"'),
  billingCheckoutSource.indexOf('router.post("/billing/portal"'),
);

describe("Stripe membership entitlement policy", () => {
  it("does not grant access from a Checkout completion alone", () => {
    expect(legacyCheckoutSource).toContain('res.status(410).json({');
    expect(legacyCheckoutSource).not.toContain("updateUserStripeInfo(user.id, { memberType, trialEndsAt })");
    expect(billingCheckoutOnly).not.toContain("memberType:");
    expect(billingCheckoutOnly).toContain("trial_period_days: MEMBERSHIP_TRIAL_DAYS");
    expect(billingCheckoutOnly).toContain('missing_payment_method: "cancel"');
    expect(billingCheckoutOnly).toContain('payment_method_collection: "if_required"');
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

  it("preserves paid, founder, beta, tester, and other paid-tier entitlements while expired access fails closed", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(getPersonalMembershipTier({ memberType: "navigator", stripeSubscriptionId: "sub_active" }, false)).toBe("navigator");
    expect(getPersonalMembershipTier({ memberType: "trailblazer", trialEndsAt: future }, false)).toBe("trailblazer");
    expect(getPersonalMembershipTier({ memberType: "community_builder", stripeSubscriptionId: "sub_business" }, false)).toBe("community_builder");
    expect(getPersonalMembershipTier({ memberType: "founding" }, false)).toBe("legacy_member");
    expect(getPersonalMembershipTier({ memberType: "beta" }, false)).toBe("legacy_member");
    expect(getPersonalMembershipTier({ memberType: "individual" }, true)).toBe("trailblazer");
    expect(getPersonalMembershipTier({ memberType: "navigator", trialEndsAt: past }, false)).toBe("free");
    expect(getPersonalMembershipTier({ memberType: "navigator" }, false)).toBe("free");
  });

  it("uses Stripe trialing events, not checkout redirects, for trial date and status displays", () => {
    expect(providerTrialEndsAt({ status: "trialing", trial_end: 1_800_000_000 })?.toISOString()).toBe("2027-01-15T08:00:00.000Z");
    expect(providerTrialEndsAt({ status: "active", trial_end: 1_800_000_000 })).toBeNull();
    expect(providerTrialEndsAt({ status: "trialing", trial_end: "1_800_000_000" })).toBeNull();
    expect(webhookSource).toContain("const trialEndsAt = providerTrialEndsAt(subscription);");
    expect(webhookSource).toContain("memberType: decision.plan, trialEndsAt })");
    expect(billingStatusSource).toContain("const membershipTier = await getUserTier(req.user.id);");
    expect(billingStatusSource).toContain("memberType: membershipTier");
    expect(membershipFamilySource).toContain("const tier = await getUserTier(userId);");
    expect(membershipFamilySource.match(/const tier = await getUserTier\(userId\);/g)).toHaveLength(3);
    expect(webBillingSource).toContain("billing?.hasSubscription && !billing?.trialActive");
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

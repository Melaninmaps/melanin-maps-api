/**
 * Membership access is granted only from a provider subscription that is
 * currently active or trialing. A Checkout redirect is never an entitlement.
 */
export const STRIPE_MEMBERSHIP_PLANS = ["navigator", "trailblazer"] as const;

export type StripeMembershipPlan = (typeof STRIPE_MEMBERSHIP_PLANS)[number];

export type MembershipSubscriptionDecision =
  | { action: "grant"; plan: StripeMembershipPlan }
  | { action: "revoke" };

type SubscriptionLike = {
  status?: unknown;
  metadata?: unknown;
};

export function isStripeMembershipPlan(value: unknown): value is StripeMembershipPlan {
  return typeof value === "string" && (STRIPE_MEMBERSHIP_PLANS as readonly string[]).includes(value);
}

export function isEntitlingStripeSubscriptionStatus(status: unknown): boolean {
  return status === "active" || status === "trialing";
}

function planFromMetadata(metadata: unknown): StripeMembershipPlan | null {
  if (!metadata || typeof metadata !== "object") return null;
  const planType = (metadata as Record<string, unknown>).planType;
  return isStripeMembershipPlan(planType) ? planType : null;
}

/**
 * Unsupported plans and every non-entitling Stripe state intentionally revoke
 * the stored subscription reference. This is fail-closed: a missing or stale
 * plan mapping cannot result in paid member access.
 */
export function decideMembershipSubscriptionEntitlement(
  subscription: SubscriptionLike,
): MembershipSubscriptionDecision {
  const plan = planFromMetadata(subscription.metadata);
  if (plan && isEntitlingStripeSubscriptionStatus(subscription.status)) {
    return { action: "grant", plan };
  }
  return { action: "revoke" };
}

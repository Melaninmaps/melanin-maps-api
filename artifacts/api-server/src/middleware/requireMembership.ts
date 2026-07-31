import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Internal tier identifiers — map to display names:
//   "free"              → Explorer (Free)
//   "navigator"         → Navigator ($7.99/mo)
//   "trailblazer"       → Trailblazer ($19.99/mo)
//   "community_builder" → Community Builder ($29.99/mo)
//   "legacy_member"     → Legacy Member ($79.99/mo)
export type MembershipTier = "free" | "navigator" | "trailblazer" | "community_builder" | "legacy_member";

export const TIER_DISPLAY: Record<MembershipTier, string> = {
  free: "Explorer",
  navigator: "Navigator",
  trailblazer: "Trailblazer",
  community_builder: "Community Builder",
  legacy_member: "Legacy Member",
};

export const TIER_RANK: Record<MembershipTier, number> = {
  free: 0,
  navigator: 1,
  trailblazer: 2,
  community_builder: 3,
  legacy_member: 4,
};

const PAID_TIERS: readonly string[] = ["navigator", "trailblazer", "community_builder", "legacy_member"];

function resolveFromMemberType(memberType: string | null | undefined): MembershipTier {
  if (memberType && PAID_TIERS.includes(memberType)) return memberType as MembershipTier;
  return "navigator"; // default for any active paid subscription
}

function getTier(user: Awaited<ReturnType<typeof storage.getUser>>): MembershipTier {
  if (!user) return "free";

  // ── TESTING_MODE: all authenticated users get Trailblazer during test phases ──
  // Set TESTING_MODE=true in Railway environment variables to enable.
  // Remove or set to "false" before production launch.
  if (process.env.TESTING_MODE === "true") return "trailblazer";

  const now = new Date();
  const trialActive = user.trialEndsAt && user.trialEndsAt > now;

  // Founding members and beta testers get top-tier access
  if (user.memberType === "founding" || user.memberType === "beta") return "legacy_member";

  // Active Stripe subscription OR RevenueCat subscription (stored as "rc_<productId>" in stripeSubscriptionId)
  if (user.stripeSubscriptionId) return resolveFromMemberType(user.memberType);

  // Active trial
  if (trialActive) return resolveFromMemberType(user.memberType);

  return "free";
}

/** True when the server is running in testing mode (all users get Trailblazer). */
export const TESTING_MODE = process.env.TESTING_MODE === "true";

/** Resolves the membership tier for any user ID. Use in route handlers for soft limit checks. */
export async function getUserTier(userId: string): Promise<MembershipTier> {
  const user = await storage.getUser(userId);
  return getTier(user);
}

export function requireMembership(minTier: MembershipTier = "navigator") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    const user = await storage.getUser(userId);
    const tier = getTier(user);

    if (TIER_RANK[tier] < TIER_RANK[minTier]) {
      res.status(403).json({
        error: `This feature requires a ${TIER_DISPLAY[minTier]} or higher membership.`,
        code: "MEMBERSHIP_REQUIRED",
        upgradeUrl: "/membership",
        currentTier: tier,
        currentTierDisplay: TIER_DISPLAY[tier],
        requiredTier: minTier,
        requiredTierDisplay: TIER_DISPLAY[minTier],
      });
      return;
    }

    next();
  };
}

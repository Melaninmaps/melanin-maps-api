import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Internal tier identifiers — map to display names:
//   "free"        → Community Member (Free)
//   "navigator"   → Explorer+
//   "trailblazer" → Navigator (top tier)
export type MembershipTier = "free" | "navigator" | "trailblazer";

export const TIER_DISPLAY: Record<MembershipTier, string> = {
  free: "Community Member",
  navigator: "Explorer+",
  trailblazer: "Navigator",
};

export const TIER_RANK: Record<MembershipTier, number> = { free: 0, navigator: 1, trailblazer: 2 };

function getTier(user: Awaited<ReturnType<typeof storage.getUser>>): MembershipTier {
  if (!user) return "free";

  const now = new Date();
  const trialActive = user.trialEndsAt && user.trialEndsAt > now;

  // Founding members and beta testers get top-tier access
  if (user.memberType === "founding" || user.memberType === "beta") return "trailblazer";

  // Active paid subscription — memberType determines which tier
  if (user.stripeSubscriptionId) {
    if (user.memberType === "trailblazer") return "trailblazer";
    return "navigator";
  }

  // Active trial — memberType determines which tier
  if (trialActive) {
    if (user.memberType === "trailblazer") return "trailblazer";
    return "navigator";
  }

  return "free";
}

/** Resolves the membership tier for any user ID. Use in route handlers for soft limit checks. */
export async function getUserTier(userId: string): Promise<MembershipTier> {
  const user = await storage.getUser(userId);
  return getTier(user);
}

export function requireMembership(minTier: "navigator" | "trailblazer" = "navigator") {
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
        error: minTier === "trailblazer"
          ? "This feature requires a Navigator membership."
          : "This feature requires an Explorer+ or higher membership.",
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

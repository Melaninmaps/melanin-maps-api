import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export type MembershipTier = "free" | "navigator" | "trailblazer";

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

    const tierRank: Record<MembershipTier, number> = { free: 0, navigator: 1, trailblazer: 2 };
    if (tierRank[tier] < tierRank[minTier]) {
      res.status(403).json({
        error: minTier === "trailblazer"
          ? "This feature requires a Trailblazer membership."
          : "This feature requires a Navigator or higher membership.",
        code: "MEMBERSHIP_REQUIRED",
        upgradeUrl: "/membership",
        currentTier: tier,
        requiredTier: minTier,
      });
      return;
    }

    next();
  };
}

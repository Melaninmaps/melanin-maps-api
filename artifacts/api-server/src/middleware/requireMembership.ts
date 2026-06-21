import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export type MembershipTier = "free" | "trial" | "paid";

function getTier(user: Awaited<ReturnType<typeof storage.getUser>>): MembershipTier {
  if (!user) return "free";

  const now = new Date();
  const trialActive = user.trialEndsAt && user.trialEndsAt > now;

  if (user.stripeSubscriptionId) return "paid";
  if (trialActive) return "trial";
  if (user.memberType === "founding" || user.memberType === "beta") return "paid";
  return "free";
}

export function requireMembership(minTier: "trial" | "paid" = "trial") {
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

    const tierRank: Record<MembershipTier, number> = { free: 0, trial: 1, paid: 2 };
    if (tierRank[tier] < tierRank[minTier]) {
      res.status(403).json({
        error: "This feature requires a Premium membership.",
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

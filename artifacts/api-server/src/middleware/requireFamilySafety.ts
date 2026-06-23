import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

const NAVIGATOR_TYPES = new Set(["navigator", "trailblazer", "founding", "beta"]);

export async function requireFamilySafety(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return;
  }

  const user = await storage.getUser(userId);
  if (!user) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return;
  }

  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const withinFreeTrial = accountAgeMs < SIX_MONTHS_MS;

  if (withinFreeTrial) {
    next();
    return;
  }

  const hasMembership =
    NAVIGATOR_TYPES.has(user.memberType ?? "") &&
    (!!user.stripeSubscriptionId ||
      user.memberType === "founding" ||
      user.memberType === "beta" ||
      (user.trialEndsAt != null && user.trialEndsAt > new Date()));

  if (hasMembership) {
    next();
    return;
  }

  res.status(403).json({
    error: "Family Safety features require a Navigator or higher membership after your first 6 months.",
    code: "MEMBERSHIP_REQUIRED",
    upgradeUrl: "/membership",
    requiredTier: "navigator",
  });
}

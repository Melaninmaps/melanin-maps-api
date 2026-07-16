import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// Maps RevenueCat product identifiers to our internal membership tier keys
const PRODUCT_TIER_MAP: Record<string, string> = {
  mwm_nav_monthly: "navigator",
  mwm_navigator_annual: "navigator",
  mwm_trailblazer_monthly: "trailblazer",
  mwm_trailblazer_annual: "trailblazer",
  mwm_community_builder_monthly: "community_builder",
  mwm_community_builder_annual: "community_builder",
  mwm_legacy_member_monthly: "legacy_member",
  mwm_legacy_member_annual: "legacy_member",
};

/**
 * POST /revenuecat/sync
 * Called by the iOS client after a successful RevenueCat purchase to persist
 * the user's new membership tier server-side. Uses stripeSubscriptionId field
 * (prefixed "rc_") to signal an active RevenueCat-managed subscription.
 */
router.post("/revenuecat/sync", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { productIdentifier } = req.body as { productIdentifier?: string };
  if (!productIdentifier) {
    res.status(400).json({ error: "productIdentifier is required" });
    return;
  }

  const tier = PRODUCT_TIER_MAP[productIdentifier];
  if (!tier) {
    req.log.warn({ productIdentifier }, "Unknown RevenueCat product identifier");
    res.status(400).json({ error: "Unknown product identifier" });
    return;
  }

  try {
    await pool.query(
      `UPDATE users SET member_type = $1, stripe_subscription_id = $2 WHERE id = $3`,
      [tier, `rc_${productIdentifier}`, userId]
    );
    req.log.info({ userId, productIdentifier, tier }, "RevenueCat purchase synced to DB");
    res.json({ ok: true, tier });
  } catch (err) {
    req.log.error({ err, userId, productIdentifier }, "Failed to sync RevenueCat purchase");
    res.status(500).json({ error: "Failed to sync purchase" });
  }
});

export default router;

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
 * Called by the mobile client after a successful RevenueCat purchase to persist
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

  const RC_API_KEY = process.env.REVENUECAT_API_KEY_V2 ?? process.env.REVENUECAT_API_KEY;
  if (!RC_API_KEY) {
    req.log.error({}, "RevenueCat API key not configured — sync blocked");
    res.status(503).json({ error: "Purchase verification temporarily unavailable. Please try again." });
    return;
  }

  try {
    const rcRes = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(String(userId))}`,
      { headers: { Authorization: `Bearer ${RC_API_KEY}`, "Content-Type": "application/json" } }
    );
    if (!rcRes.ok) {
      req.log.error({ rcStatus: rcRes.status, userId, productIdentifier }, "RevenueCat API error — failing closed");
      res.status(503).json({ error: "Purchase verification temporarily unavailable. Please try again." });
      return;
    }
    const rcData = await rcRes.json() as {
      subscriber?: { entitlements?: Record<string, { product_identifier?: string; expires_date?: string | null }> };
    };
    const entitlements = rcData.subscriber?.entitlements ?? {};
    const now = new Date();
    const verified = Object.values(entitlements).some(
      (ent) => ent.product_identifier === productIdentifier &&
        (ent.expires_date == null || new Date(ent.expires_date) > now)
    );
    if (!verified) {
      req.log.warn({ userId, productIdentifier }, "RevenueCat verification failed — no active entitlement");
      res.status(403).json({ error: "Purchase could not be verified. Please restore purchases or contact support." });
      return;
    }
  } catch (rcErr) {
    req.log.error({ rcErr, userId, productIdentifier }, "RevenueCat verification network error — failing closed");
    res.status(503).json({ error: "Purchase verification temporarily unavailable. Please try again later." });
    return;
  }

  try {
    await pool.query(
      `UPDATE users SET member_type = $1, stripe_subscription_id = $2 WHERE id = $3`,
      [tier, `rc_${productIdentifier}`, userId]
    );
    req.log.info({ userId, productIdentifier, tier }, "RevenueCat purchase synced to DB — server-verified");
    res.json({ ok: true, tier });
  } catch (err) {
    req.log.error({ err, userId, productIdentifier }, "Failed to sync RevenueCat purchase");
    res.status(500).json({ error: "Failed to sync purchase" });
  }
});

/**
 * POST /revenuecat/webhook
 * Receives lifecycle events from RevenueCat (renewal, cancellation, expiration,
 * refund). Authenticated via shared secret in Authorization header — must match
 * REVENUECAT_WEBHOOK_AUTH_KEY configured in the RevenueCat dashboard.
 *
 * Register this URL in the RC dashboard:
 *   https://<railway-domain>/api/revenuecat/webhook
 * Authorization header value: <REVENUECAT_WEBHOOK_AUTH_KEY>
 */
router.post("/revenuecat/webhook", async (req: Request, res: Response) => {
  const authKey = process.env.REVENUECAT_WEBHOOK_AUTH_KEY;
  if (authKey) {
    const incomingAuth = req.headers["authorization"] ?? "";
    if (incomingAuth !== authKey) {
      req.log.warn({}, "RevenueCat webhook: unauthorized request — auth header mismatch");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } else {
    req.log.warn({}, "REVENUECAT_WEBHOOK_AUTH_KEY not set — webhook auth disabled (set it in production)");
  }

  const body = req.body as {
    event?: {
      type?: string;
      app_user_id?: string;
      product_id?: string;
      environment?: string;
    };
    api_version?: string;
  };

  const event = body?.event;
  if (!event?.type || !event?.app_user_id) {
    req.log.warn({ body }, "RevenueCat webhook: missing event type or app_user_id");
    res.status(400).json({ error: "Missing event type or app_user_id" });
    return;
  }

  const appUserId = event.app_user_id;
  const productId = event.product_id ?? "";
  const eventType = event.type;
  const env = event.environment ?? "PRODUCTION";

  req.log.info({ eventType, appUserId, productId, env }, "RevenueCat webhook received");

  // Only process production events — ignore sandbox
  if (env !== "PRODUCTION") {
    req.log.info({ eventType, env }, "RevenueCat webhook: ignoring non-production event");
    res.json({ ok: true, ignored: true });
    return;
  }

  try {
    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION": {
        const tier = PRODUCT_TIER_MAP[productId];
        if (!tier) {
          req.log.warn({ productId, eventType }, "RevenueCat webhook: unknown product ID — skipping DB update");
          break;
        }
        await pool.query(
          `UPDATE users SET member_type = $1, stripe_subscription_id = $2 WHERE id = $3`,
          [tier, `rc_${productId}`, appUserId]
        );
        req.log.info({ appUserId, productId, tier, eventType }, "RevenueCat webhook: entitlement granted/renewed");
        break;
      }

      case "CANCELLATION": {
        // Access remains until expiration — mark cancellation intent but keep tier active
        req.log.info({ appUserId, productId, eventType }, "RevenueCat webhook: subscription cancelled — access remains until expiry");
        break;
      }

      case "EXPIRATION":
      case "REFUND":
      case "BILLING_ISSUE": {
        // Remove entitlement — access ends
        await pool.query(
          `UPDATE users SET member_type = NULL, stripe_subscription_id = NULL WHERE id = $1 AND stripe_subscription_id LIKE 'rc_%'`,
          [appUserId]
        );
        req.log.info({ appUserId, productId, eventType }, "RevenueCat webhook: entitlement revoked");
        break;
      }

      case "PRODUCT_CHANGE": {
        const newTier = PRODUCT_TIER_MAP[productId];
        if (newTier) {
          await pool.query(
            `UPDATE users SET member_type = $1, stripe_subscription_id = $2 WHERE id = $3`,
            [newTier, `rc_${productId}`, appUserId]
          );
          req.log.info({ appUserId, productId, newTier }, "RevenueCat webhook: product changed");
        }
        break;
      }

      default:
        req.log.info({ eventType, appUserId }, "RevenueCat webhook: unhandled event type — acknowledged");
    }
  } catch (err) {
    req.log.error({ err, eventType, appUserId }, "RevenueCat webhook: DB update failed");
    res.status(500).json({ error: "Webhook processing failed" });
    return;
  }

  res.json({ ok: true });
});

export default router;

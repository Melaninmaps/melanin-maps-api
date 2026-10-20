import { Router, type Request, type Response } from "express";

const router = Router();

const REVENUECAT_DISABLED_RESPONSE = {
  code: "REVENUECAT_DISABLED",
  error: "RevenueCat purchases and restores are currently unavailable.",
} as const;

/**
 * RevenueCat is intentionally disabled. This responder must stay before any
 * request, environment, provider, database, or logging operation.
 */
function revenueCatDisabled(_req: Request, res: Response): void {
  res.status(409).json(REVENUECAT_DISABLED_RESPONSE);
}

router.post("/revenuecat/sync", revenueCatDisabled);
router.post("/revenuecat/webhook", revenueCatDisabled);

export default router;

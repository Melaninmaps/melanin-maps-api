import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

/**
 * Legacy activity/proximity alerts are intentionally inert. They are kept as
 * explicit 410 guards so stale clients cannot submit, confirm, clear, query,
 * or mutate location-linked alert records. Safety uses member-selected city
 * aggregates and the separately governed Police/ICE opt-in flow instead.
 */
function retiredLegacyAlertRoute(_req: Request, res: Response): void {
  res.status(410).json({
    error: "Legacy community safety alerts have been retired. Safety does not accept or display proximity, current activity, or location-linked alerts.",
  });
}

router.use("/community-alerts", retiredLegacyAlertRoute);

export default router;

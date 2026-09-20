import { Router, type IRouter, type Request, type Response } from "express";
import { listRecentOfficialPublicAlerts } from "../alerts/officialPublicAlerts";

const router: IRouter = Router();

/**
 * Member-only reading surface for the same official notices that may appear in
 * a member's notification center. The route never infers health status and
 * does not expose subscription choices for another user.
 */
router.get("/official-public-alerts", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const requested = Number(req.query.limit ?? 30);
  try {
    const alerts = await listRecentOfficialPublicAlerts(Number.isFinite(requested) ? requested : 30);
    res.json({
      alerts,
      disclaimer: "Official source notices only. They are not medical advice, diagnosis, or emergency guidance.",
    });
  } catch (error) {
    req.log.error({ error }, "Failed to list official public alerts");
    res.status(500).json({ error: "Unable to load official public alerts." });
  }
});

export default router;

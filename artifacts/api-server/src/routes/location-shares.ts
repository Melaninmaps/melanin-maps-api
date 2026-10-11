import { Router, type IRouter, type Request, type Response } from "express";
import { retireLocationSharesForMember } from "../safety/retireLiveLocationSharing";

/**
 * Live member location sharing is retired.
 *
 * Safety Check-Ins, trusted safety contacts, and reviewed community safety
 * reports remain separate features. They must never be interpreted as current
 * member-location sharing, visit history, or a presence map.
 */
export const LIVE_LOCATION_SHARING_RETIRED = "Live location sharing is not available. Safety Check-Ins remain private by default and do not share a member's current or recent location.";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function retired(res: Response): void {
  res.status(410).json({
    error: LIVE_LOCATION_SHARING_RETIRED,
    code: "live_location_sharing_retired",
  });
}

// Legacy owner list: authenticate, erase any retained active coordinates for
// that owner, then make the capability unavailable.
router.get("/safety/location-shares", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await retireLocationSharesForMember(userId);
    retired(res);
  } catch (err) {
    req.log.error({ err }, "GET /safety/location-shares retirement cleanup error");
    res.status(503).json({ error: "Unable to complete location-sharing retirement cleanup" });
  }
});

// Legacy creation, update, and stop routes are retained only to fail closed for
// old clients. No request body is read and no coordinate is accepted.
router.post("/safety/location-shares", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await retireLocationSharesForMember(userId);
    retired(res);
  } catch (err) {
    req.log.error({ err }, "POST /safety/location-shares retirement cleanup error");
    res.status(503).json({ error: "Unable to complete location-sharing retirement cleanup" });
  }
});

router.patch("/safety/location-shares/:token/update", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await retireLocationSharesForMember(userId);
    retired(res);
  } catch (err) {
    req.log.error({ err }, "PATCH /safety/location-shares retirement cleanup error");
    res.status(503).json({ error: "Unable to complete location-sharing retirement cleanup" });
  }
});

// Deliberately do not query by token. Old links always receive the identical
// retirement response and cannot reveal whether an old share ever existed.
router.get("/safety/location-shares/:token/view", (_req: Request, res: Response) => {
  retired(res);
});

router.delete("/safety/location-shares/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await retireLocationSharesForMember(userId);
    retired(res);
  } catch (err) {
    req.log.error({ err }, "DELETE /safety/location-shares retirement cleanup error");
    res.status(503).json({ error: "Unable to complete location-sharing retirement cleanup" });
  }
});

export default router;

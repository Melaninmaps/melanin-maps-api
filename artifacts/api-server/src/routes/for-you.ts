import { Router, type Request, type Response } from "express";
import { getInterestIntelligenceForMember } from "../kinfolk/interest-intelligence-service";

const router = Router();

/**
 * Compatibility endpoint for older native clients. It now exposes the same
 * governed interest recommendations as the current `interest-intelligence`
 * endpoint rather than asking a model to improvise from private activity.
 */
router.get("/ai/for-you", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const payload = await getInterestIntelligenceForMember(userId);
    const suggestions = payload.recommendations.map((recommendation) => ({
      id: recommendation.id,
      icon: recommendation.resourceType === "event" ? "📅" : "✦",
      title: recommendation.resource.title,
      insight: recommendation.reason,
      category: recommendation.resourceType === "event" ? "community" : "discover",
      resourceType: recommendation.resourceType,
      resource: recommendation.resource,
      actions: recommendation.actions,
    }));
    res.set("Cache-Control", "no-store");
    res.json({
      suggestions,
      settings: payload.settings,
      disclosure: payload.disclosure,
      automaticallyChangesInterestProfile: false,
    });
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "GET /ai/for-you unavailable");
    res.status(503).json({ error: "For You recommendations are temporarily unavailable." });
  }
});

export default router;

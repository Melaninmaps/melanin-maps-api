import { Router, type Request, type Response } from "express";
import {
  getCommunityIntelligenceGaps,
  getCommunityIntelligencePreference,
  recordCommunityIntelligenceFeedback,
  setCommunityIntelligenceParticipation,
} from "../services/community-intelligence/service";
import {
  getCommunitySuggestionById,
  isCommunitySuggestionAction,
} from "../services/community-intelligence/policy";

const router = Router();

function isFounderAdmin(req: Request): boolean {
  return req.user?.role === "admin";
}

router.get("/kinfolk/community-intelligence/settings", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  try {
    const preference = await getCommunityIntelligencePreference(req.user.id);
    return void res.json(preference);
  } catch (error) {
    req.log.error({ error }, "Community Intelligence settings unavailable");
    return void res.status(503).json({ error: "COMMUNITY_INTELLIGENCE_SETTINGS_UNAVAILABLE" });
  }
});

router.put("/kinfolk/community-intelligence/settings", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  const participationEnabled = req.body?.participationEnabled;
  if (typeof participationEnabled !== "boolean") {
    return void res.status(400).json({ error: "participationEnabled must be a boolean" });
  }
  try {
    const preference = await setCommunityIntelligenceParticipation(req.user.id, participationEnabled);
    return void res.json(preference);
  } catch (error) {
    req.log.error({ error }, "Community Intelligence preference update failed");
    return void res.status(503).json({ error: "COMMUNITY_INTELLIGENCE_SETTINGS_UNAVAILABLE" });
  }
});

router.post("/kinfolk/community-intelligence/feedback", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  const suggestion = getCommunitySuggestionById(req.body?.suggestionId);
  const action = req.body?.action;
  if (!suggestion || !isCommunitySuggestionAction(action)) {
    return void res.status(400).json({ error: "A valid suggestion and action are required" });
  }
  try {
    const result = await recordCommunityIntelligenceFeedback({
      userId: req.user.id,
      journeyType: suggestion.journeyType,
      stage: suggestion.stage,
      intent: suggestion.intent,
      categoryKey: suggestion.categoryKey,
      action,
    });
    return void res.json({ ok: true, ...result });
  } catch (error) {
    req.log.error({ error }, "Community Intelligence feedback save failed");
    return void res.status(503).json({ error: "COMMUNITY_INTELLIGENCE_FEEDBACK_UNAVAILABLE" });
  }
});

router.get("/admin/community-intelligence/gaps", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  if (!isFounderAdmin(req)) return void res.status(403).json({ error: "Administrator access required" });
  try {
    const gaps = await getCommunityIntelligenceGaps();
    return void res.json({
      gaps,
      coverage: "Only categories that pass privacy suppression are returned. No member, message, raw event, exact location, or small-cohort count is included.",
    });
  } catch (error) {
    req.log.error({ error }, "Community Intelligence founder aggregate unavailable");
    return void res.status(503).json({ error: "COMMUNITY_INTELLIGENCE_GAPS_UNAVAILABLE" });
  }
});

export default router;

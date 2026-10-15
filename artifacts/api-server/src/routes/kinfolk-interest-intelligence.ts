import { Router, type Request, type Response } from "express";
import {
  createExplicitInterest,
  deleteInterest,
  getCircleInterestRecommendations,
  getInterestIntelligenceForMember,
  isSafeInterestCategory,
  recordRecommendationFeedback,
  shareConfirmedInterestWithCircle,
  updateInterestSettings,
  updateInterestState,
  type InterestState,
  type RecommendationFeedback,
} from "../kinfolk/interest-intelligence-service";
import { ensureKinfolkInterestIntelligenceSchema } from "../lib/startup-migrations";

const router = Router();
const STATES: readonly InterestState[] = ["tentative", "confirmed", "paused", "dismissed"];
const FEEDBACK: readonly RecommendationFeedback[] = ["interested", "not_interested", "hide"];

function userId(req: Request): string | null {
  return typeof req.user?.id === "string" && req.user.id ? req.user.id : null;
}

function requireMember(req: Request, res: Response): string | null {
  const id = userId(req);
  if (!id) res.status(401).json({ error: "Authentication required" });
  return id;
}

function interestId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
  const id = Number.parseInt(raw, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function unavailable(res: Response): void {
  res.status(503).json({
    error: "Kinfolk interest controls are temporarily unavailable.",
    code: "KINFOLK_INTEREST_INTELLIGENCE_UNAVAILABLE",
  });
}

// Explicit feature-release deployments may intentionally skip the broad
// startup runner. Establish this exact, additive schema before the member
// surface accepts a read or write; this creates no member data by itself.
router.use(async (req: Request, res: Response, next) => {
  try {
    await ensureKinfolkInterestIntelligenceSchema();
    next();
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk interest schema unavailable");
    unavailable(res);
  }
});

// GET /api/kinfolk/interest-intelligence
// One member-controlled feed: explicit evidence + governed recommendations.
router.get("/kinfolk/interest-intelligence", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  if (!id) return;
  try {
    const payload = await getInterestIntelligenceForMember(id);
    res.set("Cache-Control", "no-store");
    res.json(payload);
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk interest intelligence unavailable");
    unavailable(res);
  }
});

// PUT /api/kinfolk/interest-intelligence/settings
// Every behavioural or proactive capability defaults to off and requires a
// member-selected boolean. No setting copies private memories or chat history.
router.put("/kinfolk/interest-intelligence/settings", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  if (!id) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const allowedKeys = ["interestRecognitionEnabled", "proactiveDiscoveryEnabled", "interestNotificationsEnabled"];
  if (!allowedKeys.some((key) => Object.prototype.hasOwnProperty.call(body, key)) || allowedKeys.some((key) => body[key] !== undefined && typeof body[key] !== "boolean")) {
    res.status(400).json({ error: "Provide one or more boolean interest settings." });
    return;
  }
  try {
    const settings = await updateInterestSettings(id, body);
    res.set("Cache-Control", "no-store");
    res.json({ settings });
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk interest settings unavailable");
    unavailable(res);
  }
});

// POST /api/kinfolk/interest-intelligence/interests
// A manual save is always explicit consent and becomes immediately confirmed.
router.post("/kinfolk/interest-intelligence/interests", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  if (!id) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  if (typeof body.label !== "string" || body.label.length > 100 || !isSafeInterestCategory(body.category)) {
    res.status(400).json({ error: "Choose a non-sensitive interest label and a supported category." });
    return;
  }
  try {
    const interest = await createExplicitInterest({ userId: id, label: body.label, category: body.category });
    res.status(201).json({ interest });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_NON_SENSITIVE_INTEREST") {
      res.status(400).json({ error: "That interest cannot be stored here. Add only a broad, non-sensitive interest you want to manage." });
      return;
    }
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk explicit interest unavailable");
    unavailable(res);
  }
});

router.patch("/kinfolk/interest-intelligence/interests/:interestId", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  const parsedInterestId = interestId(req.params.interestId);
  if (!id) return;
  if (!parsedInterestId) { res.status(400).json({ error: "Invalid interest id." }); return; }
  const state = (req.body as { state?: unknown } | undefined)?.state;
  if (typeof state !== "string" || !(STATES as readonly string[]).includes(state)) {
    res.status(400).json({ error: "Choose confirm, pause, restore, or dismiss state." });
    return;
  }
  try {
    const interest = await updateInterestState({ userId: id, interestId: parsedInterestId, state: state as InterestState });
    if (!interest) { res.status(404).json({ error: "Interest not found." }); return; }
    res.json({ interest });
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk interest update unavailable");
    unavailable(res);
  }
});

router.delete("/kinfolk/interest-intelligence/interests/:interestId", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  const parsedInterestId = interestId(req.params.interestId);
  if (!id) return;
  if (!parsedInterestId) { res.status(400).json({ error: "Invalid interest id." }); return; }
  try {
    const deleted = await deleteInterest(id, parsedInterestId);
    if (!deleted) { res.status(404).json({ error: "Interest not found." }); return; }
    res.status(204).send();
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk interest deletion unavailable");
    unavailable(res);
  }
});

// POST /api/kinfolk/interest-intelligence/recommendations/:recommendationId/feedback
// A dismissal affects that shown recommendation only; it cannot create a profile
// inference or modify a broader preference without a separate explicit save.
router.post("/kinfolk/interest-intelligence/recommendations/:recommendationId/feedback", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  const recommendationId = interestId(req.params.recommendationId);
  if (!id) return;
  if (!recommendationId) { res.status(400).json({ error: "Invalid recommendation id." }); return; }
  const feedback = (req.body as { feedback?: unknown } | undefined)?.feedback;
  if (typeof feedback !== "string" || !(FEEDBACK as readonly string[]).includes(feedback)) {
    res.status(400).json({ error: "Choose interested, not interested, or hide." });
    return;
  }
  try {
    const found = await recordRecommendationFeedback({ userId: id, recommendationId, feedback: feedback as RecommendationFeedback });
    if (!found) { res.status(404).json({ error: "Recommendation not found." }); return; }
    res.json({ ok: true, automaticallyChangesInterestProfile: false });
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk recommendation feedback unavailable");
    unavailable(res);
  }
});

// Explicit Circle sharing routes. They disclose neither a member identity nor
// any unshared interest, save, search, profile, or private-memory information.
router.post("/kinfolk/circles/:circleId/interests/:interestId/share", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  const circleId = interestId(req.params.circleId);
  const parsedInterestId = interestId(req.params.interestId);
  if (!id) return;
  if (!circleId || !parsedInterestId) { res.status(400).json({ error: "Invalid Circle or interest id." }); return; }
  try {
    const outcome = await shareConfirmedInterestWithCircle({ userId: id, circleId, interestId: parsedInterestId });
    if (outcome === "not_member") { res.status(403).json({ error: "Circle membership is required." }); return; }
    if (outcome === "missing") { res.status(404).json({ error: "Interest not found." }); return; }
    if (outcome === "not_shareable") { res.status(409).json({ error: "Confirm a non-temporary interest before sharing it with a Circle." }); return; }
    res.status(201).json({ ok: true, sharing: "interest_only", automaticSharing: false });
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk Circle interest share unavailable");
    unavailable(res);
  }
});

router.get("/kinfolk/circles/:circleId/recommendations", async (req: Request, res: Response) => {
  const id = requireMember(req, res);
  const circleId = interestId(req.params.circleId);
  if (!id) return;
  if (!circleId) { res.status(400).json({ error: "Invalid Circle id." }); return; }
  try {
    const result = await getCircleInterestRecommendations({ userId: id, circleId });
    if (!result.authorized) { res.status(403).json({ error: "Circle membership is required." }); return; }
    res.set("Cache-Control", "no-store");
    res.json({ recommendations: result.recommendations, disclosure: "Only interests each member deliberately shared with this Circle were considered. No profile, save, review, search, or private activity was used." });
  } catch (error) {
    req.log.error({ errorName: error instanceof Error ? error.name : "unknown" }, "Kinfolk Circle recommendations unavailable");
    unavailable(res);
  }
});

export default router;

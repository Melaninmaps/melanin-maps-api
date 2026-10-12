import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, neighborhoodSurveysTable } from "@workspace/db";
import { surveyLimiter } from "../middleware/rateLimiter";
import { requireTrust } from "../middleware/requireTrust";
import { sendNominationAlert } from "../lib/email.js";
import { invalidateSafetyHeatmapCache } from "../safety/safetyHeatCache";

const router: IRouter = Router();

const ATMOSPHERE_SCORES: Record<string, number> = {
  very_welcoming: 5,
  mostly_welcoming: 4,
  neutral: 3,
  slightly_unwelcoming: 2,
  uncomfortable: 1,
};

function computeScores(daytime: number, nighttime: number, atmosphereId: string): { safety: number; community: number } {
  const s = (v: number) => (v / 5) * 100;
  const safety = Math.round(s(daytime) * 0.5 + s(nighttime) * 0.5);
  const atm = ATMOSPHERE_SCORES[atmosphereId] ?? 3;
  const community = Math.round(s(atm));
  return { safety, community };
}

function readCity(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const city = value.trim();
  return city && city.length <= 120 ? city : null;
}

function includesDisallowedPreciseLocation(input: Record<string, unknown>): boolean {
  return ["latitude", "longitude", "lat", "lng", "coordinates", "location"]
    .some((key) => input[key] !== undefined && input[key] !== null && input[key] !== "");
}

/**
 * A member may voluntarily contribute a city-level experience signal. This route
 * deliberately neither reads device location nor stores a neighborhood, street,
 * coordinate, or member-activity history. Only rows with the explicit consent
 * timestamp are eligible for delayed, thresholded aggregates.
 */
router.post("/surveys", surveyLimiter, requireTrust, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const {
    visitPurpose,
    visitFreq,
    daytimeSafety,
    nighttimeSafety,
    atmosphere,
    policeVisibility,
    policeImpact,
    communityRating,
    culturallyConnected,
    linkedBusinessId,
    nomination,
    accessibility,
    tips,
    comments,
    communityIntelligenceConsent,
  } = body;
  const city = readCity(body.city);

  if (!city || !visitPurpose || !daytimeSafety || !nighttimeSafety || !atmosphere) {
    res.status(400).json({ error: "city, visitPurpose, daytimeSafety, nighttimeSafety, and atmosphere are required" });
    return;
  }
  if (communityIntelligenceConsent !== true) {
    res.status(400).json({ error: "Explicit Community Intelligence consent is required" });
    return;
  }
  if (includesDisallowedPreciseLocation(body) || (typeof body.neighborhood === "string" && body.neighborhood.trim())) {
    res.status(400).json({ error: "Community Intelligence accepts a member-selected city only; do not send neighborhood or precise location data" });
    return;
  }

  for (const [key, val] of [["daytimeSafety", daytimeSafety], ["nighttimeSafety", nighttimeSafety]] as [string, unknown][]) {
    const n = Number(val);
    if (Number.isNaN(n) || n < 1 || n > 5) {
      res.status(400).json({ error: `${key} must be a number between 1 and 5` });
      return;
    }
  }

  const safeNum = (v: unknown): number => Math.round(Number(v));
  const scores = computeScores(safeNum(daytimeSafety), safeNum(nighttimeSafety), atmosphere as string);
  const nom = nomination as { name?: string; category?: string; socialLink?: string } | undefined;

  try {
    const [survey] = await db
      .insert(neighborhoodSurveysTable)
      .values({
        userId: req.user?.id ?? null,
        city,
        neighborhood: null,
        visitPurpose: visitPurpose as string,
        visitFreq: (visitFreq as string | undefined) ?? null,
        daytimeSafety: safeNum(daytimeSafety),
        nighttimeSafety: safeNum(nighttimeSafety),
        atmosphere: atmosphere as string,
        policeVisibility: (policeVisibility as string | undefined) ?? null,
        policeImpact: (policeImpact as string | undefined) ?? null,
        communityRating: communityRating != null ? safeNum(communityRating) : null,
        culturallyConnected: (culturallyConnected as string | undefined) ?? null,
        linkedBusinessId: (linkedBusinessId as string | undefined) ?? null,
        nominationName: nom?.name ?? null,
        nominationCategory: nom?.category ?? null,
        nominationSocialLink: nom?.socialLink ?? null,
        accessibility: (accessibility as string[] | undefined) ?? [],
        tips: (tips as string[] | undefined) ?? [],
        comments: (comments as string | undefined) ?? null,
        safetyScore: scores.safety,
        communityScore: scores.community,
        walkabilityScore: 0,
        communityIntelligenceConsentAt: new Date(),
      })
      .returning({ id: neighborhoodSurveysTable.id });

    if (nom?.name) {
      sendNominationAlert({
        nominationName: nom.name,
        nominationCategory: nom.category,
        nominationSocialLink: nom.socialLink,
        city,
      }).catch(() => {});
    }

    // Derived aggregates are invalidated only. This neither sends an alert nor
    // modifies or deletes a source survey.
    invalidateSafetyHeatmapCache();
    res.status(201).json({ survey, scores });
  } catch (err) {
    req.log.error({ err }, "Failed to submit survey");
    res.status(500).json({ error: "Failed to submit survey" });
  }
});

/**
 * Individual survey rows, comments, neighborhoods, and timestamps are private.
 * Client applications must use the thresholded /api/safety/heatmap endpoints.
 */
router.get("/surveys", requireTrust, (_req: Request, res: Response) => {
  res.status(410).json({
    error: "Individual Community Intelligence survey records are private. Use the protected city aggregate endpoint.",
    dataStatus: "individual_responses_private",
  });
});

// ─── POST /surveys/welcome ───────────────────────────────────────────────────
router.post("/surveys/welcome", surveyLimiter, requireTrust, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const welcomeRating = Number(body.welcomeRating);
  const city = readCity(body.city);
  const communityIntelligenceConsent = body.communityIntelligenceConsent;

  if (!welcomeRating || welcomeRating < 1 || welcomeRating > 5) {
    res.status(400).json({ error: "welcomeRating must be 1–5" });
    return;
  }
  if (!city) {
    res.status(400).json({ error: "A member-selected city is required" });
    return;
  }
  if (communityIntelligenceConsent !== true) {
    res.status(400).json({ error: "Explicit Community Intelligence consent is required" });
    return;
  }
  if (includesDisallowedPreciseLocation(body) || (typeof body.neighborhood === "string" && body.neighborhood.trim())) {
    res.status(400).json({ error: "Community Intelligence accepts a member-selected city only; do not send neighborhood or precise location data" });
    return;
  }

  try {
    const communityScore = Math.round(((welcomeRating - 1) / 4) * 100);
    const [survey] = await db
      .insert(neighborhoodSurveysTable)
      .values({
        userId: req.user?.id ?? null,
        city,
        neighborhood: null,
        visitPurpose: "community_rating",
        daytimeSafety: welcomeRating,
        nighttimeSafety: welcomeRating,
        atmosphere: welcomeRating >= 4 ? "very_welcoming" : welcomeRating === 3 ? "neutral" : "uncomfortable",
        safetyScore: communityScore,
        communityScore,
        walkabilityScore: 0,
        communityIntelligenceConsentAt: new Date(),
      })
      .returning({ id: neighborhoodSurveysTable.id });

    invalidateSafetyHeatmapCache();
    res.status(201).json({ survey, communityScore });
  } catch (err) {
    req.log.error({ err }, "POST /surveys/welcome error");
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

// ─── PATCH /surveys/:id ──────────────────────────────────────────────────────
router.patch("/surveys/:id", requireTrust, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { whatStoodOut, comments } = req.body as { whatStoodOut?: string[]; comments?: string };
  try {
    await pool.query(
      `UPDATE neighborhood_surveys SET
         what_stood_out = COALESCE($1::text[], what_stood_out),
         comments       = COALESCE($2, comments)
       WHERE id = $3 AND user_id = $4`,
      [whatStoodOut?.length ? whatStoodOut : null, comments ?? null, id, req.user?.id]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /surveys/:id error");
    res.status(500).json({ error: "Failed to update" });
  }
});

export default router;

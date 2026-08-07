import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, neighborhoodSurveysTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { surveyLimiter } from "../middleware/rateLimiter";
import { requireTrust } from "../middleware/requireTrust";
import { sendNominationAlert } from "../lib/email.js";
import { sendSafetyReportPushForCity } from "../lib/pushNotifications";

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

router.post("/surveys", surveyLimiter, requireTrust, async (req: Request, res: Response) => {
  const {
    city,
    neighborhood,
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
  } = req.body as Record<string, unknown>;

  if (!city || !visitPurpose || !daytimeSafety || !nighttimeSafety || !atmosphere) {
    res.status(400).json({ error: "city, visitPurpose, daytimeSafety, nighttimeSafety, and atmosphere are required" });
    return;
  }

  for (const [key, val] of [["daytimeSafety", daytimeSafety], ["nighttimeSafety", nighttimeSafety]] as [string, unknown][]) {
    const n = Number(val);
    if (isNaN(n) || n < 1 || n > 5) {
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
        city: city as string,
        neighborhood: (neighborhood as string | undefined) ?? null,
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
      })
      .returning();

    if (nom?.name) {
      sendNominationAlert({
        nominationName: nom.name,
        nominationCategory: nom.category,
        nominationSocialLink: nom.socialLink,
        city: city as string,
        neighborhood: neighborhood as string | undefined,
      }).catch(() => {});
    }

    // Push alert to community members in this city about the new safety report
    void sendSafetyReportPushForCity(city as string);

    res.status(201).json({ survey, scores });
  } catch (err) {
    req.log.error({ err }, "Failed to submit survey");
    res.status(500).json({ error: "Failed to submit survey" });
  }
});

router.get("/surveys", async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    const surveys = city && typeof city === "string"
      ? await db
          .select()
          .from(neighborhoodSurveysTable)
          .where(eq(neighborhoodSurveysTable.city, city))
          .orderBy(desc(neighborhoodSurveysTable.createdAt))
          .limit(50)
      : await db
          .select()
          .from(neighborhoodSurveysTable)
          .orderBy(desc(neighborhoodSurveysTable.createdAt))
          .limit(50);

    res.json({ surveys });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch surveys");
    res.status(500).json({ error: "Failed to fetch surveys" });
  }
});

// ─── POST /surveys/welcome ───────────────────────────────────────────────────
// One-tap welcome rating (B4). welcome_rating alone is a complete, published record.
router.post("/surveys/welcome", async (req: Request, res: Response) => {
  const { welcomeRating, city, neighborhood, whatStoodOut, comments } = req.body as {
    welcomeRating?: number;
    city?: string;
    neighborhood?: string;
    whatStoodOut?: string[];
    comments?: string;
  };

  if (!welcomeRating || welcomeRating < 1 || welcomeRating > 5) {
    res.status(400).json({ error: "welcomeRating must be 1–5" });
    return;
  }

  try {
    // Map 1-5 welcome rating to community_score 0-100
    const communityScore = Math.round(((welcomeRating - 1) / 4) * 100);

    const [survey] = await db
      .insert(neighborhoodSurveysTable)
      .values({
        userId: req.user?.id ?? null,
        city: city ?? "Unknown",
        neighborhood: neighborhood ?? null,
        visitPurpose: "community_rating",
        daytimeSafety: welcomeRating,
        nighttimeSafety: welcomeRating,
        atmosphere: welcomeRating >= 4 ? "very_welcoming" : welcomeRating === 3 ? "neutral" : "uncomfortable",
        safetyScore: communityScore,
        communityScore,
        walkabilityScore: 0,
        comments: comments ?? null,
        accessibility: whatStoodOut ?? [],
      })
      .returning();

    // Persist welcome_rating + what_stood_out in new columns
    await pool.query(
      `UPDATE neighborhood_surveys SET
         welcome_rating = $1,
         what_stood_out = $2::text[]
       WHERE id = $3`,
      [welcomeRating, whatStoodOut?.length ? whatStoodOut : null, survey.id]
    );

    res.status(201).json({ survey, communityScore });
  } catch (err) {
    req.log.error({ err }, "POST /surveys/welcome error");
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

// ─── PATCH /surveys/:id ──────────────────────────────────────────────────────
router.patch("/surveys/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { whatStoodOut, comments } = req.body as { whatStoodOut?: string[]; comments?: string };
  try {
    await pool.query(
      `UPDATE neighborhood_surveys SET
         what_stood_out = COALESCE($1::text[], what_stood_out),
         comments       = COALESCE($2, comments)
       WHERE id = $3 AND user_id = $4`,
      [whatStoodOut?.length ? whatStoodOut : null, comments ?? null, id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /surveys/:id error");
    res.status(500).json({ error: "Failed to update" });
  }
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, neighborhoodSurveysTable } from "@workspace/db";
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

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, neighborhoodSurveysTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { surveyLimiter } from "../middleware/rateLimiter";
import { requireMembership } from "../middleware/requireMembership";
import { requireTrust } from "../middleware/requireTrust";

const router: IRouter = Router();

const ATMOSPHERE_SCORES: Record<string, number> = {
  very_welcoming: 5,
  mostly_welcoming: 4,
  neutral: 3,
  slightly_unwelcoming: 2,
  uncomfortable: 1,
};

function computeScores(
  daytime: number,
  nighttime: number,
  walkability: number | null,
  transit: number | null,
  atmosphereId: string,
): { safety: number; community: number; walk: number } {
  const s = (v: number) => (v / 5) * 100;
  const atm = ATMOSPHERE_SCORES[atmosphereId] ?? 3;
  const safety = Math.round(
    s(daytime) * 0.3 +
      s(nighttime) * 0.4 +
      s(walkability ?? 0) * 0.2 +
      s(transit ?? 0) * 0.1,
  );
  const community = Math.round(s(atm));
  const walk = walkability
    ? Math.round(s(walkability) * 0.7 + s(transit ?? 0) * 0.3)
    : 0;
  return { safety, community, walk };
}

router.post("/surveys", surveyLimiter, requireTrust, requireMembership("navigator"), async (req: Request, res: Response) => {
  const {
    city,
    neighborhood,
    visitPurpose,
    visitFreq,
    daytimeSafety,
    nighttimeSafety,
    walkability,
    transitSafety,
    atmosphere,
    policeVisibility,
    policeImpact,
    accessibility,
    tips,
    comments,
  } = req.body as Record<string, unknown>;

  if (!city || !visitPurpose || !daytimeSafety || !nighttimeSafety || !atmosphere || !policeVisibility || !policeImpact) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }

  // Validate numeric rating fields (must be 1–5)
  const numericFields: [string, unknown][] = [
    ["daytimeSafety", daytimeSafety],
    ["nighttimeSafety", nighttimeSafety],
    ["walkability", walkability],
    ["transitSafety", transitSafety],
  ];
  for (const [key, val] of numericFields) {
    if (val !== undefined && val !== null && val !== "") {
      const n = Number(val);
      if (isNaN(n) || n < 1 || n > 5) {
        res.status(400).json({ error: `${key} must be a number between 1 and 5` });
        return;
      }
    }
  }

  const safeNum = (v: unknown): number => Math.round(Number(v));
  const scores = computeScores(
    safeNum(daytimeSafety),
    safeNum(nighttimeSafety),
    walkability != null && walkability !== "" ? safeNum(walkability) : null,
    transitSafety != null && transitSafety !== "" ? safeNum(transitSafety) : null,
    atmosphere as string,
  );

  try {
    const [survey] = await db
      .insert(neighborhoodSurveysTable)
      .values({
        userId: req.user?.id ?? null,
        city: city as string,
        neighborhood: (neighborhood as string | undefined) ?? null,
        visitPurpose: visitPurpose as string,
        visitFreq: (visitFreq as string | undefined) ?? null,
        daytimeSafety: daytimeSafety as number,
        nighttimeSafety: nighttimeSafety as number,
        walkability: (walkability as number | undefined) ?? null,
        transitSafety: (transitSafety as number | undefined) ?? null,
        atmosphere: atmosphere as string,
        policeVisibility: policeVisibility as string,
        policeImpact: policeImpact as string,
        accessibility: (accessibility as string[] | undefined) ?? [],
        tips: (tips as string[] | undefined) ?? [],
        comments: (comments as string | undefined) ?? null,
        safetyScore: scores.safety,
        communityScore: scores.community,
        walkabilityScore: scores.walk,
      })
      .returning();

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

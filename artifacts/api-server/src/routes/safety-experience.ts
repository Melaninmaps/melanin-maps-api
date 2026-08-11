/**
 * Safety Experience Submissions
 *
 * Stores community safety ratings from the SafetyExperienceSurvey modal.
 * After every submission the route recomputes live aggregates on the
 * businesses row: safety_rating, would_return_alone, recommendation_rate,
 * and confidence_score.
 */

import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

// ---------------------------------------------------------------------------
// Confidence-score computation
// ---------------------------------------------------------------------------
// Composite of five signals (0-100):
//   Verification    0-20   (verified = 20, else 0)
//   Safety rating   0-25   (from avg overall_safety 1-5  → scaled)
//   Recommend rate  0-20   (% would_recommend >= 4)
//   Review count    0-20   (log-scaled, caps at 100 reviews)
//   Recency         0-15   (days since last submission, caps at 60 days stale)
async function computeConfidenceScore(businessId: string): Promise<number> {
  const [bizRow, subRow] = await Promise.all([
    pool.query(
      `SELECT verified, safety_rating, recommendation_rate, review_count FROM businesses WHERE id = $1`,
      [businessId],
    ),
    pool.query(
      `SELECT
         COUNT(*)                                                          AS total,
         AVG(overall_safety)                                               AS avg_safety,
         ROUND(100.0 * COUNT(*) FILTER (WHERE would_recommend >= 4) / NULLIF(COUNT(*),0)) AS rec_rate,
         MAX(submitted_at)                                                 AS last_submission
       FROM business_safety_submissions
       WHERE business_id = $1`,
      [businessId],
    ),
  ]);

  const biz = bizRow.rows[0];
  if (!biz) return 0;

  const sub = subRow.rows[0];
  const total = parseInt(sub?.total ?? "0", 10);

  // 1. Verification (0-20)
  const verifiedPts = biz.verified ? 20 : 0;

  // 2. Safety rating (0-25): avg_safety 1-5 → 0-25
  const avgSafety = sub?.avg_safety != null ? parseFloat(sub.avg_safety) : null;
  const safetyPts = avgSafety != null ? Math.round(((avgSafety - 1) / 4) * 25) : 0;

  // 3. Recommendation rate (0-20)
  const recRate = sub?.rec_rate != null ? parseFloat(sub.rec_rate) : null;
  const recPts = recRate != null ? Math.round((recRate / 100) * 20) : 0;

  // 4. Review count (0-20): log10(count+1) / log10(101) * 20
  const reviewCount = parseInt(biz.review_count ?? "0", 10) + total;
  const reviewPts = Math.round((Math.log10(reviewCount + 1) / Math.log10(101)) * 20);

  // 5. Recency (0-15): 0 if no submissions, falls off over 60 days
  let recencyPts = 0;
  if (sub?.last_submission) {
    const daysSince = (Date.now() - new Date(sub.last_submission).getTime()) / 86_400_000;
    recencyPts = daysSince <= 60 ? Math.round(15 * (1 - daysSince / 60)) : 0;
  }

  const score = Math.min(100, verifiedPts + safetyPts + recPts + reviewPts + recencyPts);
  return score;
}

// ---------------------------------------------------------------------------
// POST /businesses/:id/safety-experience
// ---------------------------------------------------------------------------
router.post("/businesses/:id/safety-experience", requireAuth, async (req, res) => {
  const { id: businessId } = req.params;
  const userId = (req as any).user?.id;

  const {
    overallSafety,
    returnAlone,
    wouldRecommend,
    belongingRating,
    timeOfDay,
    groupType,
    incidentOccurred,
    incidentCategories,
    incidentSeverity,
    comments,
  } = req.body as {
    overallSafety: number;
    returnAlone: number;
    wouldRecommend: number;
    belongingRating?: number;
    timeOfDay?: string;
    groupType?: string;
    incidentOccurred?: boolean;
    incidentCategories?: string[];
    incidentSeverity?: string;
    comments?: string;
  };

  // Basic validation
  if (!overallSafety || overallSafety < 1 || overallSafety > 5) {
    return res.status(400).json({ error: "overallSafety must be 1-5" });
  }
  if (!returnAlone || returnAlone < 1 || returnAlone > 5) {
    return res.status(400).json({ error: "returnAlone must be 1-5" });
  }
  if (!wouldRecommend || wouldRecommend < 1 || wouldRecommend > 5) {
    return res.status(400).json({ error: "wouldRecommend must be 1-5" });
  }

  try {
    // Insert submission (unique per user/business/calendar-day)
    await pool.query(
      `INSERT INTO business_safety_submissions
         (business_id, user_id, overall_safety, return_alone, would_recommend,
          belonging_rating, time_of_day, group_type, incident_occurred,
          incident_categories, incident_severity, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id, business_id) DO UPDATE SET
         overall_safety      = EXCLUDED.overall_safety,
         return_alone        = EXCLUDED.return_alone,
         would_recommend     = EXCLUDED.would_recommend,
         belonging_rating    = EXCLUDED.belonging_rating,
         time_of_day         = EXCLUDED.time_of_day,
         group_type          = EXCLUDED.group_type,
         incident_occurred   = EXCLUDED.incident_occurred,
         incident_categories = EXCLUDED.incident_categories,
         incident_severity   = EXCLUDED.incident_severity,
         comments            = EXCLUDED.comments,
         submitted_at        = NOW()`,
      [
        businessId,
        userId,
        overallSafety,
        returnAlone,
        wouldRecommend,
        belongingRating ?? null,
        timeOfDay ?? null,
        groupType ?? null,
        incidentOccurred ?? false,
        incidentCategories?.length ? `{${incidentCategories.map(s => `"${s.replace(/"/g, '\\"')}"`).join(",")}}` : null,
        incidentSeverity ?? null,
        comments?.trim() || null,
      ],
    );

    // Recompute live aggregates from all submissions for this business
    const aggResult = await pool.query(
      `SELECT
         ROUND(AVG(overall_safety)::numeric, 2)                                             AS avg_safety,
         ROUND(100.0 * COUNT(*) FILTER (WHERE return_alone >= 4) / NULLIF(COUNT(*),0))::int AS return_alone_pct,
         ROUND(100.0 * COUNT(*) FILTER (WHERE would_recommend >= 4) / NULLIF(COUNT(*),0))::int AS recommend_pct
       FROM business_safety_submissions
       WHERE business_id = $1`,
      [businessId],
    );

    const agg = aggResult.rows[0];
    const newSafetyRating = agg?.avg_safety != null ? parseFloat(agg.avg_safety) : null;
    const newReturnAlone = agg?.return_alone_pct ?? null;
    const newRecommendRate = agg?.recommend_pct ?? null;

    // Update businesses aggregate columns
    if (newSafetyRating !== null) {
      await pool.query(
        `UPDATE businesses
           SET safety_rating       = $1,
               would_return_alone  = $2,
               recommendation_rate = $3
         WHERE id = $4`,
        [newSafetyRating, newReturnAlone, newRecommendRate, businessId],
      );
    }

    // Recompute and persist confidence score
    const newScore = await computeConfidenceScore(businessId);
    await pool.query(`UPDATE businesses SET confidence_score = $1 WHERE id = $2`, [newScore, businessId]);

    logger.info(
      { businessId, userId, overallSafety, newSafetyRating, newScore },
      "[safety-experience] submission stored and aggregates updated",
    );

    return res.json({
      ok: true,
      safetyRating: newSafetyRating,
      wouldReturnAlone: newReturnAlone,
      recommendationRate: newRecommendRate,
      confidenceScore: newScore,
    });
  } catch (err) {
    logger.error({ err, businessId }, "[safety-experience] failed to store submission");
    return res.status(500).json({ error: "Could not save submission" });
  }
});

// ---------------------------------------------------------------------------
// GET /businesses/:id/safety-experience/summary
// ---------------------------------------------------------------------------
router.get("/businesses/:id/safety-experience/summary", async (req, res) => {
  const { id: businessId } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)                                                                            AS submission_count,
         ROUND(AVG(overall_safety)::numeric, 2)                                             AS avg_safety,
         ROUND(100.0 * COUNT(*) FILTER (WHERE return_alone >= 4) / NULLIF(COUNT(*),0))::int AS return_alone_pct,
         ROUND(100.0 * COUNT(*) FILTER (WHERE would_recommend >= 4) / NULLIF(COUNT(*),0))::int AS recommend_pct,
         ROUND(AVG(belonging_rating)::numeric, 2)                                           AS avg_belonging,
         COUNT(*) FILTER (WHERE incident_occurred = true)                                   AS incident_count
       FROM business_safety_submissions
       WHERE business_id = $1`,
      [businessId],
    );
    return res.json(result.rows[0] ?? {});
  } catch (err) {
    logger.error({ err }, "[safety-experience] summary query failed");
    return res.status(500).json({ error: "Could not fetch summary" });
  }
});

export default router;

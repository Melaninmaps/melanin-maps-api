import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// ─── GET /api/users/wrapped ────────────────────────────────────────────────────
// Aggregate the user's annual impact stats for the "Melanin Wrapped" screen
router.get("/users/wrapped", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const userId = req.user.id;
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  try {
    const [
      checkInsResult,
      reviewsResult,
      savesResult,
      pointsResult,
      topCategoryResult,
      citiesResult,
      firstBusinessResult,
      communitiesResult,
    ] = await Promise.all([
      // Total check-ins this year
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM check_ins WHERE user_id = $1 AND created_at >= $2`,
        [userId, yearStart],
      ),
      // Total reviews this year
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM reviews WHERE user_id = $1 AND created_at >= $2`,
        [userId, yearStart],
      ),
      // Total saves (all time)
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM saved_places WHERE user_id = $1`,
        [userId],
      ),
      // Points earned this year
      pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(points), 0) as total FROM points_ledger WHERE user_id = $1 AND created_at >= $2`,
        [userId, yearStart],
      ),
      // Top category visited (from check-ins → businesses)
      pool.query<{ category: string; count: string }>(
        `SELECT b.category, COUNT(*) as count
         FROM check_ins ci
         JOIN businesses b ON b.id = ci.business_id
         WHERE ci.user_id = $1 AND ci.created_at >= $2 AND b.category IS NOT NULL
         GROUP BY b.category ORDER BY count DESC LIMIT 1`,
        [userId, yearStart],
      ),
      // Distinct cities visited
      pool.query<{ city: string }>(
        `SELECT DISTINCT b.city
         FROM check_ins ci
         JOIN businesses b ON b.id = ci.business_id
         WHERE ci.user_id = $1 AND ci.created_at >= $2 AND b.city IS NOT NULL`,
        [userId, yearStart],
      ),
      // First business ever visited
      pool.query<{ name: string; category: string; created_at: string }>(
        `SELECT b.name, b.category, ci.created_at
         FROM check_ins ci
         JOIN businesses b ON b.id = ci.business_id
         WHERE ci.user_id = $1
         ORDER BY ci.created_at ASC LIMIT 1`,
        [userId],
      ),
      // Circles / communities joined
      pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM circle_members WHERE user_id = $1`,
        [userId],
      ),
    ]);

    const checkInsCount = parseInt(checkInsResult.rows[0]?.count ?? "0");
    const reviewsCount = parseInt(reviewsResult.rows[0]?.count ?? "0");
    const savesCount = parseInt(savesResult.rows[0]?.count ?? "0");
    const pointsEarned = parseInt(pointsResult.rows[0]?.total ?? "0");
    const topCategory = topCategoryResult.rows[0]?.category ?? null;
    const cities = citiesResult.rows.map((r) => r.city).filter(Boolean);
    const firstBusiness = firstBusinessResult.rows[0] ?? null;
    const communitiesCount = parseInt(communitiesResult.rows[0]?.count ?? "0");

    // Compute a "community impact" level
    const impactScore = checkInsCount * 3 + reviewsCount * 5 + savesCount + Math.floor(pointsEarned / 50);
    const impactLevel =
      impactScore >= 200 ? "Trailblazer" :
      impactScore >= 100 ? "Navigator" :
      impactScore >= 40 ? "Explorer" :
      impactScore >= 10 ? "Discoverer" : "Newcomer";

    const year = new Date().getFullYear();

    res.json({
      year,
      checkInsCount,
      reviewsCount,
      savesCount,
      pointsEarned,
      topCategory,
      citiesCount: cities.length,
      cities: cities.slice(0, 8),
      firstBusiness: firstBusiness
        ? { name: firstBusiness.name, category: firstBusiness.category }
        : null,
      communitiesCount,
      impactScore,
      impactLevel,
    });
  } catch (err) {
    req.log.error({ err }, "wrapped stats error");
    res.status(500).json({ error: "Failed to load wrapped stats" });
  }
});

export default router;

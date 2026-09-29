import { Router } from "express";
import { db, pool, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";

const router = Router();

router.get("/impact", async (req, res) => {
  try {
    // `public.public_businesses` is the canonical member-facing directory
    // scope. Inventory rows can be archived, duplicate-vault, hidden, or
    // otherwise non-public; never market that internal total as listings.
    const publicDirectoryResult = await pool.query<{ total_businesses: string; total_cities: string }>(
      `SELECT COUNT(*)::text AS total_businesses,
              COUNT(DISTINCT city)::text AS total_cities
         FROM public.public_businesses`,
    );
    const publicDirectoryStats = publicDirectoryResult.rows[0];

    // Count cultural heritage sites — HBCUs, museums, landmarks, civil rights sites, etc.
    // Using pool.query since cultural_sites is managed via raw SQL throughout the codebase.
    const culturalResult = await pool.query<{ cnt: string }>(
      "SELECT COUNT(*) AS cnt FROM cultural_sites",
    );
    const totalCulturalSites = Number(culturalResult.rows[0]?.cnt ?? 0);

    const [userStats] = await db
      .select({ totalUsers: count(usersTable.id) })
      .from(usersTable);

    res.json({
      businesses: Number(publicDirectoryStats?.total_businesses ?? 0),
      cities: Number(publicDirectoryStats?.total_cities ?? 0),
      culturalSites: totalCulturalSites,
      community: Number(userStats?.totalUsers ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch impact stats");
    // Return nulls on error — frontend renders "—" for null/zero, which is preferable
    // to serving fabricated fallback numbers when the DB is unavailable.
    res.json({ businesses: null, cities: null, culturalSites: null, community: null });
  }
});

export default router;

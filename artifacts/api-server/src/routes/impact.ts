import { Router } from "express";
import { db, pool, businessesTable, usersTable, reviewsTable } from "@workspace/db";
import { count, countDistinct, eq, inArray } from "drizzle-orm";

const router = Router();

router.get("/impact", async (req, res) => {
  try {
    // Count only active businesses — pending/inactive entries are not visible to users
    const [bizStats] = await db
      .select({
        totalBusinesses: count(businessesTable.id),
        totalCities: countDistinct(businessesTable.city),
      })
      .from(businessesTable)
      .where(eq(businessesTable.status, "active"));

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
      businesses: Number(bizStats?.totalBusinesses ?? 0),
      cities: Number(bizStats?.totalCities ?? 0),
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

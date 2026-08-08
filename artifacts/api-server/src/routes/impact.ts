import { Router } from "express";
import { db, businessesTable, usersTable } from "@workspace/db";
import { count, countDistinct, eq, sum, sql } from "drizzle-orm";

const router = Router();

router.get("/impact", async (req, res) => {
  try {
    // Count only active businesses — pending/inactive entries are not visible to users
    const [bizStats] = await db
      .select({
        totalBusinesses: count(businessesTable.id),
        totalCities: countDistinct(businessesTable.city),
        totalReviews: sum(businessesTable.reviewCount),
      })
      .from(businessesTable)
      .where(eq(businessesTable.status, "active"));

    const [userStats] = await db
      .select({ totalUsers: count(usersTable.id) })
      .from(usersTable);

    res.json({
      businesses: Number(bizStats?.totalBusinesses ?? 0),
      cities: Number(bizStats?.totalCities ?? 0),
      reviews: Number(bizStats?.totalReviews ?? 0),
      community: Number(userStats?.totalUsers ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch impact stats");
    res.json({ businesses: 0, cities: 0, reviews: 0, community: 0 });
  }
});

export default router;

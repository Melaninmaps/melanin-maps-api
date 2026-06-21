import { Router } from "express";
import { db, businessesTable, usersTable } from "@workspace/db";
import { count, countDistinct, sum, sql } from "drizzle-orm";

const router = Router();

router.get("/impact", async (req, res) => {
  try {
    const [bizStats] = await db
      .select({
        totalBusinesses: count(businessesTable.id),
        totalCities: countDistinct(businessesTable.city),
        totalReviews: sum(businessesTable.reviewCount),
      })
      .from(businessesTable);

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
    res.status(500).json({ error: "Failed to fetch impact stats" });
  }
});

export default router;

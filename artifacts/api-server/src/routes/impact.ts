import { Router } from "express";
import { db, businessesTable, usersTable, reviewsTable } from "@workspace/db";
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

    // Count actual posted reviews from the reviews table — real user submissions only
    // Using the reviews table directly is ground truth; the reviewCount field on businesses
    // is a denormalized cache that may include seeded/imported values from before launch.
    const [reviewStats] = await db
      .select({ totalReviews: count(reviewsTable.id) })
      .from(reviewsTable)
      .where(inArray(reviewsTable.status, ["posted", "auto_approved"]));

    const [userStats] = await db
      .select({ totalUsers: count(usersTable.id) })
      .from(usersTable);

    res.json({
      businesses: Number(bizStats?.totalBusinesses ?? 0),
      cities: Number(bizStats?.totalCities ?? 0),
      reviews: Number(reviewStats?.totalReviews ?? 0),
      community: Number(userStats?.totalUsers ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch impact stats");
    // Return nulls on error — frontend renders "—" for null/zero, which is preferable
    // to serving fabricated fallback numbers when the DB is unavailable.
    res.json({ businesses: null, cities: null, reviews: null, community: null });
  }
});

export default router;

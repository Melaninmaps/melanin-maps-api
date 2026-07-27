import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, usersTable, savedPlacesTable, neighborhoodSurveysTable, communityPostsTable, eventRsvpsTable, reviewsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/passport", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const userId = req.user.id;

    const [userRow] = await db
      .select({ createdAt: usersTable.createdAt, firstName: usersTable.firstName, lastName: usersTable.lastName, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const [[savedCount], [surveysCount], [postsCount], [rsvpCount], [reviewCount], citiesResult] = await Promise.all([
      db.select({ count: count() }).from(savedPlacesTable).where(eq(savedPlacesTable.userId, userId)),
      db.select({ count: count() }).from(neighborhoodSurveysTable).where(eq(neighborhoodSurveysTable.userId, userId)),
      db.select({ count: count() }).from(communityPostsTable).where(eq(communityPostsTable.authorId, userId)),
      db.select({ count: count() }).from(eventRsvpsTable).where(eq(eventRsvpsTable.userId, userId)),
      db.select({ count: count() }).from(reviewsTable).where(eq(reviewsTable.userId, userId)),
      pool.query<{ city: string }>(
        `SELECT DISTINCT b.city FROM saved_places sp JOIN businesses b ON b.id = sp.business_id WHERE sp.user_id = $1 AND b.city IS NOT NULL`,
        [userId],
      ),
    ]);

    const uniqueCities = citiesResult.rows.filter((r) => r.city).length;

    const memberSince = userRow?.createdAt
      ? new Date(userRow.createdAt).getFullYear()
      : new Date().getFullYear();

    const totalEngagements =
      (savedCount?.count ?? 0) +
      (surveysCount?.count ?? 0) +
      (postsCount?.count ?? 0) +
      (rsvpCount?.count ?? 0) +
      (reviewCount?.count ?? 0);

    const level =
      totalEngagements >= 200 ? "Ambassador"
      : totalEngagements >= 100 ? "Pioneer"
      : totalEngagements >= 50 ? "Explorer"
      : totalEngagements >= 20 ? "Trailblazer"
      : "Newcomer";

    res.json({
      passport: {
        displayName: userRow?.firstName
          ? `${userRow.firstName}${userRow.lastName ? " " + userRow.lastName : ""}`
          : (userRow?.username ?? "Community Member"),
        memberSince,
        level,
        stats: {
          businessesSaved: savedCount?.count ?? 0,
          citiesExplored: uniqueCities,
          safetyReports: surveysCount?.count ?? 0,
          communityPosts: postsCount?.count ?? 0,
          eventsAttended: rsvpCount?.count ?? 0,
          reviewsWritten: reviewCount?.count ?? 0,
        },
        totalEngagements,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch passport");
    res.status(500).json({ error: "Failed to fetch passport" });
  }
});

export default router;

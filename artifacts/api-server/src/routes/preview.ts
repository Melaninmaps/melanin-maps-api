import { Router, type IRouter, type Request, type Response } from "express";
import { pool, db, businessesTable, communityPostsTable } from "@workspace/db";
import { eq, desc, and, isNotNull } from "drizzle-orm";

const router: IRouter = Router();

// GET /preview/stats — public platform stats for preview screen
router.get("/preview/stats", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{
      businesses: string;
      cities: string;
      members: string;
      reviews: string;
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM businesses)                                      AS businesses,
        (SELECT COUNT(DISTINCT city)::int FROM businesses WHERE city IS NOT NULL AND city != '')  AS cities,
        (SELECT COUNT(*)::int FROM users)                                           AS members,
        (SELECT COUNT(*)::int FROM reviews)                                         AS reviews
    `);
    const row = result.rows[0] ?? { businesses: "0", cities: "0", members: "0", reviews: "0" };
    res.json({
      businesses: parseInt(row.businesses, 10),
      cities: parseInt(row.cities, 10),
      members: parseInt(row.members, 10),
      reviews: parseInt(row.reviews, 10),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// GET /preview/spotlight — curated top businesses, no auth required
router.get("/preview/spotlight", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: businessesTable.id,
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
        rating: businessesTable.rating,
        confidenceScore: businessesTable.confidenceScore,
        imageUrl: businessesTable.imageUrl,
        verified: businessesTable.verified,
        subcategory: businessesTable.subcategory,
      })
      .from(businessesTable)
      .where(isNotNull(businessesTable.imageUrl))
      .orderBy(
        desc(businessesTable.verified),
        desc(businessesTable.confidenceScore),
        desc(businessesTable.rating),
      )
      .limit(6);

    res.json({ businesses: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load spotlight" });
  }
});

// GET /preview/posts — recent public community posts, no auth required
router.get("/preview/posts", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: communityPostsTable.id,
        authorName: communityPostsTable.authorName,
        authorInitials: communityPostsTable.authorInitials,
        authorColor: communityPostsTable.authorColor,
        content: communityPostsTable.content,
        category: communityPostsTable.category,
        topicTag: communityPostsTable.topicTag,
        locationTag: communityPostsTable.locationTag,
        upvotes: communityPostsTable.upvotes,
        commentsCount: communityPostsTable.commentsCount,
        createdAt: communityPostsTable.createdAt,
      })
      .from(communityPostsTable)
      .where(
        and(
          eq(communityPostsTable.visibility, "public"),
          eq(communityPostsTable.audienceRating, "everyone"),
          eq(communityPostsTable.requiresModeration, false),
          eq(communityPostsTable.hasContentWarning, false),
        ),
      )
      .orderBy(desc(communityPostsTable.createdAt))
      .limit(4);

    // Truncate content for preview (first 120 chars shown, rest blurred on client)
    const posts = rows.map((p) => ({
      ...p,
      contentPreview: p.content.slice(0, 120),
      contentLength: p.content.length,
      isBlurred: p.content.length > 120,
    }));

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: "Failed to load posts" });
  }
});

export default router;

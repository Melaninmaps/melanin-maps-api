import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessOwnerLinksTable, businessesTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// GET /community-impact/:userId — compute community impact stats for a user
router.get("/community-impact/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    // Reviews written by this user
    const reviewsRes = await pool.query<{ cnt: string }>(
      `SELECT count(*)::int AS cnt FROM reviews WHERE author_id = $1`,
      [userId]
    );
    const reviewCount = Number(reviewsRes.rows[0]?.cnt ?? 0);

    // Distinct businesses reviewed (supporting others)
    const businessesReviewedRes = await pool.query<{ cnt: string }>(
      `SELECT count(DISTINCT business_id)::int AS cnt FROM reviews WHERE author_id = $1`,
      [userId]
    );
    const businessesReviewedCount = Number(businessesReviewedRes.rows[0]?.cnt ?? 0);

    // Events attended (RSVP'd yes)
    const eventsRes = await pool.query<{ cnt: string }>(
      `SELECT count(*)::int AS cnt FROM event_rsvps WHERE user_id = $1 AND status = 'going'`,
      [userId]
    );
    const eventsAttended = Number(eventsRes.rows[0]?.cnt ?? 0);

    // Community posts (recommendations + general)
    const postsRes = await pool.query<{ cnt: string }>(
      `SELECT count(*)::int AS cnt FROM community_posts WHERE author_id = $1 AND post_type = 'community'`,
      [userId]
    );
    const communityPosts = Number(postsRes.rows[0]?.cnt ?? 0);

    // Businesses saved (shows support intent)
    const savedRes = await pool.query<{ cnt: string }>(
      `SELECT count(*)::int AS cnt FROM saved_places WHERE user_id = $1`,
      [userId]
    );
    const savedBusinesses = Number(savedRes.rows[0]?.cnt ?? 0);

    // Referrals made
    const referralsRes = await pool.query<{ cnt: string }>(
      `SELECT count(*)::int AS cnt FROM user_referrals WHERE referrer_id = $1 AND status = 'completed'`,
      [userId]
    );
    const referralsMade = Number(referralsRes.rows[0]?.cnt ?? 0);

    // Businesses they've actually reviewed (to show in "Supports Others")
    const supportedBusinessesRes = await pool.query<{
      business_id: string; business_name: string; rating: string; created_at: string;
    }>(
      `SELECT r.business_id, b.name AS business_name, r.rating::text, r.created_at
       FROM reviews r
       JOIN businesses b ON b.id = r.business_id
       WHERE r.author_id = $1
       ORDER BY r.created_at DESC
       LIMIT 12`,
      [userId]
    );
    const supportedBusinesses = supportedBusinessesRes.rows.map((r) => ({
      businessId: r.business_id,
      businessName: r.business_name,
      rating: Number(r.rating),
      createdAt: r.created_at,
    }));

    // Owned businesses (verified or pending claims)
    const ownedLinks = await db
      .select({
        businessId: businessOwnerLinksTable.businessId,
        role: businessOwnerLinksTable.role,
        status: businessOwnerLinksTable.status,
        businessName: businessesTable.name,
        businessCategory: businessesTable.category,
        businessCity: businessesTable.city,
        businessState: businessesTable.state,
        businessRating: businessesTable.rating,
        businessImageUrl: businessesTable.imageUrl,
        businessVerified: businessesTable.verified,
      })
      .from(businessOwnerLinksTable)
      .innerJoin(businessesTable, eq(businessesTable.id, businessOwnerLinksTable.businessId))
      .where(eq(businessOwnerLinksTable.userId, String(userId)))
      .orderBy(desc(businessOwnerLinksTable.createdAt));

    // Compute a community score (weighted)
    const score = Math.min(
      100,
      Math.round(
        reviewCount * 2 +
        eventsAttended * 3 +
        communityPosts * 1 +
        referralsMade * 5 +
        savedBusinesses * 0.5
      )
    );

    res.json({
      stats: {
        reviewCount,
        businessesReviewedCount,
        eventsAttended,
        communityPosts,
        savedBusinesses,
        referralsMade,
        score,
      },
      supportedBusinesses,
      ownedBusinesses: ownedLinks,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch community impact");
    res.status(500).json({ error: "Failed to fetch community impact" });
  }
});

// GET /businesses/:id/owner-profile — get owner's community profile for a business
router.get("/businesses/:id/owner-profile", async (req: Request, res: Response) => {
  try {
    const link = await db
      .select({
        userId: businessOwnerLinksTable.userId,
        role: businessOwnerLinksTable.role,
        status: businessOwnerLinksTable.status,
      })
      .from(businessOwnerLinksTable)
      .where(
        and(
          eq(businessOwnerLinksTable.businessId, String(req.params.id)),
          eq(businessOwnerLinksTable.status, "verified")
        )
      )
      .limit(1);

    if (!link[0]) { res.json({ owner: null }); return; }

    const [user] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        bio: usersTable.bio,
        profileImageUrl: usersTable.profileImageUrl,
        memberType: usersTable.memberType,
        isInfluencer: usersTable.isInfluencer,
      })
      .from(usersTable)
      .where(eq(usersTable.id, link[0].userId));

    if (!user) { res.json({ owner: null }); return; }
    res.json({ owner: { ...user, role: link[0].role } });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch owner profile");
    res.status(500).json({ error: "Failed to fetch owner profile" });
  }
});

// NOTE: POST /businesses/:id/claim was previously handled here with no evidence
// validation. It has been removed. Use POST /businesses/:id/claims (with an 's')
// in claims.ts — that route requires authentication, evidence, and a verified
// attestation, and properly enforces the one-open-claim-per-member rule.

export default router;

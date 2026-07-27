import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, creatorProfilesTable, usersTable } from "@workspace/db";
import { and, eq, ilike } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/creator-profile/me", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const [profile] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, userId))
      .limit(1);
    res.json({ profile: profile ?? null });
  } catch (err) {
    req.log.error({ err }, "GET /creator-profile/me error");
    res.status(500).json({ error: "Failed to load creator profile." });
  }
});

router.post("/creator-profile/me", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { bio, categories, platforms, primaryPlatform, city, state, isPublic } = req.body as {
      bio?: string;
      categories?: string[];
      platforms?: { platform: string; handle: string; url: string }[];
      primaryPlatform?: string;
      city?: string;
      state?: string;
      isPublic?: boolean;
    };

    const [existing] = await db
      .select({ id: creatorProfilesTable.id })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, userId))
      .limit(1);

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (bio !== undefined) values.bio = bio?.trim() || null;
    if (categories !== undefined) values.categories = categories;
    if (platforms !== undefined) values.platforms = platforms;
    if (primaryPlatform !== undefined) values.primaryPlatform = primaryPlatform || null;
    if (city !== undefined) values.city = city?.trim() || null;
    if (state !== undefined) values.state = state?.trim() || null;
    if (isPublic !== undefined) values.isPublic = isPublic;

    let profile;
    if (existing) {
      const [updated] = await db
        .update(creatorProfilesTable)
        .set(values)
        .where(eq(creatorProfilesTable.userId, userId))
        .returning();
      profile = updated;
    } else {
      const [inserted] = await db
        .insert(creatorProfilesTable)
        .values({ userId, ...values, createdAt: new Date() } as any)
        .returning();
      profile = inserted;
    }

    res.json({ profile });
  } catch (err) {
    req.log.error({ err }, "POST /creator-profile/me error");
    res.status(500).json({ error: "Failed to save creator profile." });
  }
});

router.get("/creator-profile/:userId", async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const [profile] = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.userId, userId))
      .limit(1);
    if (!profile || !profile.isPublic) {
      res.status(404).json({ error: "Creator profile not found." });
      return;
    }
    const [user] = await db
      .select({
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    res.json({ profile: { ...profile, user: user ?? null } });
  } catch (err) {
    req.log.error({ err }, "GET /creator-profile/:userId error");
    res.status(500).json({ error: "Failed to load creator profile." });
  }
});

router.get("/creators", async (req: Request, res: Response) => {
  try {
    const { city, state, q } = req.query as { city?: string; state?: string; q?: string };

    const conditions: SQL[] = [eq(creatorProfilesTable.isPublic, true)];
    if (city) conditions.push(ilike(creatorProfilesTable.city, `%${city}%`) as SQL);
    else if (state) conditions.push(ilike(creatorProfilesTable.state, `%${state}%`) as SQL);

    const rows = await db
      .select({
        id: creatorProfilesTable.id,
        userId: creatorProfilesTable.userId,
        bio: creatorProfilesTable.bio,
        categories: creatorProfilesTable.categories,
        platforms: creatorProfilesTable.platforms,
        primaryPlatform: creatorProfilesTable.primaryPlatform,
        city: creatorProfilesTable.city,
        state: creatorProfilesTable.state,
        isPremier: creatorProfilesTable.isPremier,
        coveredLocations: creatorProfilesTable.coveredLocations,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
      })
      .from(creatorProfilesTable)
      .innerJoin(usersTable, eq(creatorProfilesTable.userId, usersTable.id))
      .where(and(...conditions))
      .limit(50);

    const filtered = q
      ? rows.filter(
          (r) =>
            ((r.firstName ?? "") + " " + (r.lastName ?? "")).toLowerCase().includes(q.toLowerCase()) ||
            r.categories.some((c) => c.toLowerCase().includes(q.toLowerCase())),
        )
      : rows;

    res.json({ creators: filtered });
  } catch (err) {
    req.log.error({ err }, "GET /creators error");
    res.status(500).json({ error: "Failed to load creators." });
  }
});

// GET /location-feed/:location — premier creators + posts for a tagged location
router.get("/location-feed/:location", async (req: Request, res: Response) => {
  try {
    const location = String(req.params.location).trim();
    if (!location) { res.status(400).json({ error: "location is required" }); return; }

    // Premier creators covering this location (coveredLocations jsonb @> contains)
    const creatorRows = await pool.query<{
      id: number; user_id: string; bio: string | null; categories: string[];
      platforms: { platform: string; handle: string; url: string }[];
      primary_platform: string | null; city: string | null; state: string | null;
      is_premier: boolean; covered_locations: string[];
      first_name: string | null; last_name: string | null; profile_image_url: string | null;
    }>(
      `SELECT cp.id, cp.user_id, cp.bio, cp.categories, cp.platforms, cp.primary_platform,
              cp.city, cp.state, cp.is_premier, cp.covered_locations,
              u.first_name, u.last_name, u.profile_image_url
       FROM creator_profiles cp
       INNER JOIN users u ON u.id = cp.user_id
       WHERE cp.is_public = true
         AND cp.covered_locations @> $1::jsonb
       ORDER BY cp.is_premier DESC, cp.id ASC
       LIMIT 20`,
      [JSON.stringify([location])]
    );

    // Recent posts tagged with this location
    const postRows = await pool.query<{
      id: string; author_name: string; author_initials: string; author_color: string;
      content: string; category: string; post_type: string; location_tag: string | null;
      location_type: string | null; upvotes: number; comments_count: number; created_at: Date;
    }>(
      `SELECT id, author_name, author_initials, author_color, content, category, post_type,
              location_tag, location_type, upvotes, comments_count, created_at
       FROM community_posts
       WHERE LOWER(location_tag) = LOWER($1)
         AND visibility = 'public'
       ORDER BY created_at DESC
       LIMIT 30`,
      [location]
    );

    res.json({
      location,
      creators: creatorRows.rows.map((r) => ({
        id: r.id, userId: r.user_id, bio: r.bio, categories: r.categories,
        platforms: r.platforms, primaryPlatform: r.primary_platform,
        city: r.city, state: r.state, isPremier: r.is_premier,
        coveredLocations: r.covered_locations,
        firstName: r.first_name, lastName: r.last_name, profileImageUrl: r.profile_image_url,
      })),
      posts: postRows.rows.map((r) => ({
        id: r.id, authorName: r.author_name, authorInitials: r.author_initials,
        authorColor: r.author_color, content: r.content, category: r.category,
        postType: r.post_type, locationTag: r.location_tag, locationType: r.location_type,
        upvotes: r.upvotes, commentsCount: r.comments_count, createdAt: r.created_at,
      })),
    });
  } catch (err) {
    (req as any).log.error({ err }, "GET /location-feed error");
    res.status(500).json({ error: "Failed to load location feed" });
  }
});

export default router;

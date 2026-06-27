import { Router, type IRouter, type Request, type Response } from "express";
import { db, creatorProfilesTable, usersTable } from "@workspace/db";
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

export default router;

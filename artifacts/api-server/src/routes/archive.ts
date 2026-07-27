import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool } from "@workspace/db";
import { cityArchivesTable, archiveContributionsTable } from "@workspace/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const CONTRIBUTION_TYPES = [
  "interview",
  "place",
  "founding_business",
  "food_rec",
  "tradition",
  "local_tip",
  "home_sentence",
] as const;

// GET /archive/cities — list all published city archives
router.get("/archive/cities", async (req: Request, res: Response) => {
  try {
    const cities = await db
      .select()
      .from(cityArchivesTable)
      .where(eq(cityArchivesTable.isPublished, true))
      .orderBy(desc(cityArchivesTable.tourVisitedAt), asc(cityArchivesTable.city));
    res.json({ cities });
  } catch (err) {
    req.log.error(err, "archive: list cities");
    res.status(500).json({ error: "Failed to load cities" });
  }
});

// GET /archive/cities/all — list all cities (admin)
router.get("/archive/cities/all", async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const cities = await db
      .select()
      .from(cityArchivesTable)
      .orderBy(asc(cityArchivesTable.city));
    res.json({ cities });
  } catch (err) {
    req.log.error(err, "archive: list all cities");
    res.status(500).json({ error: "Failed to load cities" });
  }
});

// GET /archive/cities/:slug — get city archive with contributions
router.get("/archive/cities/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  try {
    const [city] = await db
      .select()
      .from(cityArchivesTable)
      .where(eq(cityArchivesTable.slug, slug))
      .limit(1);

    if (!city) { res.status(404).json({ error: "City not found" }); return; }

    const contributions = await db
      .select()
      .from(archiveContributionsTable)
      .where(
        and(
          eq(archiveContributionsTable.archiveId, city.id),
          eq(archiveContributionsTable.isApproved, true),
        ),
      )
      .orderBy(desc(archiveContributionsTable.isFeatured), desc(archiveContributionsTable.upvotes), asc(archiveContributionsTable.createdAt));

    // Group by type
    const grouped: Record<string, typeof contributions> = {};
    for (const c of contributions) {
      if (!grouped[c.type]) grouped[c.type] = [];
      grouped[c.type].push(c);
    }

    res.json({ city, contributions: grouped, total: contributions.length });
  } catch (err) {
    req.log.error(err, "archive: get city");
    res.status(500).json({ error: "Failed to load city archive" });
  }
});

// POST /archive/cities/:slug/contribute — submit a contribution
router.post("/archive/cities/:slug/contribute", async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const user = (req as any).user;

  const { type, title, content, mediaUrl, businessId, neighborhood, contributorName } = req.body as {
    type?: string;
    title?: string;
    content?: string;
    mediaUrl?: string;
    businessId?: string;
    neighborhood?: string;
    contributorName?: string;
  };

  if (!type || !CONTRIBUTION_TYPES.includes(type as (typeof CONTRIBUTION_TYPES)[number])) {
    res.status(400).json({ error: "Valid contribution type is required" });
    return;
  }
  if (!content?.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  try {
    const [city] = await db
      .select({ id: cityArchivesTable.id })
      .from(cityArchivesTable)
      .where(eq(cityArchivesTable.slug, slug))
      .limit(1);

    if (!city) { res.status(404).json({ error: "City not found" }); return; }

    const [contribution] = await db
      .insert(archiveContributionsTable)
      .values({
        archiveId: city.id,
        userId: user?.id ?? null,
        contributorName: contributorName?.trim() || user?.firstName || "Community Member",
        type,
        title: title?.trim() || null,
        content: content.trim(),
        mediaUrl: mediaUrl?.trim() || null,
        businessId: businessId || null,
        neighborhood: neighborhood?.trim() || null,
        isApproved: false,
      })
      .returning();

    // Bump nomination count
    await db
      .update(cityArchivesTable)
      .set({ nominationCount: sql`${cityArchivesTable.nominationCount} + 1`, updatedAt: new Date() })
      .where(eq(cityArchivesTable.id, city.id));

    res.json({ contribution, message: "Thank you! Your contribution is under review and will appear in the archive soon." });
  } catch (err) {
    req.log.error(err, "archive: contribute");
    res.status(500).json({ error: "Failed to submit contribution" });
  }
});

// POST /archive/cities/:slug/contributions/:id/upvote — upvote a contribution
router.post("/archive/cities/:slug/contributions/:id/upvote", async (req: Request, res: Response) => {
  const { id } = req.params as { slug: string; id: string };
  try {
    await db
      .update(archiveContributionsTable)
      .set({ upvotes: sql`${archiveContributionsTable.upvotes} + 1` })
      .where(eq(archiveContributionsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "archive: upvote");
    res.status(500).json({ error: "Failed to upvote" });
  }
});

// POST /archive/nominate-city — public: nominate a city for the tour
router.post("/archive/nominate-city", async (req: Request, res: Response) => {
  const { city, state, email, reason } = req.body as {
    city?: string;
    state?: string;
    email?: string;
    reason?: string;
  };

  if (!city?.trim()) {
    res.status(400).json({ error: "City name is required" });
    return;
  }

  try {
    const slug = `${city.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${(state ?? "us").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    // Upsert: if city archive doesn't exist, create a pending one
    const [existing] = await db
      .select({ id: cityArchivesTable.id, nominationCount: cityArchivesTable.nominationCount })
      .from(cityArchivesTable)
      .where(eq(cityArchivesTable.slug, slug))
      .limit(1);

    if (existing) {
      await db
        .update(cityArchivesTable)
        .set({ nominationCount: sql`${cityArchivesTable.nominationCount} + 1`, updatedAt: new Date() })
        .where(eq(cityArchivesTable.id, existing.id));
    } else {
      await db.insert(cityArchivesTable).values({
        city: city.trim(),
        state: (state ?? "").trim(),
        slug,
        status: "upcoming",
        nominationCount: 1,
        isPublished: false,
      });
    }

    req.log.info({ city, state, email }, "archive: city nomination");
    res.json({ ok: true, message: `${city.trim()} has been nominated for the Welcome Home Tour!` });
  } catch (err) {
    req.log.error(err, "archive: nominate-city");
    res.status(500).json({ error: "Failed to submit nomination" });
  }
});

// Admin: approve a contribution
router.patch("/archive/contributions/:id/approve", async (req: Request, res: Response) => {
  const user = (req as any).user;
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { id } = req.params as { id: string };
  const { isFeatured } = req.body as { isFeatured?: boolean };
  try {
    const [c] = await db
      .update(archiveContributionsTable)
      .set({ isApproved: true, isFeatured: isFeatured ?? false })
      .where(eq(archiveContributionsTable.id, id))
      .returning();

    if (c) {
      await db
        .update(cityArchivesTable)
        .set({ contributionCount: sql`${cityArchivesTable.contributionCount} + 1`, updatedAt: new Date() })
        .where(eq(cityArchivesTable.id, c.archiveId));
    }
    res.json({ contribution: c });
  } catch (err) {
    req.log.error(err, "archive: approve");
    res.status(500).json({ error: "Failed to approve contribution" });
  }
});

// Admin: upsert a city archive
router.post("/archive/admin/cities", async (req: Request, res: Response) => {
  const user = (req as any).user;
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { city, state, slug, tagline, description, heroImageUrl, tourVisitedAt, isPublished, status } = req.body as {
    city: string; state: string; slug: string; tagline?: string; description?: string;
    heroImageUrl?: string; tourVisitedAt?: string; isPublished?: boolean; status?: string;
  };
  if (!city || !state || !slug) {
    res.status(400).json({ error: "city, state, and slug are required" }); return;
  }
  try {
    const [archive] = await db
      .insert(cityArchivesTable)
      .values({ city, state, slug, tagline, description, heroImageUrl, isPublished: isPublished ?? false, status: status ?? "upcoming", tourVisitedAt: tourVisitedAt ? new Date(tourVisitedAt) : undefined })
      .onConflictDoUpdate({ target: cityArchivesTable.slug, set: { city, state, tagline, description, heroImageUrl, isPublished: isPublished ?? false, status: status ?? "upcoming", tourVisitedAt: tourVisitedAt ? new Date(tourVisitedAt) : undefined, updatedAt: new Date() } })
      .returning();
    res.json({ archive });
  } catch (err) {
    req.log.error(err, "archive: admin upsert city");
    res.status(500).json({ error: "Failed to save city archive" });
  }
});

export default router;

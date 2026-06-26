import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityRequestsTable, helpOffersTable, requestUpvotesTable, pointsLedgerTable, userAchievementsTable } from "@workspace/db";
import { and, count, desc, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function uid(req: Request): string | null {
  return (req.user as any)?.id ?? null;
}

async function awardAchievement(userId: string, type: string) {
  const existing = await db.select({ id: userAchievementsTable.id })
    .from(userAchievementsTable)
    .where(and(eq(userAchievementsTable.userId, userId), eq(userAchievementsTable.achievementType, type)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(userAchievementsTable).values({ userId, achievementType: type });
  }
}

// ── GET all community requests ────────────────────────────────────────────────
router.get("/community-requests", async (req: Request, res: Response) => {
  try {
    const { city, category, status } = req.query as Record<string, string>;
    let q = db.select().from(communityRequestsTable).orderBy(desc(communityRequestsTable.upvotes), desc(communityRequestsTable.createdAt)).limit(50);
    const rows = await q;
    let filtered = rows;
    if (city) filtered = filtered.filter(r => r.city?.toLowerCase().includes(city.toLowerCase()));
    if (category) filtered = filtered.filter(r => r.category === category);
    if (status) filtered = filtered.filter(r => r.status === status);
    res.json({ requests: filtered });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch community requests");
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ── POST create a community request ──────────────────────────────────────────
router.post("/community-requests", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Sign in to post a request" }); return; }
  const { title, category, city, state, description } = req.body as {
    title?: string; category?: string; city?: string; state?: string; description?: string;
  };
  if (!title?.trim() || !category?.trim()) {
    res.status(400).json({ error: "Title and category are required" }); return;
  }
  try {
    const [req_] = await db.insert(communityRequestsTable).values({
      userId: user, title: title.trim(), category: category.trim(),
      city: city?.trim() || null, state: state?.trim().toUpperCase() || null,
      description: description?.trim() || null,
    }).returning();
    // Points + achievement
    await db.insert(pointsLedgerTable).values({ userId: user, action: "community_request", points: 10, entityId: req_.id });
    await awardAchievement(user, "first_request");
    res.status(201).json({ request: req_ });
  } catch (err) {
    req.log.error({ err }, "Failed to create community request");
    res.status(500).json({ error: "Failed to create request" });
  }
});

// ── GET single request with helpers ──────────────────────────────────────────
router.get("/community-requests/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const [request] = await db.select().from(communityRequestsTable).where(eq(communityRequestsTable.id, id)).limit(1);
    if (!request) { res.status(404).json({ error: "Not found" }); return; }
    const helpers = await db.select().from(helpOffersTable).where(eq(helpOffersTable.requestId, id)).orderBy(desc(helpOffersTable.createdAt));
    res.json({ request, helpers });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch community request");
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// ── POST upvote a request ─────────────────────────────────────────────────────
router.post("/community-requests/:id/upvote", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const existing = await db.select({ id: requestUpvotesTable.id })
      .from(requestUpvotesTable)
      .where(and(eq(requestUpvotesTable.requestId, id), eq(requestUpvotesTable.userId, user)))
      .limit(1);
    if (existing.length > 0) { res.json({ alreadyUpvoted: true }); return; }
    await db.insert(requestUpvotesTable).values({ requestId: id, userId: user });
    await db.update(communityRequestsTable).set({ upvotes: sql`${communityRequestsTable.upvotes} + 1` }).where(eq(communityRequestsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to upvote request");
    res.status(500).json({ error: "Failed to upvote" });
  }
});

// ── POST "I Can Help" on a request ───────────────────────────────────────────
router.post("/community-requests/:id/help", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Sign in to offer help" }); return; }
  const id = String(req.params.id);
  const { offerTypes, message } = req.body as { offerTypes?: string[]; message?: string };
  if (!Array.isArray(offerTypes) || offerTypes.length === 0) {
    res.status(400).json({ error: "Select at least one way to help" }); return;
  }
  try {
    const [offer] = await db.insert(helpOffersTable).values({
      requestId: id, userId: user,
      offerTypes: offerTypes,
      message: message?.trim() || null,
    }).returning();
    await db.update(communityRequestsTable)
      .set({ helperCount: sql`${communityRequestsTable.helperCount} + 1` })
      .where(eq(communityRequestsTable.id, id));
    // Points + achievements
    await db.insert(pointsLedgerTable).values({ userId: user, action: "help_offer", points: 15, entityId: offer.id });
    await awardAchievement(user, "first_helper");
    const [{ total }] = await db.select({ total: count() }).from(helpOffersTable).where(eq(helpOffersTable.userId, user));
    if (Number(total) >= 10) await awardAchievement(user, "helper_10");
    const isRelocation = offerTypes.some(t => t.toLowerCase().includes("relocat") || t.toLowerCase().includes("moving"));
    if (isRelocation) await awardAchievement(user, "relocation_expert");
    res.status(201).json({ offer });
  } catch (err) {
    req.log.error({ err }, "Failed to submit help offer");
    res.status(500).json({ error: "Failed to submit help" });
  }
});

export default router;

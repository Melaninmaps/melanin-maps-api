import { Router, type IRouter, type Request, type Response } from "express";
import { db, pinnedBusinessItemsTable, businessesTable, usersTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const PIN_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

async function getOwnerBusinessId(userId: string): Promise<string | null> {
  const [biz] = await db
    .select({ id: businessesTable.id })
    .from(businessesTable)
    .where(eq(businessesTable.submittedById, userId))
    .limit(1);
  return biz?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* GET /businesses/:id/pinned — public: pinned items for a business    */
/* ------------------------------------------------------------------ */
router.get("/businesses/:id/pinned", async (req: Request, res: Response) => {
  const businessId = String(req.params.id);
  try {
    const items = await db
      .select()
      .from(pinnedBusinessItemsTable)
      .where(and(eq(pinnedBusinessItemsTable.businessId, businessId), eq(pinnedBusinessItemsTable.status, "active")))
      .orderBy(desc(pinnedBusinessItemsTable.pinnedAt))
      .limit(4);

    // Mark expired ones
    const now = Date.now();
    const active = items.filter((i) => new Date(i.expiresAt).getTime() > now);
    res.json({ pinned: active });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/:id/pinned error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /business/pinned — owner: see own pins with expiry status       */
/* ------------------------------------------------------------------ */
router.get("/business/pinned", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const businessId = await getOwnerBusinessId(req.user.id);
    if (!businessId) { res.status(404).json({ error: "No business found for this account" }); return; }

    const items = await db
      .select()
      .from(pinnedBusinessItemsTable)
      .where(eq(pinnedBusinessItemsTable.businessId, businessId))
      .orderBy(desc(pinnedBusinessItemsTable.pinnedAt));

    const now = Date.now();
    const enriched = items.map((item) => {
      const expiresMs = new Date(item.expiresAt).getTime();
      const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
      const isExpired = expiresMs <= now;
      const isExpiringSoon = !isExpired && daysLeft <= 14;
      return { ...item, daysLeft, isExpired, isExpiringSoon };
    });

    res.json({ pinned: enriched, businessId });
  } catch (err) {
    req.log.error({ err }, "GET /business/pinned error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* POST /business/pinned — owner: pin a review or video                */
/* ------------------------------------------------------------------ */
router.post("/business/pinned", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    itemType, reviewId, reviewText, reviewAuthor, reviewRating,
    reviewInitials, reviewColor, reviewTimeAgo, videoUrl, videoTitle,
  } = req.body as Record<string, unknown>;

  if (itemType !== "review" && itemType !== "video") {
    res.status(400).json({ error: "itemType must be 'review' or 'video'" });
    return;
  }

  try {
    const businessId = await getOwnerBusinessId(req.user.id);
    if (!businessId) { res.status(404).json({ error: "No business found for this account" }); return; }

    // Max 2 active pins total (1 review + 1 video, or 2 of the same type)
    const existing = await db
      .select({ id: pinnedBusinessItemsTable.id, itemType: pinnedBusinessItemsTable.itemType })
      .from(pinnedBusinessItemsTable)
      .where(and(eq(pinnedBusinessItemsTable.businessId, businessId), eq(pinnedBusinessItemsTable.status, "active")));

    const sameType = existing.filter((e) => e.itemType === itemType);
    if (sameType.length >= 1) {
      // Mark existing same-type as replaced
      for (const s of sameType) {
        await db.update(pinnedBusinessItemsTable).set({ status: "replaced" }).where(eq(pinnedBusinessItemsTable.id, s.id));
      }
    }

    const expiresAt = new Date(Date.now() + PIN_DURATION_MS);

    const [item] = await db
      .insert(pinnedBusinessItemsTable)
      .values({
        businessId,
        itemType: itemType as "review" | "video",
        reviewId: typeof reviewId === "string" ? reviewId : null,
        reviewText: typeof reviewText === "string" ? reviewText : null,
        reviewAuthor: typeof reviewAuthor === "string" ? reviewAuthor : null,
        reviewRating: typeof reviewRating === "number" ? reviewRating : null,
        reviewInitials: typeof reviewInitials === "string" ? reviewInitials : null,
        reviewColor: typeof reviewColor === "string" ? reviewColor : null,
        reviewTimeAgo: typeof reviewTimeAgo === "string" ? reviewTimeAgo : null,
        videoUrl: typeof videoUrl === "string" ? videoUrl : null,
        videoTitle: typeof videoTitle === "string" ? videoTitle : null,
        expiresAt,
      })
      .returning();

    res.json({ pinned: item, message: "Pinned for 90 days" });
  } catch (err) {
    req.log.error({ err }, "POST /business/pinned error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /business/pinned/:id — owner: unpin an item                  */
/* ------------------------------------------------------------------ */
router.delete("/business/pinned/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const itemId = Number(req.params.id);

  try {
    const businessId = await getOwnerBusinessId(req.user.id);
    if (!businessId) { res.status(404).json({ error: "No business found" }); return; }

    const [item] = await db
      .select({ id: pinnedBusinessItemsTable.id })
      .from(pinnedBusinessItemsTable)
      .where(and(eq(pinnedBusinessItemsTable.id, itemId), eq(pinnedBusinessItemsTable.businessId, businessId)))
      .limit(1);

    if (!item) { res.status(404).json({ error: "Pin not found" }); return; }

    await db.update(pinnedBusinessItemsTable).set({ status: "replaced" }).where(eq(pinnedBusinessItemsTable.id, itemId));
    res.json({ message: "Unpinned" });
  } catch (err) {
    req.log.error({ err }, "DELETE /business/pinned/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

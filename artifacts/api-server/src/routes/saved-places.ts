import { Router, type IRouter, type Request, type Response } from "express";
import { db, savedPlacesTable, businessesTable, notificationsTable, pool } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { sendPushToUser } from "../lib/pushNotifications";

const HEALTH_KEYWORDS = ["health", "medical", "clinic", "hospital", "pharmacy", "wellness", "mental", "therapy", "doctor", "dental", "urgent care", "rehabilitation", "counseling", "psychiatr", "addiction"];

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/saved-places", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const places = await db
      .select()
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.userId, req.user!.id));
    res.json({ businessIds: places.map((p) => p.businessId) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch saved places");
    res.status(500).json({ error: "Failed to fetch saved places" });
  }
});

router.post("/saved-places", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { businessId } = req.body as { businessId?: string };
  if (!businessId) {
    res.status(400).json({ error: "businessId required" });
    return;
  }
  try {
    await db
      .insert(savedPlacesTable)
      .values({ userId: req.user!.id, businessId })
      .onConflictDoNothing();
    res.status(201).json({ saved: true });

    // Notify the business owner — fire-and-forget after response sent
    (async () => {
      try {
        const [biz] = await db
          .select({ name: businessesTable.name, submittedById: businessesTable.submittedById })
          .from(businessesTable)
          .where(eq(businessesTable.id, businessId))
          .limit(1);
        const ownerId = biz?.submittedById;
        if (!ownerId || ownerId === req.user!.id) return;
        const title = `⭐ Someone saved ${biz.name}`;
        const body = "A community member just added your business to their saved places.";
        await sendPushToUser(ownerId, { title, body, data: { screen: "business-dashboard", type: "new_save" } });
        await db.insert(notificationsTable).values({
          userId: ownerId,
          type: "business",
          title,
          body,
          entityId: businessId,
          entityType: "business",
        });
      } catch { /* non-critical */ }
    })();
  } catch (err) {
    req.log.error({ err }, "Failed to save place");
    res.status(500).json({ error: "Failed to save place" });
  }
});

router.get("/saved-places/:businessId/count", async (req: Request, res: Response) => {
  const businessId = String(req.params.businessId);
  try {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM saved_places WHERE business_id = $1`,
      [businessId],
    );
    res.json({ count: parseInt(result.rows[0]?.count ?? "0", 10) });
  } catch (err) {
    req.log.error({ err }, "Failed to get save count");
    res.status(500).json({ error: "Failed to get save count" });
  }
});

// POST /saved-places/:businessId/toggle-public — toggle public sharing of a save
router.post("/saved-places/:businessId/toggle-public", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const businessId = String(req.params.businessId);
  try {
    const [existing] = await db
      .select({ isPublic: savedPlacesTable.isPublic })
      .from(savedPlacesTable)
      .where(and(eq(savedPlacesTable.userId, req.user!.id), eq(savedPlacesTable.businessId, businessId)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Saved place not found" });
      return;
    }

    // Check if business category is health-related
    const [biz] = await db
      .select({ category: businessesTable.category, name: businessesTable.name })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    const category = (biz?.category ?? "").toLowerCase();
    const requiresHealthConfirm = HEALTH_KEYWORDS.some((kw) => category.includes(kw));

    const newIsPublic = !existing.isPublic;
    await db
      .update(savedPlacesTable)
      .set({ isPublic: newIsPublic })
      .where(and(eq(savedPlacesTable.userId, req.user!.id), eq(savedPlacesTable.businessId, businessId)));

    res.json({ isPublic: newIsPublic, requiresHealthConfirm, businessName: biz?.name ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to toggle saved place public visibility");
    res.status(500).json({ error: "Failed to update visibility" });
  }
});

// GET /saved-places/public-state — returns { [businessId]: boolean } map for current user
router.get("/saved-places/public-state", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const places = await db
      .select({ businessId: savedPlacesTable.businessId, isPublic: savedPlacesTable.isPublic })
      .from(savedPlacesTable)
      .where(eq(savedPlacesTable.userId, req.user!.id));
    const state: Record<string, boolean> = {};
    for (const p of places) state[p.businessId] = p.isPublic;
    res.json({ publicState: state });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch public state");
    res.status(500).json({ error: "Failed to fetch public state" });
  }
});

router.delete("/saved-places/:businessId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const businessId = String(req.params.businessId);
  try {
    await db
      .delete(savedPlacesTable)
      .where(
        and(
          eq(savedPlacesTable.userId, req.user!.id),
          eq(savedPlacesTable.businessId, businessId),
        ),
      );
    res.json({ removed: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove saved place");
    res.status(500).json({ error: "Failed to remove saved place" });
  }
});

export default router;

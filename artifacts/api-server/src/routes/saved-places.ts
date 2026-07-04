import { Router, type IRouter, type Request, type Response } from "express";
import { db, savedPlacesTable, businessesTable, notificationsTable, pool } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { sendPushToUser } from "../lib/pushNotifications";

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
    res.json({ savedBusinessIds: places.map((p) => p.businessId) });
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

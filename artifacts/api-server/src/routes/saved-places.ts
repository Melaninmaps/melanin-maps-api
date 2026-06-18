import { Router, type IRouter, type Request, type Response } from "express";
import { db, savedPlacesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

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
  } catch (err) {
    req.log.error({ err }, "Failed to save place");
    res.status(500).json({ error: "Failed to save place" });
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

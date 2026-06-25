import { Router, type IRouter, type Request, type Response } from "express";
import { db, savedCommunityLocationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/saved-locations", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const rows = await db
      .select()
      .from(savedCommunityLocationsTable)
      .where(eq(savedCommunityLocationsTable.userId, req.user.id))
      .orderBy(savedCommunityLocationsTable.createdAt);
    res.json({ locations: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch saved locations");
    res.status(500).json({ error: "Failed to fetch saved locations" });
  }
});

router.post("/saved-locations", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { label, city, state, zipCode, neighborhood } = req.body as {
    label?: string; city?: string; state?: string; zipCode?: string; neighborhood?: string;
  };
  if (!label?.trim() || !city?.trim() || !state?.trim()) {
    res.status(400).json({ error: "label, city, and state are required" }); return;
  }
  try {
    const [row] = await db
      .insert(savedCommunityLocationsTable)
      .values({
        userId: req.user.id,
        label: label.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode?.trim() || null,
        neighborhood: neighborhood?.trim() || null,
        isMyComm: false,
      })
      .returning();
    res.status(201).json({ location: row });
  } catch (err) {
    req.log.error({ err }, "Failed to save location");
    res.status(500).json({ error: "Failed to save location" });
  }
});

router.patch("/saved-locations/:id/set-my-community", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db
      .update(savedCommunityLocationsTable)
      .set({ isMyComm: false })
      .where(eq(savedCommunityLocationsTable.userId, req.user.id));
    const [updated] = await db
      .update(savedCommunityLocationsTable)
      .set({ isMyComm: true })
      .where(and(eq(savedCommunityLocationsTable.id, id), eq(savedCommunityLocationsTable.userId, req.user.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Location not found" }); return; }
    res.json({ location: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to set my community");
    res.status(500).json({ error: "Failed to set my community" });
  }
});

router.patch("/saved-locations/:id/unset-my-community", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db
      .update(savedCommunityLocationsTable)
      .set({ isMyComm: false })
      .where(and(eq(savedCommunityLocationsTable.id, id), eq(savedCommunityLocationsTable.userId, req.user.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to unset my community");
    res.status(500).json({ error: "Failed to unset my community" });
  }
});

router.delete("/saved-locations/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db
      .delete(savedCommunityLocationsTable)
      .where(and(eq(savedCommunityLocationsTable.id, id), eq(savedCommunityLocationsTable.userId, req.user.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete saved location");
    res.status(500).json({ error: "Failed to delete saved location" });
  }
});

export default router;

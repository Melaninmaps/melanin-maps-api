import { Router, type IRouter, type Request, type Response } from "express";
import { db, wishlistItemsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/wishlist", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const items = await db
      .select()
      .from(wishlistItemsTable)
      .where(eq(wishlistItemsTable.userId, req.user.id))
      .orderBy(desc(wishlistItemsTable.createdAt));
    res.json({ items });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch wishlist");
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.post("/wishlist", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { businessName, category, city, neighborhood, country, destinationType, description, mustTry, sessionId, notes, nonMinorityOwned, website, location } = req.body as Record<string, unknown>;
  if (!businessName || typeof businessName !== "string") {
    res.status(400).json({ error: "businessName is required" }); return;
  }
  try {
    const [item] = await db.insert(wishlistItemsTable).values({
      userId: req.user.id,
      businessName,
      category: typeof category === "string" ? category : null,
      city: typeof city === "string" ? city : null,
      neighborhood: typeof neighborhood === "string" ? neighborhood : null,
      country: typeof country === "string" ? country : null,
      destinationType: typeof destinationType === "string" ? destinationType : "business",
      description: typeof description === "string" ? description : null,
      mustTry: typeof mustTry === "string" ? mustTry : null,
      sessionId: typeof sessionId === "string" ? sessionId : null,
      notes: typeof notes === "string" ? notes : null,
      nonMinorityOwned: nonMinorityOwned === true,
      website: typeof website === "string" && website.trim() ? website.trim() : null,
      location: typeof location === "string" && location.trim() ? location.trim() : null,
    }).returning();
    res.status(201).json({ item });
  } catch (err) {
    req.log.error({ err }, "Failed to add wishlist item");
    res.status(500).json({ error: "Failed to add item" });
  }
});

router.patch("/wishlist/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  const { notes } = req.body as { notes?: string };
  try {
    const [item] = await db
      .update(wishlistItemsTable)
      .set({ notes: notes ?? null })
      .where(and(eq(wishlistItemsTable.id, id), eq(wishlistItemsTable.userId, req.user.id)))
      .returning();
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    res.json({ item });
  } catch (err) {
    req.log.error({ err }, "Failed to update wishlist item");
    res.status(500).json({ error: "Failed to update item" });
  }
});

router.delete("/wishlist/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db.delete(wishlistItemsTable)
      .where(and(eq(wishlistItemsTable.id, id), eq(wishlistItemsTable.userId, req.user.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete wishlist item");
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, communitySpaceListingsTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { requireTrust } from "../middleware/requireTrust";

const router: IRouter = Router();

router.get("/spaces", async (req: Request, res: Response) => {
  const { city, spaceType, q } = req.query as Record<string, string>;
  const conditions: ReturnType<typeof ilike>[] = [];
  if (city?.trim()) conditions.push(ilike(communitySpaceListingsTable.city, `%${city.trim()}%`));
  if (spaceType?.trim()) conditions.push(eq(communitySpaceListingsTable.spaceType, spaceType.trim()) as any);
  if (q?.trim()) {
    conditions.push(
      or(
        ilike(communitySpaceListingsTable.title, `%${q.trim()}%`),
        ilike(communitySpaceListingsTable.description, `%${q.trim()}%`),
        ilike(communitySpaceListingsTable.neighborhood, `%${q.trim()}%`),
        ilike(communitySpaceListingsTable.city, `%${q.trim()}%`),
        ilike(communitySpaceListingsTable.address, `%${q.trim()}%`),
      ) as any
    );
  }
  const rows = await db
    .select()
    .from(communitySpaceListingsTable)
    .where(and(eq(communitySpaceListingsTable.isAvailable, true), ...conditions))
    .orderBy(desc(communitySpaceListingsTable.createdAt))
    .limit(50);
  res.json({ spaces: rows });
});

router.get("/spaces/:id", async (req: Request, res: Response) => {
  const [row] = await db
    .select()
    .from(communitySpaceListingsTable)
    .where(eq(communitySpaceListingsTable.id, String(req.params.id)))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ space: row });
});

router.post("/spaces", requireTrust, async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const {
    title, description, address, neighborhood, city, state, zipCode,
    spaceType, priceLabel, sqft, listingUrl,
    agentName, agentPhone, agentEmail, agentUrl,
  } = req.body as Record<string, unknown>;

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" }); return;
  }
  if (!city || typeof city !== "string" || !city.trim()) {
    res.status(400).json({ error: "city is required" }); return;
  }
  const validTypes = ["rent", "sale", "business", "residential"];
  const resolvedType = typeof spaceType === "string" && validTypes.includes(spaceType) ? spaceType : "rent";

  const postedByName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member";

  const [row] = await db
    .insert(communitySpaceListingsTable)
    .values({
      postedById: req.user.id,
      postedByName,
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      address: typeof address === "string" && address.trim() ? address.trim() : null,
      neighborhood: typeof neighborhood === "string" && neighborhood.trim() ? neighborhood.trim() : null,
      city: (city as string).trim(),
      state: typeof state === "string" && state.trim() ? state.trim() : null,
      zipCode: typeof zipCode === "string" && zipCode.trim() ? zipCode.trim() : null,
      spaceType: resolvedType,
      priceLabel: typeof priceLabel === "string" && priceLabel.trim() ? priceLabel.trim() : null,
      sqft: typeof sqft === "number" && sqft > 0 ? sqft : null,
      listingUrl: typeof listingUrl === "string" && listingUrl.trim() ? listingUrl.trim() : null,
      agentName: typeof agentName === "string" && agentName.trim() ? agentName.trim() : null,
      agentPhone: typeof agentPhone === "string" && agentPhone.trim() ? agentPhone.trim() : null,
      agentEmail: typeof agentEmail === "string" && agentEmail.trim() ? agentEmail.trim() : null,
      agentUrl: typeof agentUrl === "string" && agentUrl.trim() ? agentUrl.trim() : null,
    })
    .returning();
  res.status(201).json({ space: row });
});

router.patch("/spaces/:id", requireTrust, async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const [existing] = await db
    .select({ postedById: communitySpaceListingsTable.postedById })
    .from(communitySpaceListingsTable)
    .where(eq(communitySpaceListingsTable.id, String(req.params.id)))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.postedById !== req.user.id) { res.status(403).json({ error: "Not your listing" }); return; }

  const allowed = ["title","description","address","neighborhood","city","state","spaceType","priceLabel","sqft","listingUrl","agentName","agentPhone","agentEmail","agentUrl","isAvailable"] as const;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in req.body) updates[key] = (req.body as Record<string, unknown>)[key];
  }
  const [row] = await db
    .update(communitySpaceListingsTable)
    .set(updates as any)
    .where(eq(communitySpaceListingsTable.id, String(req.params.id)))
    .returning();
  res.json({ space: row });
});

router.delete("/spaces/:id", requireTrust, async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const [existing] = await db
    .select({ postedById: communitySpaceListingsTable.postedById })
    .from(communitySpaceListingsTable)
    .where(eq(communitySpaceListingsTable.id, String(req.params.id)))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.postedById !== req.user.id) { res.status(403).json({ error: "Not your listing" }); return; }
  await db
    .update(communitySpaceListingsTable)
    .set({ isAvailable: false, updatedAt: new Date() })
    .where(eq(communitySpaceListingsTable.id, String(req.params.id)));
  res.json({ ok: true });
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, flashDealsTable } from "@workspace/db";
import { eq, and, gt, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/deals/:businessId", async (req: Request, res: Response) => {
  const { businessId } = req.params as { businessId: string };
  try {
    const now = new Date();
    const deals = await db
      .select()
      .from(flashDealsTable)
      .where(
        and(
          eq(flashDealsTable.businessId, businessId),
          eq(flashDealsTable.isActive, true),
        ),
      )
      .orderBy(desc(flashDealsTable.createdAt))
      .limit(5);
    const active = deals.filter((d) => !d.expiresAt || d.expiresAt > now);
    res.json({ deals: active });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch deals");
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

router.post("/deals", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, title, description, discountText, expiresAt } = req.body as {
    businessId?: string;
    title?: string;
    description?: string;
    discountText?: string;
    expiresAt?: string;
  };
  if (!businessId || !title?.trim()) {
    res.status(400).json({ error: "businessId and title required" });
    return;
  }
  try {
    const [deal] = await db
      .insert(flashDealsTable)
      .values({
        businessId,
        createdBy: req.user.id,
        title: title.trim(),
        description: description?.trim() ?? null,
        discountText: discountText?.trim() ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      })
      .returning();
    res.status(201).json({ deal });
  } catch (err) {
    req.log.error({ err }, "Failed to create deal");
    res.status(500).json({ error: "Failed to create deal" });
  }
});

router.delete("/deals/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { id } = req.params as { id: string };
  try {
    await db
      .update(flashDealsTable)
      .set({ isActive: false })
      .where(and(eq(flashDealsTable.id, id), eq(flashDealsTable.createdBy, req.user.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete deal");
    res.status(500).json({ error: "Failed to delete deal" });
  }
});

export default router;

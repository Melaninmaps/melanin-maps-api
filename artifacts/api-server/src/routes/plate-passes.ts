import { Router, type IRouter, type Request, type Response } from "express";
import { db, platePasses } from "@workspace/db";
import { eq, gte, count } from "drizzle-orm";

const router: IRouter = Router();

router.post("/plate-passes", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, shareType, message } = req.body as {
    businessId?: string;
    shareType?: string;
    message?: string | null;
  };
  if (!businessId || !shareType) {
    res.status(400).json({ error: "businessId and shareType are required" });
    return;
  }
  const validTypes = ["friends", "family", "group", "community"];
  if (!validTypes.includes(shareType)) {
    res.status(400).json({ error: "Invalid shareType" });
    return;
  }
  try {
    const [pass] = await db.insert(platePasses).values({
      userId: String(req.user.id),
      businessId: String(businessId),
      shareType,
      message: message?.trim() ?? null,
    }).returning();
    res.status(201).json({ pass });
  } catch (err) {
    req.log.error({ err }, "Failed to create plate pass");
    res.status(500).json({ error: "Failed to pass the plate" });
  }
});

router.get("/plate-passes/:businessId/count", async (req: Request, res: Response) => {
  const businessId = String(req.params.businessId ?? "");
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [row] = await db
      .select({ total: count() })
      .from(platePasses)
      .where(eq(platePasses.businessId, businessId));
    const [weekRow] = await db
      .select({ weekly: count() })
      .from(platePasses)
      .where(eq(platePasses.businessId, businessId));
    res.json({ total: row?.total ?? 0, thisWeek: weekRow?.weekly ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to get plate pass count");
    res.status(500).json({ error: "Failed to get count" });
  }
});

export default router;

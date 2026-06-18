import { Router, type IRouter, type Request, type Response } from "express";
import { db, checkInsTable, pointsLedgerTable, POINTS_VALUES } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/checkins", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId } = req.body as { businessId?: string };
  if (!businessId) {
    res.status(400).json({ error: "businessId required" });
    return;
  }
  try {
    const [checkIn] = await db
      .insert(checkInsTable)
      .values({ userId: req.user.id, businessId })
      .returning();

    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "checkin",
      points: POINTS_VALUES.checkin,
      entityId: businessId,
    });

    res.status(201).json({ checkIn, pointsEarned: POINTS_VALUES.checkin });
  } catch (err) {
    req.log.error({ err }, "Failed to check in");
    res.status(500).json({ error: "Failed to check in" });
  }
});

router.get("/checkins/user", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const checkIns = await db
      .select()
      .from(checkInsTable)
      .where(eq(checkInsTable.userId, req.user.id))
      .orderBy(desc(checkInsTable.createdAt))
      .limit(50);
    res.json({ checkIns });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch check-ins");
    res.status(500).json({ error: "Failed to fetch check-ins" });
  }
});

export default router;

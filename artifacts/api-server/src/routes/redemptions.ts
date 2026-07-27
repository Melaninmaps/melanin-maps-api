import { Router, type IRouter, type Request, type Response } from "express";
import { db, pointsRedemptionsTable, pointsLedgerTable, REDEMPTION_REWARDS } from "@workspace/db";
import { eq, desc, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rewards", (_req: Request, res: Response) => {
  res.json({ rewards: REDEMPTION_REWARDS });
});

router.get("/redemptions", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const redemptions = await db
      .select()
      .from(pointsRedemptionsTable)
      .where(eq(pointsRedemptionsTable.userId, req.user.id))
      .orderBy(desc(pointsRedemptionsTable.createdAt))
      .limit(20);
    res.json({ redemptions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch redemptions");
    res.status(500).json({ error: "Failed to fetch redemptions" });
  }
});

router.post("/redemptions", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { rewardId } = req.body as { rewardId?: string };
  if (!rewardId) {
    res.status(400).json({ error: "rewardId required" });
    return;
  }
  const reward = REDEMPTION_REWARDS.find((r) => r.id === rewardId);
  if (!reward) {
    res.status(404).json({ error: "Reward not found" });
    return;
  }
  try {
    const ledger = await db
      .select()
      .from(pointsLedgerTable)
      .where(eq(pointsLedgerTable.userId, req.user.id));
    const total = ledger.reduce((acc, e) => acc + e.points, 0);
    if (total < reward.pointsCost) {
      res.status(400).json({ error: `Not enough points. You have ${total}, need ${reward.pointsCost}.` });
      return;
    }
    const [redemption] = await db.transaction(async (tx) => {
      const [r] = await tx
        .insert(pointsRedemptionsTable)
        .values({
          userId: req.user!.id,
          rewardId: reward.id,
          rewardTitle: reward.title,
          pointsCost: reward.pointsCost,
          status: "pending",
        })
        .returning();
      await tx.insert(pointsLedgerTable).values({
        userId: req.user!.id,
        action: "redemption",
        points: -reward.pointsCost,
        entityId: r.id,
      });
      return [r];
    });
    res.status(201).json({ redemption, pointsSpent: reward.pointsCost });
  } catch (err) {
    req.log.error({ err }, "Failed to redeem points");
    res.status(500).json({ error: "Failed to redeem points" });
  }
});

export default router;

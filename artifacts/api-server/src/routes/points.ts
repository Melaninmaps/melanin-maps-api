import { Router, type IRouter, type Request, type Response } from "express";
import { db, pointsLedgerTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/points", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const ledger = await db
      .select()
      .from(pointsLedgerTable)
      .where(eq(pointsLedgerTable.userId, req.user.id))
      .orderBy(desc(pointsLedgerTable.createdAt))
      .limit(100);

    const total = ledger.reduce((acc, entry) => acc + entry.points, 0);
    res.json({ total, ledger });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch points");
    res.status(500).json({ error: "Failed to fetch points" });
  }
});

export default router;

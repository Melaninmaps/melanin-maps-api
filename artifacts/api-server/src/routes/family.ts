import { Router, type IRouter, type Request, type Response } from "express";
import { db, contentFilterViolationsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/family/violations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const violations = await db
      .select()
      .from(contentFilterViolationsTable)
      .where(eq(contentFilterViolationsTable.userId, req.user.id))
      .orderBy(desc(contentFilterViolationsTable.createdAt))
      .limit(100);
    res.json({ violations });
  } catch (err) {
    req.log.error({ err }, "GET /family/violations error");
    res.status(500).json({ error: "Failed to load violations" });
  }
});

export default router;

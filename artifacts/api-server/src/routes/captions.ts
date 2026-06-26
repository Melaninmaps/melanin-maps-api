import { Router, type IRouter } from "express";
import { db, businessCaptionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/captions/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const rows = await db
      .select({
        caption: businessCaptionsTable.caption,
        count: sql<number>`count(*)::int`,
      })
      .from(businessCaptionsTable)
      .where(eq(businessCaptionsTable.businessId, businessId))
      .groupBy(businessCaptionsTable.caption)
      .orderBy(sql`count(*) desc`)
      .limit(20);
    res.json({ captions: rows });
  } catch {
    res.json({ captions: [] });
  }
});

router.post("/captions/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId: string | null = (req as any).user?.id ?? null;
    const { captions } = req.body as { captions?: unknown };
    if (!Array.isArray(captions) || captions.length === 0) {
      res.status(400).json({ error: "captions required" });
      return;
    }
    const limited: string[] = (captions as string[]).slice(0, 10);

    if (userId) {
      await db
        .delete(businessCaptionsTable)
        .where(
          and(
            eq(businessCaptionsTable.businessId, businessId),
            eq(businessCaptionsTable.userId, userId)
          )
        );
    }

    await db.insert(businessCaptionsTable).values(
      limited.map((caption) => ({ businessId, userId, caption }))
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
});

export default router;

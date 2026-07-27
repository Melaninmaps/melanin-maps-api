import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessCaptionsTable, businessesTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email) || user.role === "admin";
}

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

router.get("/admin/captions", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const rows = await db
      .select({
        businessId: businessCaptionsTable.businessId,
        businessName: businessesTable.name,
        caption: businessCaptionsTable.caption,
        count: sql<number>`count(*)::int`,
      })
      .from(businessCaptionsTable)
      .leftJoin(businessesTable, eq(businessCaptionsTable.businessId, businessesTable.id))
      .groupBy(businessCaptionsTable.businessId, businessCaptionsTable.caption, businessesTable.name)
      .orderBy(desc(sql`count(*)`))
      .limit(200);
    res.json({ captions: rows });
  } catch {
    res.json({ captions: [] });
  }
});

router.delete("/admin/captions", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { businessId, caption } = req.body as { businessId?: string; caption?: string };
  if (!businessId || !caption) { res.status(400).json({ error: "businessId and caption required" }); return; }
  try {
    await db
      .delete(businessCaptionsTable)
      .where(and(eq(businessCaptionsTable.businessId, businessId), eq(businessCaptionsTable.caption, caption)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to remove caption" });
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

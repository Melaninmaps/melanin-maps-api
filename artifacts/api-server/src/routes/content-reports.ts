import { Router, type IRouter, type Request, type Response } from "express";
import { db, contentReportsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { reportLimiter } from "../middleware/rateLimiter";

const router: IRouter = Router();

const VALID_TARGET_TYPES = ["review", "survey", "business", "post", "user"] as const;
const VALID_REASONS = ["spam", "fake", "inappropriate", "harassment", "incorrect_info", "other"] as const;

router.post("/reports", reportLimiter, async (req: any, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }

  const { targetType, targetId, reason, description } = req.body as {
    targetType?: string;
    targetId?: string;
    reason?: string;
    description?: string;
  };

  if (!targetType || !VALID_TARGET_TYPES.includes(targetType as any)) {
    res.status(400).json({ error: "Invalid targetType" }); return;
  }
  if (!targetId) { res.status(400).json({ error: "targetId is required" }); return; }
  if (!reason || !VALID_REASONS.includes(reason as any)) {
    res.status(400).json({ error: "Invalid reason" }); return;
  }

  try {
    const [report] = await db.insert(contentReportsTable).values({
      reporterId: req.user.id,
      targetType: targetType as typeof VALID_TARGET_TYPES[number],
      targetId,
      reason: reason as typeof VALID_REASONS[number],
      description: description?.slice(0, 1000),
    }).returning();
    res.status(201).json({ report });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create content report");
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.get("/admin/reports", async (req: any, res: Response): Promise<void> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!req.user?.email || !ADMIN_EMAILS.includes(req.user.email)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  try {
    const reports = await db.select().from(contentReportsTable).orderBy(desc(contentReportsTable.createdAt)).limit(200);
    res.json({ reports });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.patch("/admin/reports/:id", async (req: any, res: Response): Promise<void> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!req.user?.email || !ADMIN_EMAILS.includes(req.user.email)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { status } = req.body as { status?: string };
  const allowed = ["pending", "reviewed", "dismissed", "actioned"];
  if (!status || !allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  try {
    const [updated] = await db
      .update(contentReportsTable)
      .set({ status: status as any })
      .where(eq(contentReportsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Report not found" }); return; }
    res.json({ report: updated });
  } catch (err: any) {
    req.log.error({ err }, "Failed to update report");
    res.status(500).json({ error: "Failed to update report" });
  }
});

export default router;

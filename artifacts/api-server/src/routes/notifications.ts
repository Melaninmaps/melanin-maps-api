import { Router, type IRouter, type Request, type Response } from "express";
import { db, pushTokensTable, userPreferencesTable, kinfolkFeedbackTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/notifications/register", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { token, platform } = req.body as { token?: string; platform?: string };
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token is required" }); return;
  }
  try {
    await db
      .insert(pushTokensTable)
      .values({
        userId: req.user.id,
        token,
        platform: platform ?? "unknown",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushTokensTable.userId,
        set: { token, platform: platform ?? "unknown", updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to register push token");
    res.status(500).json({ error: "Failed to register token" });
  }
});

router.delete("/notifications/register", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db.delete(pushTokensTable).where(eq(pushTokensTable.userId, req.user.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to unregister push token");
    res.status(500).json({ error: "Failed to unregister token" });
  }
});

export default router;

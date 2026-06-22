import { Router, type IRouter, type Request, type Response } from "express";
import { db, pushTokensTable, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.user.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json({ notifications: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notifications");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/notifications/mark-all-read", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, req.user.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark all notifications read");
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

router.post("/notifications/:id/read", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(
        and(
          eq(notificationsTable.id, req.params.id),
          eq(notificationsTable.userId, req.user.id),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark notification read");
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

router.post("/notifications/register", async (req: Request, res: Response): Promise<void> => {
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

router.delete("/notifications/register", async (req: Request, res: Response): Promise<void> => {
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

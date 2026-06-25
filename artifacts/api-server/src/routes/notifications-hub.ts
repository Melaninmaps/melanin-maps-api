import { Router, type IRouter, type Request, type Response } from "express";
import { db, notificationsTable, notificationPreferencesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

const ALL_TOPICS = ["community", "safety", "business", "events", "knowledge", "travel", "health", "marketplace", "journey", "challenge"];

router.get("/notifications", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { limit = "30", unreadOnly = "false" } = req.query as Record<string, string>;

  try {
    let query = db
      .select()
      .from(notificationsTable)
      .where(
        unreadOnly === "true"
          ? and(eq(notificationsTable.userId, req.user.id), eq(notificationsTable.read, false))
          : eq(notificationsTable.userId, req.user.id),
      )
      .orderBy(desc(notificationsTable.createdAt))
      .limit(parseInt(limit, 10));

    const notifications = await query;
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notifications");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark notification read");
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/notifications/read-all", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.userId, req.user.id), eq(notificationsTable.read, false)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark all read");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/notifications/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const [prefs] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, req.user.id))
      .limit(1);
    res.json({
      preferences: prefs ?? { userId: req.user.id, topics: ["community", "safety", "events", "business"], pushEnabled: true, emailEnabled: false },
      allTopics: ALL_TOPICS,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notification preferences");
    res.status(500).json({ error: "Failed" });
  }
});

router.put("/notifications/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { topics, pushEnabled, emailEnabled } = req.body as { topics?: string[]; pushEnabled?: boolean; emailEnabled?: boolean };

  const validTopics = Array.isArray(topics) ? topics.filter((t) => ALL_TOPICS.includes(t)) : undefined;

  try {
    const [prefs] = await db
      .insert(notificationPreferencesTable)
      .values({
        userId: req.user.id,
        topics: validTopics ?? ["community", "safety", "events", "business"],
        pushEnabled: typeof pushEnabled === "boolean" ? pushEnabled : true,
        emailEnabled: typeof emailEnabled === "boolean" ? emailEnabled : false,
      })
      .onConflictDoUpdate({
        target: notificationPreferencesTable.userId,
        set: {
          ...(validTopics && { topics: validTopics }),
          ...(typeof pushEnabled === "boolean" && { pushEnabled }),
          ...(typeof emailEnabled === "boolean" && { emailEnabled }),
        },
      })
      .returning();
    res.json({ preferences: prefs });
  } catch (err) {
    req.log.error({ err }, "Failed to update notification preferences");
    res.status(500).json({ error: "Failed" });
  }
});

export async function createNotification(
  userId: string,
  notification: { title: string; body: string; type: any; entityId?: string; entityType?: string; data?: Record<string, unknown> }
) {
  try {
    await db.insert(notificationsTable).values({ userId, ...notification });
  } catch { /* non-critical */ }
}

export default router;

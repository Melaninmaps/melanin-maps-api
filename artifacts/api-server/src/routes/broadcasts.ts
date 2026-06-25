import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessBroadcastsTable, businessNotificationPrefsTable, savedPlacesTable, pushTokensTable, BROADCAST_QUOTA, BROADCAST_TYPES, type BroadcastType } from "@workspace/db";
import { eq, and, gte, count, inArray } from "drizzle-orm";

const router: IRouter = Router();

// ─── Expo Push API helper ──────────────────────────────────────────────────────
async function sendExpoPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<number> {
  if (!tokens.length) return 0;
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) chunks.push(tokens.slice(i, i + 100));

  let delivered = 0;
  for (const chunk of chunks) {
    try {
      const messages = chunk
        .filter(t => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
        .map(to => ({ to, title, body, data, sound: "default" }));
      if (!messages.length) continue;
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
        body: JSON.stringify(messages),
      });
      if (res.ok) delivered += messages.length;
    } catch { /* non-fatal */ }
  }
  return delivered;
}

// ─── Quota helpers ─────────────────────────────────────────────────────────────
async function getQuotaInfo(businessId: string, tier: string, isEmergency: boolean) {
  if (isEmergency) return { used: 0, limit: Infinity, remaining: Infinity };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ used }] = await db
    .select({ used: count() })
    .from(businessBroadcastsTable)
    .where(and(
      eq(businessBroadcastsTable.businessId, businessId),
      gte(businessBroadcastsTable.createdAt, monthStart),
    ));

  const limit = BROADCAST_QUOTA[tier] ?? BROADCAST_QUOTA.free;
  return { used: Number(used), limit, remaining: Math.max(0, limit - Number(used)) };
}

// ─── GET /api/businesses/mine/broadcast-quota ─────────────────────────────────
router.get("/businesses/mine/broadcast-quota", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [biz] = await db
    .select({ id: businessesTable.id, marketplaceTier: businessesTable.marketplaceTier })
    .from(businessesTable)
    .where(eq(businessesTable.submittedById, req.user.id))
    .limit(1);
  if (!biz) { res.status(404).json({ error: "No business found" }); return; }

  const quota = await getQuotaInfo(biz.id, biz.marketplaceTier ?? "free", false);
  res.json({ ...quota, tier: biz.marketplaceTier ?? "free" });
});

// ─── GET /api/businesses/mine/broadcasts ──────────────────────────────────────
router.get("/businesses/mine/broadcasts", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [biz] = await db
    .select({ id: businessesTable.id, marketplaceTier: businessesTable.marketplaceTier })
    .from(businessesTable)
    .where(eq(businessesTable.submittedById, req.user.id))
    .limit(1);
  if (!biz) { res.status(404).json({ error: "No business found" }); return; }

  const broadcasts = await db
    .select()
    .from(businessBroadcastsTable)
    .where(eq(businessBroadcastsTable.businessId, biz.id))
    .orderBy(businessBroadcastsTable.createdAt)
    .limit(50);

  const quota = await getQuotaInfo(biz.id, biz.marketplaceTier ?? "free", false);
  res.json({ broadcasts: broadcasts.reverse(), quota, tier: biz.marketplaceTier ?? "free" });
});

// ─── POST /api/businesses/mine/broadcasts ─────────────────────────────────────
router.post("/businesses/mine/broadcasts", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { type, title, body } = req.body as { type?: string; title?: string; body?: string };

  if (!type || !BROADCAST_TYPES.includes(type as BroadcastType)) {
    res.status(400).json({ error: `type must be one of: ${BROADCAST_TYPES.join(", ")}` }); return;
  }
  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }
  if (!body?.trim()) { res.status(400).json({ error: "body required" }); return; }
  if (title.length > 200) { res.status(400).json({ error: "title max 200 chars" }); return; }
  if (body.length > 1000) { res.status(400).json({ error: "body max 1000 chars" }); return; }

  const [biz] = await db
    .select({ id: businessesTable.id, name: businessesTable.name, marketplaceTier: businessesTable.marketplaceTier })
    .from(businessesTable)
    .where(eq(businessesTable.submittedById, req.user.id))
    .limit(1);
  if (!biz) { res.status(404).json({ error: "No business found" }); return; }

  const isEmergency = type === "emergency";
  const quota = await getQuotaInfo(biz.id, biz.marketplaceTier ?? "free", isEmergency);

  if (!isEmergency && quota.remaining === 0) {
    res.status(429).json({
      error: "Monthly broadcast limit reached",
      quota: { used: quota.used, limit: quota.limit, remaining: 0 },
    });
    return;
  }

  // Find subscribers: users who saved this business and have matching prefs
  const savedRows = await db
    .select({ userId: savedPlacesTable.userId })
    .from(savedPlacesTable)
    .where(eq(savedPlacesTable.businessId, biz.id));

  if (!savedRows.length) {
    const [broadcast] = await db.insert(businessBroadcastsTable).values({
      businessId: biz.id,
      businessName: biz.name,
      type: type as BroadcastType,
      title: title.trim(),
      body: body.trim(),
      recipientCount: 0,
      deliveredCount: 0,
    }).returning();
    res.json({ broadcast, delivered: 0, message: "No followers yet — broadcast saved." });
    return;
  }

  const userIds = savedRows.map(r => r.userId);

  // Filter by notification prefs — only users who want this type and aren't paused/never
  const prefs = await db
    .select()
    .from(businessNotificationPrefsTable)
    .where(and(
      eq(businessNotificationPrefsTable.businessId, biz.id),
      inArray(businessNotificationPrefsTable.userId, userIds),
    ));

  const now = new Date();
  const prefsMap = new Map(prefs.map(p => [p.userId, p]));

  // Users with no prefs get the default: immediate delivery for event/offer/community/emergency
  const DEFAULT_TYPES: BroadcastType[] = ["event", "offer", "community", "emergency"];
  const eligibleUserIds = userIds.filter(uid => {
    const p = prefsMap.get(uid);
    if (!p) {
      // Default: immediate, default types
      return DEFAULT_TYPES.includes(type as BroadcastType);
    }
    if (p.frequency === "never") return false;
    if (p.pausedUntil && p.pausedUntil > now) return false;
    if (p.frequency !== "immediate" && !isEmergency) return false; // digest users skip immediate
    return (p.enabledTypes as BroadcastType[]).includes(type as BroadcastType);
  });

  // Fetch push tokens for eligible users
  let deliveredCount = 0;
  if (eligibleUserIds.length) {
    const tokenRows = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, eligibleUserIds));

    const tokens = tokenRows.map(r => r.token).filter(Boolean);
    deliveredCount = await sendExpoPushNotifications(
      tokens,
      `${biz.name}: ${title.trim()}`,
      body.trim(),
      { businessId: biz.id, type, broadcastType: type },
    );
  }

  const [broadcast] = await db.insert(businessBroadcastsTable).values({
    businessId: biz.id,
    businessName: biz.name,
    type: type as BroadcastType,
    title: title.trim(),
    body: body.trim(),
    recipientCount: eligibleUserIds.length,
    deliveredCount,
  }).returning();

  req.log.info({ businessId: biz.id, type, recipientCount: eligibleUserIds.length, deliveredCount }, "Broadcast sent");
  res.json({ broadcast, delivered: deliveredCount, recipients: eligibleUserIds.length });
});

// ─── GET /api/businesses/:id/notification-prefs ────────────────────────────────
router.get("/businesses/:id/notification-prefs", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const businessId = String(req.params.id);

  const [prefs] = await db
    .select()
    .from(businessNotificationPrefsTable)
    .where(and(
      eq(businessNotificationPrefsTable.userId, req.user.id),
      eq(businessNotificationPrefsTable.businessId, businessId),
    ))
    .limit(1);

  res.json({
    prefs: prefs ?? {
      userId: req.user.id,
      businessId,
      enabledTypes: ["event", "offer", "community", "emergency"],
      frequency: "immediate",
      pausedUntil: null,
    },
  });
});

// ─── PATCH /api/businesses/:id/notification-prefs ─────────────────────────────
router.patch("/businesses/:id/notification-prefs", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const businessId = String(req.params.id);

  const { enabledTypes, frequency, pausedUntil } = req.body as {
    enabledTypes?: string[];
    frequency?: string;
    pausedUntil?: string | null;
  };

  const validTypes: BroadcastType[] = Array.isArray(enabledTypes)
    ? (enabledTypes.filter(t => BROADCAST_TYPES.includes(t as BroadcastType)) as BroadcastType[])
    : ["event", "offer", "community", "emergency"];

  const validFrequency = ["immediate", "daily_digest", "weekly_digest", "never"].includes(frequency ?? "")
    ? (frequency as "immediate" | "daily_digest" | "weekly_digest" | "never")
    : "immediate";

  const pausedUntilDate = pausedUntil ? new Date(pausedUntil) : null;

  const [existing] = await db
    .select({ id: businessNotificationPrefsTable.id })
    .from(businessNotificationPrefsTable)
    .where(and(
      eq(businessNotificationPrefsTable.userId, req.user.id),
      eq(businessNotificationPrefsTable.businessId, businessId),
    ))
    .limit(1);

  let prefs;
  if (existing) {
    [prefs] = await db
      .update(businessNotificationPrefsTable)
      .set({ enabledTypes: validTypes, frequency: validFrequency, pausedUntil: pausedUntilDate })
      .where(and(
        eq(businessNotificationPrefsTable.userId, req.user.id),
        eq(businessNotificationPrefsTable.businessId, businessId),
      ))
      .returning();
  } else {
    [prefs] = await db
      .insert(businessNotificationPrefsTable)
      .values({ userId: req.user.id, businessId, enabledTypes: validTypes, frequency: validFrequency, pausedUntil: pausedUntilDate })
      .returning();
  }

  res.json({ prefs });
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  return req.user.id;
}

const DEFAULT_SETTINGS = {
  notifEvents: true,
  notifBusiness: true,
  notifMessages: true,
  notifReviews: true,
  notifCommunity: false,
  notifPromotions: false,
  notifDigest: true,
  notifTips: false,
  notifPostNudges: true,
  quietHoursEnabled: true,
  quietHoursFrom: "10:00 PM",
  quietHoursUntil: "8:00 AM",
  profileVisibility: "community" as const,
  showLocation: true,
  locationPrecision: "neighborhood" as const,
  activityStatus: true,
  usageAnalytics: true,
  personalisedSuggestions: true,
  kinfolkMemoryEnabled: true,
  profileViewTrackingEnabled: true,
  postNudgesEnabled: true,
  safetyAlertPolice: true,
  safetyAlertIce: true,
  safetyAlertRadiusMiles: 5,
};

// ─── GET /api/users/settings ─────────────────────────────────────────────────
router.get("/users/settings", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const [row] = await db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1);

    res.json(row ?? { userId, ...DEFAULT_SETTINGS });
  } catch (err) {
    req.log.error({ err }, "GET /users/settings error");
    res.status(500).json({ error: "Failed to load settings." });
  }
});

type SettingsPatch = Partial<{
  notifEvents: boolean; notifBusiness: boolean; notifMessages: boolean;
  notifReviews: boolean; notifCommunity: boolean; notifPromotions: boolean;
  notifDigest: boolean; notifTips: boolean; notifPostNudges: boolean;
  quietHoursEnabled: boolean; quietHoursFrom: string; quietHoursUntil: string;
  profileVisibility: "public" | "community" | "private";
  showLocation: boolean; locationPrecision: "neighborhood" | "exact";
  activityStatus: boolean; usageAnalytics: boolean; personalisedSuggestions: boolean;
  kinfolkMemoryEnabled: boolean; profileViewTrackingEnabled: boolean; postNudgesEnabled: boolean;
  safetyAlertPolice: boolean; safetyAlertIce: boolean; safetyAlertRadiusMiles: number;
}>;

function parseSettingsPatch(body: unknown): { ok: true; data: SettingsPatch } | { ok: false } {
  if (!body || typeof body !== "object") return { ok: false };
  const b = body as Record<string, unknown>;
  const BOOLS = [
    "notifEvents", "notifBusiness", "notifMessages", "notifReviews", "notifCommunity",
    "notifPromotions", "notifDigest", "notifTips", "notifPostNudges", "quietHoursEnabled",
    "showLocation", "activityStatus", "usageAnalytics", "personalisedSuggestions",
    "kinfolkMemoryEnabled", "profileViewTrackingEnabled", "postNudgesEnabled",
    "safetyAlertPolice", "safetyAlertIce",
  ] as const;
  const data: SettingsPatch = {};
  for (const k of BOOLS) {
    if (k in b) {
      if (typeof b[k] !== "boolean") return { ok: false };
      (data as Record<string, unknown>)[k] = b[k];
    }
  }
  if ("quietHoursFrom" in b) { if (typeof b.quietHoursFrom !== "string") return { ok: false }; data.quietHoursFrom = b.quietHoursFrom; }
  if ("quietHoursUntil" in b) { if (typeof b.quietHoursUntil !== "string") return { ok: false }; data.quietHoursUntil = b.quietHoursUntil; }
  if ("safetyAlertRadiusMiles" in b) {
    const r = Number(b.safetyAlertRadiusMiles);
    if (!Number.isInteger(r) || r < 1 || r > 10) return { ok: false };
    data.safetyAlertRadiusMiles = r;
  }
  if ("profileVisibility" in b) {
    if (!["public", "community", "private"].includes(b.profileVisibility as string)) return { ok: false };
    data.profileVisibility = b.profileVisibility as "public" | "community" | "private";
  }
  if ("locationPrecision" in b) {
    if (!["neighborhood", "exact"].includes(b.locationPrecision as string)) return { ok: false };
    data.locationPrecision = b.locationPrecision as "neighborhood" | "exact";
  }
  return { ok: true, data };
}

// ─── PUT /api/users/settings ──────────────────────────────────────────────────
router.put("/users/settings", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = parseSettingsPatch(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: "Invalid settings payload." });
    return;
  }

  try {
    const [existing] = await db
      .select({ userId: userSettingsTable.userId })
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userSettingsTable)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(userSettingsTable.userId, userId))
        .returning();
      res.json(updated);
    } else {
      const [inserted] = await db
        .insert(userSettingsTable)
        .values({ userId, ...DEFAULT_SETTINGS, ...parsed.data })
        .returning();
      res.json(inserted);
    }
  } catch (err) {
    req.log.error({ err }, "PUT /users/settings error");
    res.status(500).json({ error: "Failed to save settings." });
  }
});

export default router;

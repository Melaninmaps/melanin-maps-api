import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isKinfolkPrivateMemoryEnabled } from "../kinfolk/private-memory";

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
  notifReminders: true,
  arrivalAwarenessEnabled: false,
  notifPostNudges: true,
  // Official-source public alerts are explicitly opt-in. Keep them separate
  // from existing community safety behavior and Kinfolk preference memory.
  notifProductRecalls: false,
  notifPublicHealthAlerts: false,
  quietHoursEnabled: true,
  quietHoursFrom: "10:00 PM",
  quietHoursUntil: "8:00 AM",
  profileVisibility: "community" as const,
  showLocation: true,
  locationPrecision: "neighborhood" as const,
  activityStatus: true,
  usageAnalytics: true,
  personalisedSuggestions: true,
  // A missing production setting must not imply consent to persist chat history.
  kinfolkMemoryEnabled: isKinfolkPrivateMemoryEnabled(),
  profileViewTrackingEnabled: true,
  postNudgesEnabled: true,
  // Police/ICE alerts are an affirmative, separate choice. A missing settings
  // row must never be treated as consent to receive sensitive safety alerts.
  safetyAlertPolice: false,
  safetyAlertIce: false,
  safetyAlertRadiusMiles: 5,
  safetyAlertAreaCity: null,
  safetyAlertAreaState: null,
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

    const settings = row ?? { userId, ...DEFAULT_SETTINGS };
    res.json({
      ...settings,
      kinfolkMemoryEnabled: isKinfolkPrivateMemoryEnabled() && settings.kinfolkMemoryEnabled,
    });
  } catch (err) {
    req.log.error({ err }, "GET /users/settings error");
    res.status(500).json({ error: "Failed to load settings." });
  }
});

type SettingsPatch = Partial<{
  notifEvents: boolean; notifBusiness: boolean; notifMessages: boolean;
  notifReviews: boolean; notifCommunity: boolean; notifPromotions: boolean;
  notifDigest: boolean; notifTips: boolean; notifReminders: boolean; arrivalAwarenessEnabled: boolean; notifPostNudges: boolean;
  notifProductRecalls: boolean; notifPublicHealthAlerts: boolean;
  quietHoursEnabled: boolean; quietHoursFrom: string; quietHoursUntil: string;
  profileVisibility: "public" | "community" | "private";
  showLocation: boolean; locationPrecision: "neighborhood" | "exact";
  activityStatus: boolean; usageAnalytics: boolean; personalisedSuggestions: boolean;
  kinfolkMemoryEnabled: boolean; profileViewTrackingEnabled: boolean; postNudgesEnabled: boolean;
  safetyAlertPolice: boolean; safetyAlertIce: boolean; safetyAlertRadiusMiles: number;
  safetyAlertAreaCity: string | null; safetyAlertAreaState: string | null;
}>;

function parseSettingsPatch(body: unknown): { ok: true; data: SettingsPatch } | { ok: false } {
  if (!body || typeof body !== "object") return { ok: false };
  const b = body as Record<string, unknown>;
  const BOOLS = [
    "notifEvents", "notifBusiness", "notifMessages", "notifReviews", "notifCommunity",
    "notifPromotions", "notifDigest", "notifTips", "notifReminders", "arrivalAwarenessEnabled", "notifPostNudges", "quietHoursEnabled",
    "notifProductRecalls", "notifPublicHealthAlerts",
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
  const hasAreaCity = "safetyAlertAreaCity" in b;
  const hasAreaState = "safetyAlertAreaState" in b;
  if (hasAreaCity !== hasAreaState) return { ok: false };
  if (hasAreaCity && hasAreaState) {
    const rawCity = b.safetyAlertAreaCity;
    const rawState = b.safetyAlertAreaState;
    const city = typeof rawCity === "string" ? rawCity.trim().replace(/\s+/g, " ") : null;
    const state = typeof rawState === "string" ? rawState.trim().toUpperCase() : null;
    const clearingArea = (rawCity === null || city === "") && (rawState === null || state === "");
    if (clearingArea) {
      data.safetyAlertAreaCity = null;
      data.safetyAlertAreaState = null;
    } else if (!city || city.length > 100 || !state || !/^[A-Z]{2}$/.test(state)) {
      return { ok: false };
    } else {
      data.safetyAlertAreaCity = city;
      data.safetyAlertAreaState = state;
    }
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

async function canonicalizeSafetyAlertArea(patch: SettingsPatch): Promise<SettingsPatch | null> {
  if (!("safetyAlertAreaCity" in patch) || !("safetyAlertAreaState" in patch)) return patch;
  if (patch.safetyAlertAreaCity === null && patch.safetyAlertAreaState === null) return patch;

  const area = await pool.query<{ city_name: string; state_code: string }>(
    `SELECT city_name, state_code
     FROM community_locations
     WHERE LOWER(city_name) = LOWER($1)
       AND UPPER(state_code) = UPPER($2)
       AND neighborhood_name IS NULL
       AND latitude IS NOT NULL
       AND longitude IS NOT NULL
     LIMIT 1`,
    [patch.safetyAlertAreaCity, patch.safetyAlertAreaState],
  );
  const canonical = area.rows[0];
  if (!canonical) return null;
  return {
    ...patch,
    safetyAlertAreaCity: canonical.city_name,
    safetyAlertAreaState: canonical.state_code.toUpperCase(),
  };
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
  if (!isKinfolkPrivateMemoryEnabled() && parsed.data.kinfolkMemoryEnabled === true) {
    res.status(403).json({
      error: "Kinfolk private memory is disabled.",
      code: "PRIVATE_MEMORY_DISABLED",
    });
    return;
  }

  try {
    const settingsPatch = await canonicalizeSafetyAlertArea(parsed.data);
    if (!settingsPatch) {
      res.status(400).json({ error: "Choose a supported city and two-letter state for Safety Alerts." });
      return;
    }
    const [existing] = await db
      .select({
        userId: userSettingsTable.userId,
        safetyAlertPolice: userSettingsTable.safetyAlertPolice,
        safetyAlertIce: userSettingsTable.safetyAlertIce,
        safetyAlertAreaCity: userSettingsTable.safetyAlertAreaCity,
        safetyAlertAreaState: userSettingsTable.safetyAlertAreaState,
      })
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1);

    const enabledPolice = settingsPatch.safetyAlertPolice ?? existing?.safetyAlertPolice ?? false;
    const enabledIce = settingsPatch.safetyAlertIce ?? existing?.safetyAlertIce ?? false;
    const areaCity = "safetyAlertAreaCity" in settingsPatch
      ? settingsPatch.safetyAlertAreaCity
      : existing?.safetyAlertAreaCity ?? null;
    const areaState = "safetyAlertAreaState" in settingsPatch
      ? settingsPatch.safetyAlertAreaState
      : existing?.safetyAlertAreaState ?? null;
    if ((enabledPolice || enabledIce) && (!areaCity || !areaState)) {
      res.status(400).json({ error: "Choose and save a Safety Alert city and state before turning on Police or ICE alerts." });
      return;
    }

    if (existing) {
      const [updated] = await db
        .update(userSettingsTable)
        .set({ ...settingsPatch, updatedAt: new Date() })
        .where(eq(userSettingsTable.userId, userId))
        .returning();
      res.json(updated);
    } else {
      const [inserted] = await db
        .insert(userSettingsTable)
        .values({ userId, ...DEFAULT_SETTINGS, ...settingsPatch })
        .returning();
      res.json(inserted);
    }
  } catch (err) {
    req.log.error({ err }, "PUT /users/settings error");
    res.status(500).json({ error: "Failed to save settings." });
  }
});

export default router;

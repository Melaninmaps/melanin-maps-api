import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityAlertsTable, userLocationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { pool } from "@workspace/db";
import { sendAlertPushToNearbyUsers } from "../lib/pushNotifications";

const router: IRouter = Router();

// ─── Type registry ────────────────────────────────────────────────────────────

const EXPIRY_MINUTES: Record<string, number> = {
  // Legacy safety types
  ice: 120,
  police: 60,
  checkpoint: 60,
  traffic: 45,
  other: 60,
  // Community Intelligence types
  road_closure: 240,
  celebration: 480,
  protest: 240,
  festival: 1440,
  construction: 2880,
  emergency: 120,
  severe_weather: 360,
  transit_disruption: 180,
  avoid_area: 240,
  situation_cleared: 60,
  road_reopened: 60,
};

const VALID_TYPES = new Set(Object.keys(EXPIRY_MINUTES));
const CLEAR_THRESHOLD = 3;
const CONFIRM_THRESHOLD = 3;

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

function computeStatus(confirmedCount: number): "possible" | "confirmed" {
  return confirmedCount >= CONFIRM_THRESHOLD ? "confirmed" : "possible";
}

// ─── GET /community-alerts/nearby ─────────────────────────────────────────────
router.get("/community-alerts/nearby", async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    const radius = Math.min(parseFloat(String(req.query.radius ?? "16.09")), 16.09);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }

    const result = await pool.query<{
      id: string;
      type: string;
      lat: string;
      lng: string;
      description: string | null;
      confirmed_count: number;
      cleared_count: number;
      expires_at: string;
      created_at: string;
      distance_km: number;
    }>(
      `SELECT id, type, lat, lng, description, confirmed_count, cleared_count, expires_at, created_at,
        (6371 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians($1)) * cos(radians(lat::float)) * cos(radians(lng::float) - radians($2))
            + sin(radians($1)) * sin(radians(lat::float))
          ))
        )) AS distance_km
       FROM community_alerts
       WHERE is_active = true
         AND expires_at > NOW()
         AND (6371 * acos(
           GREATEST(-1, LEAST(1,
             cos(radians($1)) * cos(radians(lat::float)) * cos(radians(lng::float) - radians($2))
             + sin(radians($1)) * sin(radians(lat::float))
           ))
         )) < $3
       ORDER BY distance_km ASC
       LIMIT 50`,
      [lat, lng, radius],
    );

    const alerts = result.rows.map((r) => ({
      id: r.id,
      type: r.type,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      description: r.description,
      confirmedCount: r.confirmed_count,
      clearedCount: r.cleared_count,
      status: computeStatus(r.confirmed_count),
      distanceMeters: Math.round(r.distance_km * 1000),
      distanceKm: r.distance_km,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
    }));

    res.json({ alerts });
  } catch (err) {
    req.log.error({ err }, "GET /community-alerts/nearby error");
    res.status(500).json({ error: "Failed to fetch nearby alerts." });
  }
});

// ─── POST /community-alerts ────────────────────────────────────────────────────
router.post("/community-alerts", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { type, lat, lng, description } = req.body as {
      type?: string;
      lat?: number;
      lng?: number;
      description?: string;
    };

    if (!type || lat == null || lng == null) {
      res.status(400).json({ error: "type, lat, lng are required" });
      return;
    }

    if (!VALID_TYPES.has(type)) {
      res.status(400).json({ error: "Invalid alert type" });
      return;
    }

    const mins = EXPIRY_MINUTES[type] ?? 60;
    const expiresAt = new Date(Date.now() + mins * 60_000);

    const [alert] = await db
      .insert(communityAlertsTable)
      .values({
        type,
        lat: String(lat),
        lng: String(lng),
        description: description?.trim() || null,
        reportedBy: userId,
        expiresAt,
      })
      .returning();

    await sendAlertPushToNearbyUsers(alert.id, lat, lng, type, 16.09);

    res.json({
      alert: {
        ...alert,
        status: computeStatus(alert.confirmedCount),
      },
    });
  } catch (err) {
    req.log.error({ err }, "POST /community-alerts error");
    res.status(500).json({ error: "Failed to create alert." });
  }
});

// ─── POST /community-alerts/:id/confirm ───────────────────────────────────────
router.post("/community-alerts/:id/confirm", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const alertId = String(req.params.id);
    const result = await pool.query<{ confirmed_count: number; type: string; lat: string; lng: string }>(
      `UPDATE community_alerts
       SET confirmed_count = confirmed_count + 1
       WHERE id = $1 AND is_active = true
       RETURNING confirmed_count, type, lat::text, lng::text`,
      [alertId],
    );
    const row = result.rows[0];
    if (row && row.confirmed_count === CONFIRM_THRESHOLD) {
      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);
      void sendAlertPushToNearbyUsers(alertId, lat, lng, row.type, 16.1);
    }
    res.json({ ok: true, confirmedCount: row?.confirmed_count ?? 0, status: computeStatus(row?.confirmed_count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "POST /community-alerts/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm alert." });
  }
});

// ─── POST /community-alerts/:id/clear ─────────────────────────────────────────
router.post("/community-alerts/:id/clear", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const alertId = String(req.params.id);
    const result = await pool.query<{ cleared_count: number }>(
      `UPDATE community_alerts SET cleared_count = cleared_count + 1 WHERE id = $1 AND is_active = true RETURNING cleared_count`,
      [alertId],
    );
    if (result.rows[0] && result.rows[0].cleared_count >= CLEAR_THRESHOLD) {
      await db
        .update(communityAlertsTable)
        .set({ isActive: false })
        .where(eq(communityAlertsTable.id, alertId));
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /community-alerts/:id/clear error");
    res.status(500).json({ error: "Failed to clear alert." });
  }
});

// ─── GET /community-alerts/minority-alternatives ──────────────────────────────
router.get("/community-alerts/minority-alternatives", async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    const category = String(req.query.category ?? "");
    const radiusMiles = Math.min(parseFloat(String(req.query.radiusMiles ?? "5")), 10);
    const radiusKm = radiusMiles * 1.60934;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }

    const result = await pool.query<{
      id: string; name: string; city: string; category: string;
      latitude: string; longitude: string; rating: string; distance_km: number;
    }>(
      `SELECT b.id, b.name, b.city, b.category, b.latitude, b.longitude, b.rating,
          (6371 * acos(GREATEST(-1, LEAST(1,
            cos(radians($1)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($2))
            + sin(radians($1)) * sin(radians(b.latitude::float))
          )))) AS distance_km
       FROM businesses b
       WHERE b.black_owned = true
         AND ($3 = '' OR b.category ILIKE $3)
         AND (6371 * acos(GREATEST(-1, LEAST(1,
           cos(radians($1)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($2))
           + sin(radians($1)) * sin(radians(b.latitude::float))
         )))) < $4
       ORDER BY distance_km ASC
       LIMIT 4`,
      [lat, lng, category, radiusKm],
    );

    res.json({
      businesses: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        category: r.category,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
        rating: parseFloat(r.rating),
        distanceMiles: Math.round((r.distance_km / 1.609) * 10) / 10,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "GET /community-alerts/minority-alternatives error");
    res.status(500).json({ error: "Failed to fetch alternatives." });
  }
});

// ─── GET /community-alerts/flagged-businesses ──────────────────────────────────
router.get("/community-alerts/flagged-businesses", async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }
    const radiusKm = 16.09;
    const alertWindowMonths = 6;
    const proximityKm = 0.15;

    const result = await pool.query<{
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      category: string;
      latitude: string;
      longitude: string;
      alert_count: string;
      distance_km: number;
    }>(
      `SELECT
        b.id,
        b.name,
        b.address,
        b.city,
        b.state,
        b.category,
        b.latitude,
        b.longitude,
        COUNT(ca.id) AS alert_count,
        (6371 * acos(GREATEST(-1, LEAST(1,
          cos(radians($1)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($2))
          + sin(radians($1)) * sin(radians(b.latitude::float))
        )))) AS distance_km
      FROM businesses b
      LEFT JOIN community_alerts ca ON (
        ca.created_at > NOW() - INTERVAL '${alertWindowMonths} months'
        AND (6371 * acos(GREATEST(-1, LEAST(1,
          cos(radians(b.latitude::float)) * cos(radians(ca.lat::float)) * cos(radians(ca.lng::float) - radians(b.longitude::float))
          + sin(radians(b.latitude::float)) * sin(radians(ca.lat::float))
        )))) < $3
      )
      WHERE b.black_owned = false
        AND (6371 * acos(GREATEST(-1, LEAST(1,
          cos(radians($1)) * cos(radians(b.latitude::float)) * cos(radians(b.longitude::float) - radians($2))
          + sin(radians($1)) * sin(radians(b.latitude::float))
        )))) < $4
      GROUP BY b.id, b.name, b.address, b.city, b.state, b.category, b.latitude, b.longitude
      HAVING COUNT(ca.id) >= 3
      ORDER BY COUNT(ca.id) DESC, distance_km ASC
      LIMIT 25`,
      [lat, lng, proximityKm, radiusKm],
    );

    res.json({
      businesses: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        category: r.category,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
        alertCount: parseInt(r.alert_count, 10),
        distanceMiles: Math.round((r.distance_km / 1.609) * 10) / 10,
      })),
      total: result.rows.length,
    });
  } catch (err) {
    req.log.error({ err }, "GET /community-alerts/flagged-businesses error");
    res.status(500).json({ error: "Failed to fetch flagged businesses." });
  }
});

// ─── POST /community-alerts/location ──────────────────────────────────────────
router.post("/community-alerts/location", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { lat, lng } = req.body as { lat?: number; lng?: number };
    if (lat == null || lng == null) {
      res.status(400).json({ error: "lat and lng required" });
      return;
    }
    await db
      .insert(userLocationsTable)
      .values({ userId, lat: String(lat), lng: String(lng), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userLocationsTable.userId,
        set: { lat: String(lat), lng: String(lng), updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /community-alerts/location error");
    res.status(500).json({ error: "Failed to update location." });
  }
});

export default router;

import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityAlertsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { pool } from "@workspace/db";
import { isNamedAdmin } from "../lib/adminAuth";
import {
  normalizeLifecycleText,
  parseLifecycleExpiry,
} from "../safety/safetyHubLifecycle";

const router: IRouter = Router();

// ─── Type registry ────────────────────────────────────────────────────────────

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
  if (!requireAuth(req, res)) return;
  res.status(410).json({ error: "Member-location safety alerts have been retired. Safety does not use proximity or a member's current or recent location." });
});

// ─── POST /community-alerts ────────────────────────────────────────────────────
router.post("/community-alerts", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  res.status(410).json({ error: "Coordinate-based community alerts have been retired. Use the moderated Safety report flow without location." });
});

// ─── POST /community-alerts/:id/confirm ───────────────────────────────────────
router.post("/community-alerts/:id/confirm", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const alertId = String(req.params.id);
    const result = await pool.query<{ confirmed_count: number }>(
      `UPDATE community_alerts
       SET confirmed_count = confirmed_count + 1
       WHERE id = $1
         AND is_active = true
         AND withdrawn_at IS NULL
         AND corrected_at IS NULL
         AND expires_at > NOW()
         AND type NOT IN ('police', 'ice', 'checkpoint')
       RETURNING confirmed_count`,
      [alertId],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Alert is no longer current" });
      return;
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
      `UPDATE community_alerts
       SET cleared_count = cleared_count + 1
       WHERE id = $1
         AND is_active = true
         AND withdrawn_at IS NULL
         AND corrected_at IS NULL
         AND expires_at > NOW()
         AND type NOT IN ('police', 'ice', 'checkpoint')
       RETURNING cleared_count`,
      [alertId],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Alert is no longer current" });
      return;
    }
    if (result.rows[0].cleared_count >= CLEAR_THRESHOLD) {
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

// ─── POST /community-alerts/:id/withdraw ──────────────────────────────────────
// The original alert remains preserved with an auditable withdrawal record.
router.post("/community-alerts/:id/withdraw", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const reason = normalizeLifecycleText(req.body?.reason, 500);
  if (!reason) {
    res.status(400).json({ error: "A withdrawal reason is required" });
    return;
  }

  try {
    const result = await pool.query<{ id: string; withdrawn_at: string }>(
      `UPDATE community_alerts
       SET is_active = false,
           withdrawn_at = NOW(),
           withdrawn_by = $2,
           withdrawal_reason = $3
       WHERE id = $1
         AND reported_by = $2
         AND withdrawn_at IS NULL
       RETURNING id, withdrawn_at`,
      [String(req.params.id), req.user!.id, reason],
    );
    const alert = result.rows[0];
    if (!alert) {
      res.status(404).json({ error: "Current alert not found or not owned by this member" });
      return;
    }
    res.json({ alert: { id: alert.id, withdrawnAt: alert.withdrawn_at } });
  } catch (err) {
    req.log.error({ err }, "POST /community-alerts/:id/withdraw error");
    res.status(500).json({ error: "Failed to withdraw alert." });
  }
});

// ─── PATCH /community-alerts/:id/lifecycle ────────────────────────────────────
router.patch("/community-alerts/:id/lifecycle", async (req: Request, res: Response) => {
  if (!isNamedAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const action = typeof req.body?.action === "string" ? req.body.action : "";
  const reason = normalizeLifecycleText(req.body?.reason, 500);
  const correctionNote = normalizeLifecycleText(req.body?.correctionNote, 2000);
  const displayExpiresAt = parseLifecycleExpiry(req.body?.expiresAt);
  if (action !== "withdraw" && action !== "correct" && action !== "set_expiration") {
    res.status(400).json({ error: "Invalid lifecycle action" });
    return;
  }
  if (action === "withdraw" && !reason) {
    res.status(400).json({ error: "A withdrawal reason is required" });
    return;
  }
  if (action === "correct" && !correctionNote) {
    res.status(400).json({ error: "A correction note is required" });
    return;
  }
  if (action === "set_expiration" && !displayExpiresAt) {
    res.status(400).json({ error: "A valid expiresAt timestamp is required" });
    return;
  }

  try {
    const result = action === "withdraw"
      ? await pool.query<{ id: string; withdrawn_at: string }>(
          `UPDATE community_alerts
           SET is_active = false,
               withdrawn_at = NOW(),
               withdrawn_by = $2,
               withdrawal_reason = $3
           WHERE id = $1
             AND withdrawn_at IS NULL
           RETURNING id, withdrawn_at`,
          [String(req.params.id), req.user!.id, reason],
        )
      : action === "correct"
      ? await pool.query<{ id: string; corrected_at: string }>(
          `UPDATE community_alerts
           SET is_active = false,
               corrected_at = NOW(),
               corrected_by = $2,
               correction_note = $3
           WHERE id = $1
             AND corrected_at IS NULL
           RETURNING id, corrected_at`,
          [String(req.params.id), req.user!.id, correctionNote],
        )
      : await pool.query<{ id: string; expires_at: string }>(
          `UPDATE community_alerts
           SET expires_at = $2
           WHERE id = $1
             AND withdrawn_at IS NULL
             AND corrected_at IS NULL
           RETURNING id, expires_at`,
          [String(req.params.id), displayExpiresAt!.toISOString()],
        );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }
    res.json({ alert: result.rows[0] });
  } catch (err) {
    req.log.error({ err }, "PATCH /community-alerts/:id/lifecycle error");
    res.status(500).json({ error: "Failed to update alert lifecycle." });
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
           AND ca.is_active = true
           AND ca.withdrawn_at IS NULL
           AND ca.corrected_at IS NULL
           AND ca.expires_at > NOW()
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
  res.status(410).json({ error: "Member location storage has been retired." });
});

export default router;

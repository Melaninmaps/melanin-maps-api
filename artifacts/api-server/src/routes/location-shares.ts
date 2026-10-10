import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, locationSharesTable, pool } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";
import crypto from "node:crypto";
import { requireFamilySafety } from "../middleware/requireFamilySafety";

const router: IRouter = Router();
const ALLOWED_DURATION_MINUTES = new Set([30, 60, 120, 240, 480, 1440]);
// The mobile foreground client publishes about every 30 seconds. A stale fix is
// never shown as live; two minutes tolerates ordinary request jitter only.
const MAX_COORDINATE_AGE_MS = 2 * 60 * 1000;

function ownerLocationShare<T extends { currentLat: number | null; currentLng: number | null; lastUpdatedAt: Date | null }>(share: T) {
  return {
    ...share,
    coordinateState:
      share.currentLat !== null && share.currentLng !== null && share.lastUpdatedAt
        ? "published"
        : "waiting_for_first_update",
    updateMode: "foreground_while_screen_open",
    linkDeliveryState: "not_sent_by_service",
  } as const;
}

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

export function publicLocationShare(share: {
  label: string;
  currentLat: number | null;
  currentLng: number | null;
  lastUpdatedAt: Date | null;
  expiresAt: Date;
}) {
  return {
    label: share.label,
    currentLat: share.currentLat,
    currentLng: share.currentLng,
    lastUpdatedAt: share.lastUpdatedAt,
    expiresAt: share.expiresAt,
  };
}

router.get("/safety/location-shares", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const shares = await db.select().from(locationSharesTable)
      .where(eq(locationSharesTable.sharerId, userId));
    res.json({ shares: shares.map(ownerLocationShare) });
  } catch (err) {
    req.log.error({ err }, "GET /safety/location-shares error");
    res.status(500).json({ error: "Failed to load location shares" });
  }
});

router.post("/safety/location-shares", requireFamilySafety, async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { recipientTrustedShareId, label, durationMinutes = 60 } =
      req.body as { recipientTrustedShareId?: string; label?: string; durationMinutes?: number };
    if (!recipientTrustedShareId?.trim()) {
      res.status(400).json({ error: "Choose an accepted trusted Kinfolk contact" });
      return;
    }
    if (!Number.isInteger(durationMinutes) || !ALLOWED_DURATION_MINUTES.has(durationMinutes)) {
      res.status(400).json({ error: "Invalid location share duration" });
      return;
    }
    // Server-side recipient authorization: a typed client field never grants
    // coordinate access. The selected contact must have accepted this owner's
    // active in-app Trusted Safety Share and neither party may have blocked the other.
    const recipient = await pool.query<{ recipient_user_id: string }>(
      `SELECT tss.contact_user_id AS recipient_user_id
         FROM trusted_safety_shares tss
         JOIN users recipient ON recipient.id = tss.contact_user_id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = $1 AND owner_blocks.blocked_id = recipient.id
         LEFT JOIN user_blocks recipient_blocks ON recipient_blocks.blocker_id = recipient.id AND recipient_blocks.blocked_id = $1
        WHERE tss.id = $2
          AND tss.owner_id = $1
          AND tss.contact_type = 'mwm_user'
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND recipient.approved = true
          AND owner_blocks.id IS NULL
          AND recipient_blocks.id IS NULL
        LIMIT 1`,
      [userId, recipientTrustedShareId],
    );
    const recipientUserId = recipient.rows[0]?.recipient_user_id;
    if (!recipientUserId) {
      res.status(403).json({ error: "That contact is not currently authorized for location sharing" });
      return;
    }
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + (durationMinutes) * 60 * 1000);
    const [share] = await db.insert(locationSharesTable).values({
      sharerId: userId,
      shareToken: token,
      recipientUserId,
      label: label?.trim() ?? "Live Location",
      expiresAt,
      isActive: true,
    }).returning();
    res.status(201).json({ share: ownerLocationShare(share) });
  } catch (err) {
    req.log.error({ err }, "POST /safety/location-shares error");
    res.status(500).json({ error: "Failed to create location share" });
  }
});

router.patch("/safety/location-shares/:token/update", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { lat, lng } = req.body as { lat?: number; lng?: number };
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: "Valid lat and lng are required" }); return;
    }
    const [share] = await db.update(locationSharesTable)
      .set({ currentLat: lat, currentLng: lng, lastUpdatedAt: new Date() })
      .where(and(
        eq(locationSharesTable.shareToken, req.params["token"] as string),
        eq(locationSharesTable.sharerId, userId),
        eq(locationSharesTable.isActive, true),
        gt(locationSharesTable.expiresAt, new Date()),
      ))
      .returning();
    if (!share) { res.status(404).json({ error: "Share not found or expired" }); return; }
    res.json({
      ok: true,
      coordinateState: "published",
      updateMode: "foreground_while_screen_open",
      lastUpdatedAt: share.lastUpdatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "PATCH /safety/location-shares/:token/update error");
    res.status(500).json({ error: "Failed to update location" });
  }
});

router.get("/safety/location-shares/:token/view", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  res.set("Cache-Control", "no-store, private, max-age=0");
  res.set("Pragma", "no-cache");
  try {
    // Possession of a URL is never authorization for a precise location. Access
    // is rechecked against the recipient's active, accepted trusted relationship
    // and mutual block state on every coordinate read.
    const result = await pool.query<{
      label: string; current_lat: number | null; current_lng: number | null;
      last_updated_at: Date | null; expires_at: Date; is_active: boolean;
    }>(
      `SELECT ls.label, ls.current_lat, ls.current_lng, ls.last_updated_at, ls.expires_at, ls.is_active
         FROM location_shares ls
         JOIN trusted_safety_shares tss
           ON tss.owner_id = ls.sharer_id AND tss.contact_user_id = ls.recipient_user_id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = ls.sharer_id AND owner_blocks.blocked_id = $2
         LEFT JOIN user_blocks recipient_blocks ON recipient_blocks.blocker_id = $2 AND recipient_blocks.blocked_id = ls.sharer_id
        WHERE ls.share_token = $1
          AND ls.recipient_user_id = $2
          AND tss.contact_type = 'mwm_user'
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND owner_blocks.id IS NULL
          AND recipient_blocks.id IS NULL
        LIMIT 1`,
      [req.params["token"], userId],
    );
    const share = result.rows[0];
    if (!share) { res.status(403).json({ error: "Recipient authorization required" }); return; }
    if (!share.is_active || new Date() > share.expires_at) {
      res.status(410).json({ error: "This location share has expired" }); return;
    }
    if (!share.last_updated_at || Date.now() - share.last_updated_at.getTime() > MAX_COORDINATE_AGE_MS) {
      res.status(410).json({ error: "This location is no longer current" }); return;
    }
    res.json({ share: publicLocationShare({ label: share.label, currentLat: share.current_lat, currentLng: share.current_lng, lastUpdatedAt: share.last_updated_at, expiresAt: share.expires_at }) });
  } catch (err) {
    req.log.error({ err }, "GET /safety/location-shares/:token/view error");
    res.status(500).json({ error: "Failed to load share" });
  }
});

router.delete("/safety/location-shares/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await db.update(locationSharesTable)
      .set({ isActive: false, currentLat: null, currentLng: null, lastUpdatedAt: null })
      .where(and(eq(locationSharesTable.id, id), eq(locationSharesTable.sharerId, userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /safety/location-shares/:id error");
    res.status(500).json({ error: "Failed to stop share" });
  }
});

export default router;

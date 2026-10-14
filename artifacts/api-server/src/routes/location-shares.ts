import { Router, type IRouter, type Request, type Response } from "express";
import { db, locationSharesTable, pool } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { requireFamilySafety } from "../middleware/requireFamilySafety";

const router: IRouter = Router();
const ALLOWED_DURATION_MINUTES = new Set([30, 60, 120, 240, 480, 1440]);
const MAX_LABEL_LENGTH = 150;
// Each location session is independently time-bounded and explicitly confirmed.
// The trusted-contact relationship authorizes the selected recipient but never
// turns a durable alert authorization into continuous location consent.
// The mobile foreground client publishes about every 30 seconds. A stale fix is
// never shown as live; two minutes tolerates ordinary request jitter only.
const MAX_COORDINATE_AGE_MS = 2 * 60 * 1000;

export function minimizeLocationCoordinate(coordinate: number): number {
  // About 11 m at the equator: enough for a temporary safety handoff without
  // retaining or sending device-grade precision.
  return Math.round(coordinate * 10_000) / 10_000;
}

export function isFreshLocationCoordinate(
  updatedAt: Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!updatedAt) return false;
  const updatedAtMs = updatedAt.getTime();
  return Number.isFinite(updatedAtMs)
    && updatedAtMs <= now
    && now - updatedAtMs <= MAX_COORDINATE_AGE_MS;
}

function ownerLocationShare<T extends {
  id: number;
  shareToken: string;
  label: string;
  isActive: boolean;
  expiresAt: Date;
  lastUpdatedAt: Date | null;
  createdAt: Date;
  currentLat: number | null;
  currentLng: number | null;
}>(share: T) {
  return {
    id: share.id,
    // The token is accepted only with the authenticated sharer's identity and
    // is never a recipient-facing or copyable location link.
    shareToken: share.shareToken,
    label: share.label,
    isActive: share.isActive,
    expiresAt: share.expiresAt,
    lastUpdatedAt: share.lastUpdatedAt,
    createdAt: share.createdAt,
    coordinateState:
      share.currentLat !== null
      && share.currentLng !== null
      && isFreshLocationCoordinate(share.lastUpdatedAt)
        ? "published"
        : "waiting_for_first_update",
    sharingScope: "accepted_trusted_contact_foreground_current_fix_only",
    updateMode: "foreground_while_screen_open",
    linkDeliveryState: "not_sent_by_service",
  } as const;
}

/**
 * Expiry, lost consent, blocks, or account deactivation remove retained precise
 * coordinates before an owner list can be returned. Reads fail closed if this
 * cleanup cannot complete rather than returning a stale sensitive payload.
 */
async function deactivateIneligibleLocationShares(sharerId: string): Promise<void> {
  await pool.query(
    `UPDATE location_shares ls
        SET is_active = false,
            current_lat = NULL,
            current_lng = NULL,
            last_updated_at = NULL
      WHERE ls.sharer_id = $1
        AND ls.is_active = true
        AND (
          ls.expires_at <= NOW()
          OR NOT EXISTS (
            SELECT 1
              FROM trusted_safety_shares tss
              JOIN users owner ON owner.id = tss.owner_id
              JOIN users recipient ON recipient.id = tss.contact_user_id
              LEFT JOIN user_blocks owner_blocks
                ON owner_blocks.blocker_id = tss.owner_id
               AND owner_blocks.blocked_id = recipient.id
              LEFT JOIN user_blocks recipient_blocks
                ON recipient_blocks.blocker_id = recipient.id
               AND recipient_blocks.blocked_id = tss.owner_id
             WHERE tss.owner_id = ls.sharer_id
               AND tss.contact_user_id = ls.recipient_user_id
               AND tss.contact_type = 'mwm_user'
               AND tss.status = 'active'
               AND tss.owner_enabled = true
               AND tss.contact_accepted = true
               AND owner.approved = true
               AND COALESCE(owner.account_status, 'active') = 'active'
               AND recipient.approved = true
               AND COALESCE(recipient.account_status, 'active') = 'active'
               AND owner_blocks.id IS NULL
               AND recipient_blocks.id IS NULL
          )
        )`,
    [sharerId],
  );
}

/** Do not retain an old or implausibly future-dated coordinate between reads. */
async function clearStaleLocationCoordinates(sharerId: string): Promise<void> {
  await pool.query(
    `UPDATE location_shares
        SET current_lat = NULL,
            current_lng = NULL,
            last_updated_at = NULL
      WHERE sharer_id = $1
        AND is_active = true
        AND last_updated_at IS NOT NULL
        AND (
          last_updated_at <= NOW() - INTERVAL '2 minutes'
          OR last_updated_at > NOW()
        )`,
    [sharerId],
  );
}

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

function setSensitiveResponseHeaders(res: Response): void {
  res.set("Cache-Control", "no-store, private, max-age=0");
  res.set("Pragma", "no-cache");
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
    // Recipients need to know that the coordinate is current, but not the
    // member's exact update time. The route rejects a stale fix before this
    // projection can be reached.
    coordinateState: "current",
    expiresAt: share.expiresAt,
  };
}

router.get("/safety/location-shares", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  setSensitiveResponseHeaders(res);
  try {
    await clearStaleLocationCoordinates(userId);
    await deactivateIneligibleLocationShares(userId);
    const shares = await db.select().from(locationSharesTable)
      // Inactive rows may remain as restricted server-side lifecycle evidence,
      // but they are not a member-facing location or activity history.
      .where(and(
        eq(locationSharesTable.sharerId, userId),
        eq(locationSharesTable.isActive, true),
      ));
    res.json({ shares: shares.map(ownerLocationShare) });
  } catch (err) {
    req.log.error({ err }, "GET /safety/location-shares error");
    res.status(500).json({ error: "Failed to load location shares" });
  }
});

router.post("/safety/location-shares", requireFamilySafety, async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  setSensitiveResponseHeaders(res);
  try {
    const { recipientTrustedShareId, label, durationMinutes = 60, liveLocationConsent } =
      req.body as {
        recipientTrustedShareId?: string;
        label?: string;
        durationMinutes?: number;
        liveLocationConsent?: unknown;
      };
    if (liveLocationConsent !== true) {
      res.status(400).json({ error: "Confirm temporary live-location sharing before starting" });
      return;
    }
    if (!recipientTrustedShareId?.trim()) {
      res.status(400).json({ error: "Choose an accepted trusted Kinfolk contact" });
      return;
    }
    if (!Number.isInteger(durationMinutes) || !ALLOWED_DURATION_MINUTES.has(durationMinutes)) {
      res.status(400).json({ error: "Invalid location share duration" });
      return;
    }
    const safeLabel = label?.trim() || "Live Location";
    if (safeLabel.length > MAX_LABEL_LENGTH) {
      res.status(400).json({ error: `Location share label must be at most ${MAX_LABEL_LENGTH} characters` });
      return;
    }
    // Server-side recipient authorization: a typed client field never grants
    // coordinate access. The selected contact must have accepted this owner's
    // active, finite in-app Trusted Safety Share and neither party may have
    // blocked the other. This check never trusts the mobile recipient list.
    const recipient = await pool.query<{ recipient_user_id: string }>(
      `SELECT tss.contact_user_id AS recipient_user_id
         FROM trusted_safety_shares tss
         JOIN users owner ON owner.id = tss.owner_id
         JOIN users recipient ON recipient.id = tss.contact_user_id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = $1 AND owner_blocks.blocked_id = recipient.id
         LEFT JOIN user_blocks recipient_blocks ON recipient_blocks.blocker_id = recipient.id AND recipient_blocks.blocked_id = $1
        WHERE tss.id = $2
          AND tss.owner_id = $1
          AND tss.contact_type = 'mwm_user'
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND owner.approved = true
          AND COALESCE(owner.account_status, 'active') = 'active'
          AND recipient.approved = true
          AND COALESCE(recipient.account_status, 'active') = 'active'
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
      label: safeLabel,
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
  setSensitiveResponseHeaders(res);
  try {
    const { lat, lng } = req.body as { lat?: number; lng?: number };
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: "Valid lat and lng are required" }); return;
    }
    // A valid token alone cannot keep a location stream alive. Re-authorize the
    // accepted relationship, account state, finite consent, and mutual blocks
    // on every coordinate write, then retain only a minimized coordinate.
    const updated = await pool.query<{ last_updated_at: Date }>(
      `UPDATE location_shares ls
          SET current_lat = $1,
              current_lng = $2,
              last_updated_at = NOW()
         FROM trusted_safety_shares tss
         JOIN users owner ON owner.id = tss.owner_id
         JOIN users recipient ON recipient.id = tss.contact_user_id
         LEFT JOIN user_blocks owner_blocks
           ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = recipient.id
         LEFT JOIN user_blocks recipient_blocks
           ON recipient_blocks.blocker_id = recipient.id AND recipient_blocks.blocked_id = tss.owner_id
        WHERE ls.share_token = $3
          AND ls.sharer_id = $4
          AND ls.recipient_user_id = tss.contact_user_id
          AND tss.owner_id = ls.sharer_id
          AND tss.contact_type = 'mwm_user'
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND owner.approved = true
          AND COALESCE(owner.account_status, 'active') = 'active'
          AND recipient.approved = true
          AND COALESCE(recipient.account_status, 'active') = 'active'
          AND owner_blocks.id IS NULL
          AND recipient_blocks.id IS NULL
          AND ls.is_active = true
          AND ls.expires_at > NOW()
        RETURNING ls.last_updated_at`,
      [minimizeLocationCoordinate(lat), minimizeLocationCoordinate(lng), req.params["token"], userId],
    );
    const share = updated.rows[0];
    if (!share) { res.status(404).json({ error: "Share not found, expired, or no longer authorized" }); return; }
    res.json({
      ok: true,
      coordinateState: "published",
      updateMode: "foreground_while_screen_open",
      lastUpdatedAt: share.last_updated_at,
    });
  } catch (err) {
    req.log.error({ err }, "PATCH /safety/location-shares/:token/update error");
    res.status(500).json({ error: "Failed to update location" });
  }
});

router.get("/safety/location-shares/:token/view", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  setSensitiveResponseHeaders(res);
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
         JOIN users owner ON owner.id = tss.owner_id
         JOIN users recipient ON recipient.id = tss.contact_user_id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = ls.sharer_id AND owner_blocks.blocked_id = $2
         LEFT JOIN user_blocks recipient_blocks ON recipient_blocks.blocker_id = $2 AND recipient_blocks.blocked_id = ls.sharer_id
        WHERE ls.share_token = $1
          AND ls.recipient_user_id = $2
          AND tss.contact_type = 'mwm_user'
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND owner.approved = true
          AND COALESCE(owner.account_status, 'active') = 'active'
          AND recipient.approved = true
          AND COALESCE(recipient.account_status, 'active') = 'active'
          AND owner_blocks.id IS NULL
          AND recipient_blocks.id IS NULL
        LIMIT 1`,
      [req.params["token"], userId],
    );
    const share = result.rows[0];
    if (!share) { res.status(403).json({ error: "Recipient authorization required" }); return; }
    if (!share.is_active || new Date() > share.expires_at) {
      // Expiration is a hard retention boundary, not just a read denial. Clear
      // the last coordinate while the recipient authorization is still scoped
      // to this exact session; no background sweep or broader location cleanup
      // is required for the recipient-facing boundary to fail closed.
      await pool.query(
        `UPDATE location_shares
            SET is_active = false,
                current_lat = NULL,
                current_lng = NULL,
                last_updated_at = NULL
          WHERE share_token = $1
            AND recipient_user_id = $2
            AND is_active = true
            AND expires_at <= NOW()`,
        [req.params["token"], userId],
      );
      res.status(410).json({ error: "This location share has expired" }); return;
    }
    if (
      share.current_lat === null
      || share.current_lng === null
      || !isFreshLocationCoordinate(share.last_updated_at)
    ) {
      // A stale coordinate must not remain in storage just because the recipient
      // viewed it late. Keep the time-bounded share available for a future
      // foreground update, but remove the old precise fix now.
      await pool.query(
        `UPDATE location_shares
            SET current_lat = NULL,
                current_lng = NULL,
                last_updated_at = NULL
          WHERE share_token = $1
            AND is_active = true
            AND last_updated_at IS NOT NULL
            AND (
              last_updated_at <= NOW() - INTERVAL '2 minutes'
              OR last_updated_at > NOW()
            )`,
        [req.params["token"]],
      );
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
  setSensitiveResponseHeaders(res);
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(404).json({ error: "Location share not found" });
      return;
    }
    const [stopped] = await db.update(locationSharesTable)
      .set({ isActive: false, currentLat: null, currentLng: null, lastUpdatedAt: null })
      .where(and(eq(locationSharesTable.id, id), eq(locationSharesTable.sharerId, userId)))
      .returning({ id: locationSharesTable.id });
    if (!stopped) {
      res.status(404).json({ error: "Location share not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /safety/location-shares/:id error");
    res.status(500).json({ error: "Failed to stop share" });
  }
});

export default router;

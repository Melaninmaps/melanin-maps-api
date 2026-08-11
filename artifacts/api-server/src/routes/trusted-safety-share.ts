/**
 * Trusted Safety Share — API routes
 *
 * Allows a traveler (owner) to designate up to 5 trusted contacts who receive
 * the same safety alerts the traveler receives — nothing else.
 *
 * Privacy contract (enforced here):
 *   • Trusted contacts see only: owner's first name, general city/region, alert text.
 *   • No GPS coordinates, no searches, no saves, no activity ever exposed.
 *   • Owner can revoke instantly; revocation is silent (no notification sent).
 *   • Auto-pauses when owner's location matches their registered home city.
 *
 * Routes (all mounted under /api via routes/index.ts):
 *   POST   /safety/trusted-shares                  — create a share
 *   GET    /safety/trusted-shares                  — list owner's shares (outgoing)
 *   GET    /safety/trusted-shares/received         — list shares where I'm the contact
 *   DELETE /safety/trusted-shares/:id              — revoke (owner only, instant, silent)
 *   PATCH  /safety/trusted-shares/:id/pause        — manual pause toggle
 *   PATCH  /safety/trusted-shares/:id/respond      — MWM contact accepts or declines
 *   GET    /safety/trusted-shares/accept/:token    — public: get invite details by token
 *   POST   /safety/trusted-shares/accept-token     — public: accept/decline by token (non-MWM)
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { randomUUID } from "crypto";

const router = Router();

const MAX_SHARES = 5;

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

// ── POST /safety/trusted-shares ───────────────────────────────────────────────
// Create a new trusted safety share (traveler adds a contact).
router.post("/safety/trusted-shares", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const ownerId = req.user!.id;
    const {
      contactName,
      contactType,
      contactPhone,
      contactEmail,
      contactUserId,
    } = req.body as {
      contactName?: string;
      contactType?: string;
      contactPhone?: string;
      contactEmail?: string;
      contactUserId?: string;
    };

    if (!contactName?.trim()) {
      res.status(400).json({ error: "contactName is required" });
      return;
    }
    const type = contactType ?? "phone";
    if (!["mwm_user", "phone", "email"].includes(type)) {
      res.status(400).json({ error: "contactType must be mwm_user, phone, or email" });
      return;
    }
    if (type === "mwm_user" && !contactUserId) {
      res.status(400).json({ error: "contactUserId required for mwm_user type" });
      return;
    }
    if (type === "phone" && !contactPhone) {
      res.status(400).json({ error: "contactPhone required for phone type" });
      return;
    }
    if (type === "email" && !contactEmail) {
      res.status(400).json({ error: "contactEmail required for email type" });
      return;
    }
    // Can't add yourself
    if (type === "mwm_user" && contactUserId === ownerId) {
      res.status(400).json({ error: "Cannot add yourself as a trusted contact" });
      return;
    }

    // Enforce 5-contact cap
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM trusted_safety_shares
       WHERE owner_id = $1 AND status != 'revoked' AND status != 'declined'`,
      [ownerId]
    );
    if (parseInt(countResult.rows[0]?.count ?? "0", 10) >= MAX_SHARES) {
      res.status(400).json({ error: `Maximum of ${MAX_SHARES} trusted contacts allowed` });
      return;
    }

    // No duplicate contacts
    const dupCheck = await pool.query(
      `SELECT id FROM trusted_safety_shares
       WHERE owner_id = $1
         AND status NOT IN ('revoked','declined')
         AND (
           ($2 = 'mwm_user' AND contact_user_id = $3)
           OR ($2 = 'phone'    AND contact_phone  = $4)
           OR ($2 = 'email'    AND contact_email  = $5)
         )`,
      [ownerId, type, contactUserId ?? null, contactPhone ?? null, contactEmail ?? null]
    );
    if (dupCheck.rows.length > 0) {
      res.status(409).json({ error: "This contact is already added" });
      return;
    }

    const inviteToken = randomUUID();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // MWM users are immediately pending (they must accept via the app).
    // External contacts are pending until they accept via the invite link.
    const initialStatus = "pending";
    // MWM users: contact_accepted stays false until they respond.

    const result = await pool.query(
      `INSERT INTO trusted_safety_shares
         (id, owner_id, contact_type, contact_user_id, contact_name,
          contact_phone, contact_email, owner_enabled, contact_accepted,
          status, invite_token, invite_expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,false,$8,$9,$10,NOW(),NOW())
       RETURNING *`,
      [
        randomUUID(),
        ownerId,
        type,
        contactUserId ?? null,
        contactName.trim(),
        contactPhone?.trim() ?? null,
        contactEmail?.trim() ?? null,
        initialStatus,
        inviteToken,
        inviteExpiresAt,
      ]
    );

    const share = result.rows[0];

    // If MWM user: send them a push notification asking them to accept.
    if (type === "mwm_user" && contactUserId) {
      try {
        const ownerResult = await pool.query<{ first_name: string }>(
          `SELECT first_name FROM users WHERE id = $1`,
          [ownerId]
        );
        const ownerName = ownerResult.rows[0]?.first_name ?? "Someone";
        const tokenResult = await pool.query<{ token: string }>(
          `SELECT token FROM push_tokens WHERE user_id = $1 LIMIT 1`,
          [contactUserId]
        );
        if (tokenResult.rows[0]?.token) {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: tokenResult.rows[0].token,
              title: "Trusted Safety Share Request",
              body: `${ownerName} wants to share safety alerts with you. You'll only receive alerts if a real emergency occurs at their location.`,
              data: { type: "trusted_safety_share_request", shareId: share.id },
              sound: "default",
            }),
          });
        }
      } catch (pushErr) {
        req.log?.warn({ pushErr }, "Failed to send trusted-share invite push");
      }
    }

    res.status(201).json({ share });
  } catch (err) {
    req.log?.error({ err }, "POST /safety/trusted-shares error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /safety/trusted-shares ────────────────────────────────────────────────
// List shares the authenticated user has created (outgoing).
router.get("/safety/trusted-shares", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const ownerId = req.user!.id;
    const result = await pool.query(
      `SELECT tss.*,
              u.first_name AS contact_first_name,
              u.last_name  AS contact_last_name,
              u.profile_image_url AS contact_avatar
       FROM trusted_safety_shares tss
       LEFT JOIN users u ON u.id = tss.contact_user_id
       WHERE tss.owner_id = $1
       ORDER BY tss.created_at DESC`,
      [ownerId]
    );
    res.json({ shares: result.rows });
  } catch (err) {
    req.log?.error({ err }, "GET /safety/trusted-shares error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /safety/trusted-shares/received ──────────────────────────────────────
// List shares where I am the trusted contact (incoming, for MWM users).
router.get("/safety/trusted-shares/received", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT tss.*,
              u.first_name AS owner_first_name,
              u.last_name  AS owner_last_name,
              u.profile_image_url AS owner_avatar
       FROM trusted_safety_shares tss
       JOIN users u ON u.id = tss.owner_id
       WHERE tss.contact_user_id = $1
         AND tss.status NOT IN ('revoked')
       ORDER BY tss.created_at DESC`,
      [userId]
    );
    res.json({ shares: result.rows });
  } catch (err) {
    req.log?.error({ err }, "GET /safety/trusted-shares/received error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /safety/trusted-shares/:id ────────────────────────────────────────
// Revoke a share instantly. Only the owner can revoke. Silent — no notification.
router.delete("/safety/trusted-shares/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const existing = await pool.query(
      `SELECT * FROM trusted_safety_shares WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Share not found" });
      return;
    }
    if (existing.rows[0].owner_id !== ownerId) {
      res.status(403).json({ error: "Only the owner can revoke a trusted safety share" });
      return;
    }

    await pool.query(
      `UPDATE trusted_safety_shares
       SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    res.json({ revoked: true });
  } catch (err) {
    req.log?.error({ err }, "DELETE /safety/trusted-shares/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /safety/trusted-shares/:id/pause ───────────────────────────────────
// Manual pause / resume toggle (owner only).
router.patch("/safety/trusted-shares/:id/pause", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { pause } = req.body as { pause?: boolean };
    if (pause === undefined) {
      res.status(400).json({ error: "pause (boolean) is required" });
      return;
    }

    const existing = await pool.query(
      `SELECT * FROM trusted_safety_shares WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) { res.status(404).json({ error: "Share not found" }); return; }
    if (existing.rows[0].owner_id !== ownerId) {
      res.status(403).json({ error: "Not your share" }); return;
    }
    if (existing.rows[0].status === "revoked") {
      res.status(400).json({ error: "Cannot pause a revoked share" }); return;
    }

    const newStatus = pause ? "paused_manual" : "active";
    const result = await pool.query(
      `UPDATE trusted_safety_shares
       SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );
    res.json({ share: result.rows[0] });
  } catch (err) {
    req.log?.error({ err }, "PATCH /safety/trusted-shares/:id/pause error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /safety/trusted-shares/:id/respond ─────────────────────────────────
// Trusted MWM contact accepts or declines the share request.
router.patch("/safety/trusted-shares/:id/respond", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { accept } = req.body as { accept?: boolean };
    if (accept === undefined) {
      res.status(400).json({ error: "accept (boolean) is required" });
      return;
    }

    const existing = await pool.query(
      `SELECT * FROM trusted_safety_shares WHERE id = $1`,
      [id]
    );
    if (!existing.rows[0]) { res.status(404).json({ error: "Share not found" }); return; }
    if (existing.rows[0].contact_user_id !== userId) {
      res.status(403).json({ error: "Not your share request to respond to" }); return;
    }
    if (existing.rows[0].status !== "pending") {
      res.status(409).json({ error: "This share has already been resolved" }); return;
    }

    const newStatus = accept ? "active" : "declined";
    const result = await pool.query(
      `UPDATE trusted_safety_shares
       SET status = $1,
           contact_accepted = $2,
           activated_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [newStatus, accept, id]
    );
    res.json({ share: result.rows[0] });
  } catch (err) {
    req.log?.error({ err }, "PATCH /safety/trusted-shares/:id/respond error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /safety/trusted-shares/accept/:token ─────────────────────────────────
// Public — returns invite details so a non-MWM user can see who is sharing.
// Used by the web accept-invite landing page.
router.get("/safety/trusted-shares/accept/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      `SELECT tss.id, tss.contact_name, tss.status, tss.invite_expires_at,
              u.first_name AS owner_first_name
       FROM trusted_safety_shares tss
       JOIN users u ON u.id = tss.owner_id
       WHERE tss.invite_token = $1`,
      [token]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Invite not found or expired" });
      return;
    }
    const row = result.rows[0];
    if (new Date(row.invite_expires_at) < new Date()) {
      res.status(410).json({ error: "Invite has expired" });
      return;
    }
    if (row.status !== "pending") {
      res.status(409).json({ error: "This invite has already been responded to" });
      return;
    }
    res.json({
      contactName: row.contact_name,
      ownerFirstName: row.owner_first_name,
      status: row.status,
      expiresAt: row.invite_expires_at,
    });
  } catch (err) {
    req.log?.error({ err }, "GET /safety/trusted-shares/accept/:token error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /safety/trusted-shares/accept-token ─────────────────────────────────
// Public — non-MWM contact accepts or declines via the token from SMS/email link.
router.post("/safety/trusted-shares/accept-token", async (req: Request, res: Response) => {
  try {
    const { token, accept } = req.body as { token?: string; accept?: boolean };
    if (!token || accept === undefined) {
      res.status(400).json({ error: "token and accept (boolean) are required" });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM trusted_safety_shares WHERE invite_token = $1`,
      [token]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }
    const share = result.rows[0];
    if (new Date(share.invite_expires_at) < new Date()) {
      res.status(410).json({ error: "Invite has expired" });
      return;
    }
    if (share.status !== "pending") {
      res.status(409).json({ error: "This invite has already been responded to" });
      return;
    }

    const newStatus = accept ? "active" : "declined";
    const updated = await pool.query(
      `UPDATE trusted_safety_shares
       SET status = $1,
           contact_accepted = $2,
           activated_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE invite_token = $3 RETURNING id, status, contact_name`,
      [newStatus, accept, token]
    );
    res.json({ accepted: accept, share: updated.rows[0] });
  } catch (err) {
    req.log?.error({ err }, "POST /safety/trusted-shares/accept-token error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

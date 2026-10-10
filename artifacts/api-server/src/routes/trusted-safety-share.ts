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
import { createHash, randomUUID } from "crypto";

const router = Router();

const MAX_SHARES = 5;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// A trusted-share authorization is deliberately finite. An owner must explicitly
// resume or re-enable it to begin a fresh session after this window expires.
const ACTIVE_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type TrustedSafetyShareRow = Record<string, unknown>;

/** An active relationship without a recent explicit activation is not eligible. */
export function isFiniteTrustedSafetySession(
  activatedAt: Date | string | null | undefined,
  now = Date.now(),
): boolean {
  if (!activatedAt) return false;
  const activatedMs = new Date(activatedAt).getTime();
  return Number.isFinite(activatedMs)
    && activatedMs <= now
    && now - activatedMs < ACTIVE_SESSION_TTL_MS;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isInviteToken(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Owner views retain only the state needed to manage a share. Phone/email and
 * bearer invite tokens stay server-side and must never appear in a response.
 */
function ownerShareResponse(share: TrustedSafetyShareRow) {
  return {
    id: share.id,
    contact_type: share.contact_type,
    contact_user_id: share.contact_user_id ?? null,
    contact_name: share.contact_name,
    contact_first_name: share.contact_first_name ?? null,
    contact_last_name: share.contact_last_name ?? null,
    contact_avatar: share.contact_avatar ?? null,
    owner_enabled: share.owner_enabled === true,
    contact_accepted: share.contact_accepted === true,
    status: share.status,
    activated_at: share.activated_at ?? null,
    created_at: share.created_at,
    updated_at: share.updated_at,
  };
}

/** Contacts never receive stored phone/email values, tokens, or owner account IDs. */
function receivedShareResponse(share: TrustedSafetyShareRow) {
  return {
    id: share.id,
    contact_type: share.contact_type,
    contact_name: share.contact_name,
    owner_first_name: share.owner_first_name ?? null,
    owner_last_name: share.owner_last_name ?? null,
    owner_avatar: share.owner_avatar ?? null,
    owner_enabled: share.owner_enabled === true,
    contact_accepted: share.contact_accepted === true,
    status: share.status,
    activated_at: share.activated_at ?? null,
    created_at: share.created_at,
    updated_at: share.updated_at,
  };
}

type InviteDeliveryState = "not_attempted" | "in_app_created" | "provider_accepted" | "provider_rejected" | "not_configured" | "failed";
type InviteDeliveryAuditState = "attempted" | "accepted" | "failed";
type InviteDeliveryChannel = "in_app" | "push" | "sms" | "email";
type InviteDeliveryProvider = "in_app" | "expo" | "twilio" | "resend";

type ExpoPushResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

/**
 * The Expo send endpoint returns a ticket identifier after accepting a request.
 * That ticket is not a device-delivery receipt; callers must never describe it
 * as delivery to a device.
 */
export async function expoPushProviderReceipt(response: ExpoPushResponse): Promise<{
  state: "provider_accepted" | "provider_rejected";
  receipt: string | null;
}> {
  if (!response.ok) return { state: "provider_rejected", receipt: null };
  try {
    const body = await response.json() as {
      data?: { id?: unknown; status?: string } | Array<{ id?: unknown; status?: string }>;
    };
    const tickets = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
    const ticket = tickets.length === 1 ? tickets[0] : null;
    if (ticket?.status === "ok" && isProviderReceiptReference(ticket.id)) {
      return { state: "provider_accepted", receipt: ticket.id.trim() };
    }
  } catch {
    // A transport response without a parseable provider ticket is not proof of
    // acceptance. Do not promote it to a delivery claim.
  }
  return { state: "provider_rejected", receipt: null };
}

/** Kept for alert-contract callers that need only the non-delivery state. */
export async function expoPushRequestState(response: ExpoPushResponse): Promise<"provider_accepted" | "provider_rejected"> {
  return (await expoPushProviderReceipt(response)).state;
}

function isProviderReceiptReference(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 512;
}

/**
 * Provider receipt references are useful to audit but must not become a route
 * to recipient data. Persist only a non-reversible fingerprint, never a raw
 * recipient address, bearer token, or provider receipt reference.
 */
export function providerReceiptFingerprint(receipt: string): string {
  return createHash("sha256").update(receipt).digest("hex");
}

/**
 * Every actual invitation handoff is audit-first. The audit table intentionally
 * contains only the share relation, method/provider, state, timestamps, and an
 * optional receipt fingerprint; it has no phone, email, invite token, or raw
 * provider receipt columns.
 */
async function beginInviteDeliveryAttempt(
  shareId: string,
  channel: InviteDeliveryChannel,
  provider: InviteDeliveryProvider,
): Promise<string | null> {
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO trusted_safety_invitation_delivery_attempts
         (id, share_id, delivery_channel, provider, state, attempted_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'attempted', NOW(), NOW(), NOW())
       RETURNING id`,
      [shareId, channel, provider],
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function finishInviteDeliveryAttempt(
  attemptId: string,
  state: Exclude<InviteDeliveryAuditState, "attempted">,
  receipt: string | null = null,
): Promise<boolean> {
  try {
    const result = await pool.query<{ id: string }>(
      `UPDATE trusted_safety_invitation_delivery_attempts
          SET state = $1,
              provider_receipt_fingerprint = $2,
              completed_at = NOW(),
              updated_at = NOW()
        WHERE id = $3
          AND state = 'attempted'
        RETURNING id`,
      [state, receipt ? providerReceiptFingerprint(receipt) : null, attemptId],
    );
    return Boolean(result.rows[0]);
  } catch {
    return false;
  }
}

async function createMwmInviteNotification(
  ownerId: string,
  contactUserId: string,
  shareId: string,
): Promise<{ inApp: InviteDeliveryState; push: InviteDeliveryState }> {
  let ownerName: string;
  try {
    const ownerResult = await pool.query<{ first_name: string | null }>(
      `SELECT first_name FROM users WHERE id = $1 AND approved = true
       AND COALESCE(account_status, 'active') = 'active'`,
      [ownerId],
    );
    ownerName = ownerResult.rows[0]?.first_name?.trim() || "Someone";
  } catch {
    return { inApp: "failed", push: "not_attempted" };
  }

  const inAppAttemptId = await beginInviteDeliveryAttempt(shareId, "in_app", "in_app");
  if (!inAppAttemptId) return { inApp: "failed", push: "not_attempted" };

  try {
    const notification = await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, body, data, read, created_at)
       VALUES (gen_random_uuid(), $1, 'safety', $2, $3, $4::jsonb, false, NOW())
       RETURNING id`,
      [
        contactUserId,
        "Trusted Safety Share Request",
        `${ownerName} wants to share safety alerts with you. You will only receive severe safety alerts if you accept.`,
        JSON.stringify({ type: "trusted_safety_share_request", shareId }),
      ],
    );
    if (!notification.rows[0]) {
      await finishInviteDeliveryAttempt(inAppAttemptId, "failed");
      return { inApp: "failed", push: "not_attempted" };
    }
  } catch {
    await finishInviteDeliveryAttempt(inAppAttemptId, "failed");
    return { inApp: "failed", push: "not_attempted" };
  }

  // Do not represent an un-audited in-app record as successfully created.
  if (!await finishInviteDeliveryAttempt(inAppAttemptId, "accepted")) {
    return { inApp: "failed", push: "not_attempted" };
  }

  let pushAttemptId: string | null = null;
  try {
    const tokenResult = await pool.query<{ token: string }>(
      `SELECT pt.token
         FROM push_tokens pt
         JOIN notification_preferences np ON np.user_id = pt.user_id
        WHERE pt.user_id = $1
          AND np.push_enabled = true
          AND np.topics @> ARRAY['safety']::text[]
        LIMIT 1`,
      [contactUserId],
    );
    const token = tokenResult.rows[0]?.token;
    if (!token) return { inApp: "in_app_created", push: "not_attempted" };

    pushAttemptId = await beginInviteDeliveryAttempt(shareId, "push", "expo");
    if (!pushAttemptId) return { inApp: "in_app_created", push: "failed" };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title: "Trusted Safety Share Request",
        body: `${ownerName} wants to share safety alerts with you. You will only receive severe safety alerts if you accept.`,
        data: { type: "trusted_safety_share_request", shareId },
        sound: "default",
      }),
    });
    const push = await expoPushProviderReceipt(response);
    const persisted = await finishInviteDeliveryAttempt(
      pushAttemptId,
      push.state === "provider_accepted" ? "accepted" : "failed",
      push.receipt,
    );
    return { inApp: "in_app_created", push: persisted ? push.state : "failed" };
  } catch {
    // Do not log a provider error object: it can contain a phone, email, or token.
    if (pushAttemptId) await finishInviteDeliveryAttempt(pushAttemptId, "failed");
    return { inApp: "in_app_created", push: "failed" };
  }
}

function trustedSafetyInviteUrl(token: string): string | null {
  // A deployment must explicitly provide a public recipient-facing template,
  // e.g. https://example.com/safety/invite/{token}. Never fall back to a
  // guessed host or return the bearer token to the owner/client.
  const template = process.env.TRUSTED_SAFETY_SHARE_INVITE_URL;
  if (!template || !template.includes("{token}")) return null;
  return template.replace("{token}", encodeURIComponent(token));
}

async function deliverExternalInvite(
  shareId: string,
  contactType: "phone" | "email",
  contactAddress: string,
  inviteToken: string,
): Promise<InviteDeliveryState> {
  const channel: InviteDeliveryChannel = contactType === "phone" ? "sms" : "email";
  const provider: InviteDeliveryProvider = contactType === "phone" ? "twilio" : "resend";
  const attemptId = await beginInviteDeliveryAttempt(shareId, channel, provider);
  if (!attemptId) return "failed";

  const finalize = async (state: InviteDeliveryState, receipt: string | null = null) => {
    const persisted = await finishInviteDeliveryAttempt(
      attemptId,
      state === "provider_accepted" ? "accepted" : "failed",
      receipt,
    );
    return persisted ? state : "failed";
  };
  const inviteUrl = trustedSafetyInviteUrl(inviteToken);
  if (!inviteUrl) return finalize("not_configured");
  try {
    if (contactType === "phone") {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      if (!sid || !authToken || !from) return finalize("not_configured");
      const { default: twilio } = await import("twilio");
      const message = await twilio(sid, authToken).messages.create({
        from,
        to: contactAddress,
        body: `You have been invited to receive severe safety alerts from a Mapping With Melanin member. Review or decline: ${inviteUrl}`,
      });
      return isProviderReceiptReference(message.sid)
        ? finalize("provider_accepted", message.sid)
        : finalize("provider_rejected");
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return finalize("not_configured");
    const { Resend } = await import("resend");
    const response = await new Resend(resendKey).emails.send({
      from: "Mapping With Melanin <safety@mappingwithmelanin.com>",
      to: contactAddress,
      subject: "Trusted Safety Share invitation",
      html: `<p>You have been invited to receive severe safety alerts from a Mapping With Melanin member.</p><p><a href="${inviteUrl}">Review or decline this invitation</a>.</p>`,
    });
    return !response.error && isProviderReceiptReference(response.data?.id)
      ? finalize("provider_accepted", response.data.id)
      : finalize("provider_rejected");
  } catch {
    // Provider exceptions may echo a phone number, email, or token: do not log them.
    return finalize("failed");
  }
}

/**
 * Normalize an address before both comparison and storage. This keeps cosmetic
 * differences (case, spaces, punctuation in a US phone number) from creating
 * multiple alerts for the same person.
 */
export function normalizeTrustedContactEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeTrustedContactPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Keep the country prefix when supplied. A leading 1 is normalized so
  // +1 (555) 123-4567 and 555-123-4567 compare as the same US number.
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

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

    if (typeof contactName !== "string" || !contactName.trim()) {
      res.status(400).json({ error: "contactName is required" });
      return;
    }
    if (contactName.trim().length > 100) {
      res.status(400).json({ error: "contactName must be at most 100 characters" });
      return;
    }
    const type = contactType ?? "phone";
    if (!["mwm_user", "phone", "email"].includes(type)) {
      res.status(400).json({ error: "contactType must be mwm_user, phone, or email" });
      return;
    }
    if (type === "mwm_user" && (typeof contactUserId !== "string" || !contactUserId.trim())) {
      res.status(400).json({ error: "contactUserId required for mwm_user type" });
      return;
    }
    if (type === "phone" && (typeof contactPhone !== "string" || !contactPhone.trim())) {
      res.status(400).json({ error: "contactPhone required for phone type" });
      return;
    }
    if (type === "email" && (typeof contactEmail !== "string" || !contactEmail.trim())) {
      res.status(400).json({ error: "contactEmail required for email type" });
      return;
    }
    const normalizedPhone = type === "phone" && typeof contactPhone === "string"
      ? normalizeTrustedContactPhone(contactPhone)
      : null;
    const normalizedEmail = type === "email" && typeof contactEmail === "string"
      ? normalizeTrustedContactEmail(contactEmail)
      : null;
    if (type === "phone" && !normalizedPhone?.match(/^\+\d{7,15}$/)) {
      res.status(400).json({ error: "contactPhone must be a valid phone number" });
      return;
    }
    if (type === "email" && !normalizedEmail?.includes("@")) {
      res.status(400).json({ error: "contactEmail must be a valid email address" });
      return;
    }
    // Can't add yourself
    if (type === "mwm_user" && contactUserId === ownerId) {
      res.status(400).json({ error: "Cannot add yourself as a trusted contact" });
      return;
    }

    const inviteToken = randomUUID();
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

    // MWM users are immediately pending (they must accept via the app).
    // External contacts are pending until they accept via the invite link.
    const initialStatus = "pending";
    // MWM users: contact_accepted stays false until they respond.

    // The lock makes the cap and duplicate checks atomic for an owner. It is
    // intentionally transaction-scoped: a concurrent add cannot slip between
    // the check and insert and cause duplicate emergency notifications.
    const client = await pool.connect();
    let share!: { id: string };
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [ownerId]);
      if (type === "mwm_user") {
        // An app member can only be invited while both accounts are active and
        // neither party has blocked the other. Do not disclose which check failed.
        const eligibleContact = await client.query(
          `SELECT contact.id
             FROM users contact
             JOIN users owner ON owner.id = $1
             LEFT JOIN user_blocks owner_blocks
               ON owner_blocks.blocker_id = owner.id AND owner_blocks.blocked_id = contact.id
             LEFT JOIN user_blocks contact_blocks
               ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = owner.id
            WHERE contact.id = $2
              AND contact.approved = true
              AND COALESCE(contact.account_status, 'active') = 'active'
              AND owner.approved = true
              AND COALESCE(owner.account_status, 'active') = 'active'
              AND owner_blocks.id IS NULL
              AND contact_blocks.id IS NULL
            FOR KEY SHARE`,
          [ownerId, contactUserId],
        );
        if (!eligibleContact.rows[0]) {
          await client.query("ROLLBACK");
          res.status(400).json({ error: "That contact is not currently eligible for a trusted safety share" });
          return;
        }
      }
      const countResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM trusted_safety_shares
         WHERE owner_id = $1 AND status != 'revoked' AND status != 'declined'`,
        [ownerId]
      );
      if (parseInt(countResult.rows[0]?.count ?? "0", 10) >= MAX_SHARES) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: `Maximum of ${MAX_SHARES} trusted contacts allowed` });
        return;
      }

      const dupCheck = await client.query(
        `SELECT id FROM trusted_safety_shares
         WHERE owner_id = $1
           AND status NOT IN ('revoked','declined')
           AND (
             ($2 = 'mwm_user' AND contact_user_id = $3)
             OR ($2 = 'phone' AND regexp_replace(contact_phone, '\\D', '', 'g') = regexp_replace($4, '\\D', '', 'g'))
             OR ($2 = 'email' AND lower(trim(contact_email)) = lower(trim($5)))
           )`,
        [ownerId, type, contactUserId ?? null, normalizedPhone, normalizedEmail]
      );
      if (dupCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "This contact is already added" });
        return;
      }

      const result = await client.query(
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
        type === "mwm_user" ? contactUserId : null,
        contactName.trim(),
        normalizedPhone,
        normalizedEmail,
        initialStatus,
        inviteToken,
        inviteExpiresAt,
      ]
      );
      share = result.rows[0];
      await client.query("COMMIT");
    } catch (transactionErr) {
      await client.query("ROLLBACK").catch(() => {});
      throw transactionErr;
    } finally {
      client.release();
    }

    let invitationDelivery:
      | { inApp: InviteDeliveryState; push: InviteDeliveryState }
      | { provider: InviteDeliveryState }
      | undefined;
    // An in-app record is the durable invitation. A provider request, if enabled,
    // is reported only as accepted/rejected, never as delivered to a device.
    if (type === "mwm_user" && contactUserId) {
      invitationDelivery = await createMwmInviteNotification(ownerId, contactUserId, share.id);
    } else if (type === "phone" && normalizedPhone) {
      invitationDelivery = { provider: await deliverExternalInvite(share.id, "phone", normalizedPhone, inviteToken) };
    } else if (type === "email" && normalizedEmail) {
      invitationDelivery = { provider: await deliverExternalInvite(share.id, "email", normalizedEmail, inviteToken) };
    }

    res.status(201).json({
      share: ownerShareResponse(share),
      ...(invitationDelivery ? { invitationDelivery } : {}),
    });
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
    res.json({ shares: result.rows.map(ownerShareResponse) });
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
       LEFT JOIN user_blocks owner_blocks
         ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = $1
       LEFT JOIN user_blocks contact_blocks
         ON contact_blocks.blocker_id = $1 AND contact_blocks.blocked_id = tss.owner_id
       WHERE tss.contact_user_id = $1
         AND tss.status NOT IN ('revoked')
         AND owner_blocks.id IS NULL
         AND contact_blocks.id IS NULL
       ORDER BY tss.created_at DESC`,
      [userId]
    );
    res.json({ shares: result.rows.map(receivedShareResponse) });
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

    const revoked = await pool.query<{ contact_user_id: string | null }>(
      `UPDATE trusted_safety_shares
       SET status = 'revoked',
           owner_enabled = false,
           invite_token = NULL,
           invite_expires_at = NOW(),
           revoked_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND owner_id = $2
       RETURNING contact_user_id`,
      [id, ownerId],
    );
    if (!revoked.rows[0]) {
      res.status(404).json({ error: "Share not found" });
      return;
    }
    // The read boundary independently re-authorizes every coordinate access,
    // and this explicit scrub removes the last precise location immediately.
    if (revoked.rows[0].contact_user_id) {
      await pool.query(
        `UPDATE location_shares
            SET is_active = false,
                current_lat = NULL,
                current_lng = NULL,
                last_updated_at = NULL
          WHERE sharer_id = $1
            AND recipient_user_id = $2
            AND is_active = true`,
        [ownerId, revoked.rows[0].contact_user_id],
      );
    }
    res.json({ revoked: true });
  } catch (err) {
    req.log?.error({ err }, "DELETE /safety/trusted-shares/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /safety/trusted-shares/:id/enabled ─────────────────────────────────
// Owner master control. Enabling is an explicit fresh authorization session;
// it cannot resurrect a revoked or declined relationship.
router.patch("/safety/trusted-shares/:id/enabled", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const ownerId = req.user!.id;
    const { enabled } = req.body as { enabled?: unknown };
    if (!isBoolean(enabled)) {
      res.status(400).json({ error: "enabled (boolean) is required" });
      return;
    }

    const result = enabled
      ? await pool.query(
        `UPDATE trusted_safety_shares
            SET owner_enabled = true,
                status = CASE
                  WHEN status = 'paused_manual' AND contact_accepted = true THEN 'active'
                  ELSE status
                END,
                activated_at = CASE WHEN contact_accepted = true THEN NOW() ELSE activated_at END,
                updated_at = NOW()
          WHERE id = $1
            AND owner_id = $2
            AND status NOT IN ('revoked', 'declined')
          RETURNING *`,
        [req.params.id, ownerId],
      )
      : await pool.query(
        `UPDATE trusted_safety_shares
            SET owner_enabled = false,
                status = CASE WHEN status IN ('active', 'paused_home') THEN 'paused_manual' ELSE status END,
                updated_at = NOW()
          WHERE id = $1
            AND owner_id = $2
            AND status NOT IN ('revoked', 'declined')
          RETURNING *`,
        [req.params.id, ownerId],
      );
    if (!result.rows[0]) {
      res.status(409).json({ error: "This share cannot be enabled or disabled" });
      return;
    }
    res.json({ share: ownerShareResponse(result.rows[0]) });
  } catch (err) {
    req.log?.error({ err }, "PATCH /safety/trusted-shares/:id/enabled error");
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
    const { pause } = req.body as { pause?: unknown };
    if (!isBoolean(pause)) {
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
    const current = existing.rows[0] as {
      status: string;
      contact_accepted: boolean;
      owner_enabled: boolean;
    };
    if (pause && current.status === "paused_manual") {
      res.json({ share: ownerShareResponse(current) });
      return;
    }
    if (pause && current.status !== "active") {
      res.status(409).json({ error: "Only an active accepted share can be paused" });
      return;
    }
    if (!pause && (current.status !== "paused_manual" || current.contact_accepted !== true || current.owner_enabled !== true)) {
      res.status(409).json({ error: "This contact must accept the share before it can be resumed" });
      return;
    }

    const currentStatus = pause ? "active" : "paused_manual";
    const newStatus = pause ? "paused_manual" : "active";
    const result = await pool.query(
      `UPDATE trusted_safety_shares
       SET status = $1,
           activated_at = CASE WHEN $1 = 'active' THEN NOW() ELSE activated_at END,
           updated_at = NOW()
       WHERE id = $2
         AND owner_id = $3
         AND status = $4
         AND ($1 != 'active' OR (contact_accepted = true AND owner_enabled = true))
       RETURNING *`,
      [newStatus, id, ownerId, currentStatus]
    );
    if (!result.rows[0]) {
      res.status(409).json({ error: "The share changed before this request completed. Refresh and try again." });
      return;
    }
    res.json({ share: ownerShareResponse(result.rows[0]) });
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
    const { accept } = req.body as { accept?: unknown };
    if (!isBoolean(accept)) {
      res.status(400).json({ error: "accept (boolean) is required" });
      return;
    }

    const result = await pool.query(
      `UPDATE trusted_safety_shares
       SET status = CASE
             WHEN $1 = false THEN 'declined'
             WHEN trusted_safety_shares.owner_enabled = true THEN 'active'
             ELSE 'paused_manual'
           END,
           contact_accepted = $1,
           activated_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       FROM users owner
       JOIN users contact ON contact.id = $3
       LEFT JOIN user_blocks owner_blocks
         ON owner_blocks.blocker_id = owner.id AND owner_blocks.blocked_id = contact.id
       LEFT JOIN user_blocks contact_blocks
         ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = owner.id
       WHERE trusted_safety_shares.id = $2
         AND trusted_safety_shares.owner_id = owner.id
         AND trusted_safety_shares.contact_user_id = $3
         AND trusted_safety_shares.contact_type = 'mwm_user'
         AND status = 'pending'
         AND contact_accepted = false
         AND invite_expires_at > NOW()
         AND (
           $1 = false
           OR (
             owner.approved = true
             AND COALESCE(owner.account_status, 'active') = 'active'
             AND contact.approved = true
             AND COALESCE(contact.account_status, 'active') = 'active'
             AND owner_blocks.id IS NULL
             AND contact_blocks.id IS NULL
           )
         )
       RETURNING *`,
      [accept, id, userId]
    );
    if (!result.rows[0]) {
      res.status(409).json({ error: "This share request is no longer pending or has expired" });
      return;
    }
    res.json({ share: receivedShareResponse(result.rows[0]) });
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
    if (!isInviteToken(token)) {
      res.status(404).json({ error: "Invite not found or expired" });
      return;
    }
    res.set("Cache-Control", "no-store, private, max-age=0");
    res.set("Pragma", "no-cache");
    const result = await pool.query(
      `SELECT tss.id, tss.invite_expires_at,
              u.first_name AS owner_first_name
       FROM trusted_safety_shares tss
       JOIN users u ON u.id = tss.owner_id
       WHERE tss.invite_token = $1
         AND tss.contact_type IN ('phone', 'email')
         AND tss.status = 'pending'
         AND tss.contact_accepted = false
         AND tss.invite_expires_at > NOW()
         AND tss.owner_enabled = true
         AND u.approved = true
         AND COALESCE(u.account_status, 'active') = 'active'`,
      [token]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Invite not found or expired" });
      return;
    }
    const row = result.rows[0];
    res.json({
      ownerFirstName: row.owner_first_name,
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
    const { token, accept } = req.body as { token?: unknown; accept?: unknown };
    if (!isInviteToken(token) || !isBoolean(accept)) {
      res.status(400).json({ error: "token and accept (boolean) are required" });
      return;
    }

    const updated = await pool.query(
      `UPDATE trusted_safety_shares
       SET status = CASE
             WHEN $1 = false THEN 'declined'
             WHEN trusted_safety_shares.owner_enabled = true THEN 'active'
             ELSE 'paused_manual'
           END,
           contact_accepted = $1,
           activated_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       FROM users owner
       WHERE trusted_safety_shares.invite_token = $2
         AND trusted_safety_shares.owner_id = owner.id
         AND trusted_safety_shares.contact_type IN ('phone', 'email')
         AND status = 'pending'
         AND contact_accepted = false
         AND invite_expires_at > NOW()
         AND owner.approved = true
         AND COALESCE(owner.account_status, 'active') = 'active'
       RETURNING id, status`,
      [accept, token]
    );
    if (!updated.rows[0]) {
      res.status(409).json({ error: "This invite is no longer pending or has expired" });
      return;
    }
    res.json({ accepted: accept, share: updated.rows[0] });
  } catch (err) {
    req.log?.error({ err }, "POST /safety/trusted-shares/accept-token error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

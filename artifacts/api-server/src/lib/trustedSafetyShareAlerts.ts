/**
 * Trusted Safety Share — Alert Delivery
 *
 * Called whenever a real safety event fires for a user. Mirrors the alert
 * to all their active trusted contacts — by push (MWM users), SMS (phone),
 * or email (coming soon via Resend).
 *
 * What triggers this function:
 *   ✅ Severe weather (hurricane, tornado, flash flood, blizzard)
 *   ✅ Civil / government emergency (FEMA IPAWS)
 *   ✅ Natural disaster (earthquake, wildfire, tsunami)
 *   ✅ Platform community safety cluster (shooting, active threat)
 *   ❌ Minor weather (rain, heat advisory)
 *   ❌ Administrative alerts (road closures, ICE checkpoints)
 *   ❌ Any user activity (searches, saves, check-ins)
 *
 * Privacy contract:
 *   • Contacts see: owner's FIRST NAME only, general CITY/REGION, alert text.
 *   • No GPS coordinates, no activity, no context beyond the emergency.
 *   • Auto-skips if owner's alert city matches their registered home city
 *     (they're home — no need to worry their family).
 *
 * Notification text (exactly as specified by the founder):
 *   "Safety Alert — [Name] is currently in [City, Region]. [Alert description].
 *    This alert was also sent to them. No action is required unless you hear otherwise."
 */

import { pool } from "@workspace/db";
import pino from "pino";
import {
  deactivateTrustedLocationShares,
  expireTrustedSafetySessions,
  TRUSTED_SAFETY_SESSION_INTERVAL,
} from "./trustedSafetyShareLifecycle";

const logger = pino({ name: "trusted-safety-share-alerts" });

export interface TrustedSafetyAlertPayload {
  /** User ID of the traveler who received the alert. */
  ownerId: string;
  /** Traveler's first name (for notification copy). */
  ownerFirstName: string;
  /** General city / area where the alert fired — NOT GPS coordinates. */
  locationCity: string;
  /** Region / state / country for context (e.g. "Hawaii" or "Maui, Hawaii"). */
  locationRegion: string;
  /** Short title of the alert, e.g. "Hurricane Watch". */
  alertTitle: string;
  /** One-sentence description of the emergency. */
  alertDescription: string;
  /** Category used for filtering — only severe types are mirrored. */
  alertType: "weather" | "civil_emergency" | "natural_disaster" | "community_safety";
  /** Source system that fired the alert. */
  alertSource?: "noaa" | "fema" | "mwm_community";
}

const SEVERE_TYPES: TrustedSafetyAlertPayload["alertType"][] = [
  "weather",
  "civil_emergency",
  "natural_disaster",
  "community_safety",
];

export type TrustedSafetyDeliveryStatus =
  | "pending"
  | "in_app_created"
  | "provider_accepted"
  | "provider_rejected"
  | "not_configured"
  | "failed";

export interface TrustedSafetyDispatchResult {
  eligibleContacts: number;
  inAppCreated: number;
  providerAccepted: number;
  providerRejected: number;
  notConfigured: number;
  failed: number;
  auditFailures: number;
  skipped: boolean;
}

function emptyDispatchResult(skipped = false): TrustedSafetyDispatchResult {
  return {
    eligibleContacts: 0,
    inAppCreated: 0,
    providerAccepted: 0,
    providerRejected: 0,
    notConfigured: 0,
    failed: 0,
    auditFailures: 0,
    skipped,
  };
}

/** Reject malformed or privacy-unsafe runtime input before any database read. */
export function isTrustedSafetyAlertPayload(value: unknown): value is TrustedSafetyAlertPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  // Allowlisting is deliberate: this handoff cannot grow to contain a precise
  // position, recipient identity, or behavioral context through a new caller.
  const allowedKeys = new Set([
    "ownerId", "ownerFirstName", "locationCity", "locationRegion",
    "alertTitle", "alertDescription", "alertType", "alertSource",
  ]);
  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) return false;
  const strings = [
    payload.ownerId,
    payload.ownerFirstName,
    payload.locationCity,
    payload.locationRegion,
    payload.alertTitle,
    payload.alertDescription,
  ];
  if (strings.some((field) => typeof field !== "string" || !field.trim() || field.length > 500)) return false;
  if (!SEVERE_TYPES.includes(payload.alertType as TrustedSafetyAlertPayload["alertType"])) return false;
  return payload.alertSource === undefined
    || payload.alertSource === "noaa"
    || payload.alertSource === "fema"
    || payload.alertSource === "mwm_community";
}

/** A 2xx Expo response is a provider acknowledgement, not device delivery. */
export async function expoPushRequestState(
  response: Pick<Response, "ok" | "json">,
): Promise<"provider_accepted" | "provider_rejected"> {
  if (!response.ok) return "provider_rejected";
  try {
    const body = await response.json() as { data?: { status?: string } | Array<{ status?: string }> };
    const tickets = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
    if (tickets.some((ticket) => ticket.status && ticket.status !== "ok")) return "provider_rejected";
  } catch {
    // A successful transport response remains only a provider acknowledgement.
  }
  return "provider_accepted";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function trustedSafetyInAppNotification(
  shareId: string,
  alertType: TrustedSafetyAlertPayload["alertType"],
  locationCity: string,
  locationRegion: string,
  title: string,
  body: string,
) {
  // This is the documented fallback for an unavailable push token or a failed
  // Expo request. The member sees it in the in-app notification center on
  // their next open. Do not add owner IDs, coordinates, or activity here.
  return {
    type: "safety",
    title,
    body,
    data: { alertType, locationCity, locationRegion, shareId },
  };
}

type EligibleTrustedSafetyShare = {
  id: string;
  contact_type: "mwm_user" | "phone" | "email";
  contact_user_id: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  push_enabled: boolean;
};

type DeliveryAttempt = {
  method: "in_app" | "in_app+push" | "push" | "sms" | "email" | "none";
  status: TrustedSafetyDeliveryStatus;
  errorMessage: string | null;
};

async function beginDeliveryAudit(
  shareId: string,
  payload: TrustedSafetyAlertPayload,
  notificationBody: string,
): Promise<string | null> {
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO trusted_safety_alert_log
         (id, share_id, owner_id, alert_type, alert_source, alert_title,
          alert_body, location_city, location_region,
          contact_delivery_method, delivery_status, error_message, created_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,'none','pending',NULL,NOW())
       RETURNING id`,
      [
        shareId,
        payload.ownerId,
        payload.alertType,
        payload.alertSource ?? "mwm_community",
        payload.alertTitle,
        notificationBody,
        payload.locationCity,
        payload.locationRegion,
      ],
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function finishDeliveryAudit(auditId: string, attempt: DeliveryAttempt): Promise<boolean> {
  try {
    const result = await pool.query<{ id: string }>(
      `UPDATE trusted_safety_alert_log
          SET contact_delivery_method = $1,
              delivery_status = $2,
              error_message = $3
        WHERE id = $4
        RETURNING id`,
      [attempt.method, attempt.status, attempt.errorMessage, auditId],
    );
    return Boolean(result.rows[0]);
  } catch {
    return false;
  }
}

async function deliverToMwmContact(
  share: EligibleTrustedSafetyShare,
  alertType: TrustedSafetyAlertPayload["alertType"],
  locationCity: string,
  locationRegion: string,
  title: string,
  body: string,
): Promise<DeliveryAttempt> {
  if (!share.contact_user_id) {
    return { method: "none", status: "failed", errorMessage: "Eligible app contact was unavailable" };
  }
  try {
    const inApp = trustedSafetyInAppNotification(
      share.id, alertType, locationCity, locationRegion, title, body,
    );
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO notifications (id, user_id, type, title, body, data, read, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, false, NOW())
       RETURNING id`,
      [share.contact_user_id, inApp.type, inApp.title, inApp.body, JSON.stringify(inApp.data)],
    );
    if (!inserted.rows[0]) {
      return { method: "in_app", status: "failed", errorMessage: "In-app notification record was not created" };
    }

    if (!share.push_enabled) {
      return { method: "in_app", status: "in_app_created", errorMessage: null };
    }
    const tokenResult = await pool.query<{ token: string }>(
      `SELECT token FROM push_tokens WHERE user_id = $1 LIMIT 1`,
      [share.contact_user_id],
    );
    const token = tokenResult.rows[0]?.token;
    if (!token) return { method: "in_app", status: "in_app_created", errorMessage: null };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: { type: "trusted_safety_alert", alertType, locationCity, locationRegion, shareId: share.id },
        sound: "default",
        priority: "high",
      }),
    });
    const pushState = await expoPushRequestState(response);
    if (pushState === "provider_accepted") {
      return { method: "push", status: "provider_accepted", errorMessage: null };
    }
    return {
      method: "in_app+push",
      status: "in_app_created",
      errorMessage: "Push provider rejected the request; an in-app notification record exists",
    };
  } catch {
    // Provider errors can contain contact tokens. The in-app state remains truthful.
    return { method: "in_app+push", status: "in_app_created", errorMessage: "Push request failed; an in-app notification record may exist" };
  }
}

async function deliverToExternalContact(
  share: EligibleTrustedSafetyShare,
  ownerFirstName: string,
  location: string,
  body: string,
): Promise<DeliveryAttempt> {
  try {
    if (share.contact_type === "phone" && share.contact_phone) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM_NUMBER;
      if (!sid || !token || !from) {
        return { method: "sms", status: "not_configured", errorMessage: "SMS provider is not configured" };
      }
      const { default: twilio } = await import("twilio");
      const message = await twilio(sid, token).messages.create({
        from,
        to: share.contact_phone,
        body: `MWM Safety Alert — ${body}`,
      });
      return message.sid
        ? { method: "sms", status: "provider_accepted", errorMessage: null }
        : { method: "sms", status: "provider_rejected", errorMessage: "SMS provider did not acknowledge the request" };
    }
    if (share.contact_type === "email" && share.contact_email) {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        return { method: "email", status: "not_configured", errorMessage: "Email provider is not configured" };
      }
      const { Resend } = await import("resend");
      const response = await new Resend(resendKey).emails.send({
        from: "Mapping With Melanin <safety@mappingwithmelanin.com>",
        to: share.contact_email,
        subject: `Safety Alert — ${ownerFirstName} in ${location}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a;margin-bottom:8px">Safety Alert</h2>
          <p style="color:#333;font-size:16px;line-height:1.6">${escapeHtml(body)}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:13px">You received this because ${escapeHtml(ownerFirstName)} added you as a trusted safety contact on Mapping With Melanin.</p>
        </div>`,
      });
      return response.error || !response.data?.id
        ? { method: "email", status: "provider_rejected", errorMessage: "Email provider rejected the request" }
        : { method: "email", status: "provider_accepted", errorMessage: null };
    }
    return { method: "none", status: "failed", errorMessage: "Eligible contact had no configured delivery address" };
  } catch {
    // Never persist raw provider errors; they can echo a phone number or email.
    return { method: share.contact_type === "phone" ? "sms" : "email", status: "failed", errorMessage: "Provider request failed" };
  }
}

function countAttempt(result: TrustedSafetyDispatchResult, attempt: DeliveryAttempt) {
  if (attempt.status === "in_app_created") result.inAppCreated += 1;
  if (attempt.status === "provider_accepted") result.providerAccepted += 1;
  if (attempt.status === "provider_rejected") result.providerRejected += 1;
  if (attempt.status === "not_configured") result.notConfigured += 1;
  if (attempt.status === "failed") result.failed += 1;
}

/**
 * Mirror an already-issued severe safety alert to currently eligible contacts.
 * Every delivery is audit-first; without an audit row, no notification/provider
 * request is made. Provider acknowledgement is not represented as delivery.
 */
export async function notifyTrustedSafetyContacts(
  payload: TrustedSafetyAlertPayload,
): Promise<TrustedSafetyDispatchResult> {
  if (!isTrustedSafetyAlertPayload(payload)) return emptyDispatchResult(true);
  const result = emptyDispatchResult();
  const alertSource = payload.alertSource ?? "mwm_community";
  try {
    // Expiry is a lifecycle event, not an eventual retention job. It must end
    // alert eligibility and delete linked precise locations before dispatch.
    await expireTrustedSafetySessions(payload.ownerId);
    const ownerResult = await pool.query<{ home_city: string | null }>(
      `SELECT home_city
         FROM users
        WHERE id = $1
          AND approved = true
          AND COALESCE(account_status, 'active') = 'active'`,
      [payload.ownerId],
    );
    const owner = ownerResult.rows[0];
    if (!owner) return emptyDispatchResult(true);

    const homeCity = owner.home_city?.trim().toLocaleLowerCase() ?? "";
    const alertCity = payload.locationCity.trim().toLocaleLowerCase();
    if (homeCity && homeCity === alertCity) {
      const paused = await pool.query<{ contact_user_id: string | null }>(
        `UPDATE trusted_safety_shares
            SET status = 'paused_home', updated_at = NOW()
          WHERE owner_id = $1
            AND status = 'active'
            AND owner_enabled = true
            AND contact_accepted = true
            AND activated_at > NOW() - INTERVAL '${TRUSTED_SAFETY_SESSION_INTERVAL}'
            AND activated_at <= NOW()
          RETURNING contact_user_id`,
        [payload.ownerId],
      );
      await deactivateTrustedLocationShares(
        payload.ownerId,
        paused.rows.flatMap((share) => share.contact_user_id ? [share.contact_user_id] : []),
      );
      return emptyDispatchResult(true);
    }

    // Leaving home resumes only a still-valid authorization. Manual pause,
    // revocation, decline, expiry, blocks, and preferences remain enforced below.
    await pool.query(
      `UPDATE trusted_safety_shares
          SET status = 'active', updated_at = NOW()
        WHERE owner_id = $1
          AND status = 'paused_home'
          AND owner_enabled = true
          AND contact_accepted = true
          AND activated_at > NOW() - INTERVAL '${TRUSTED_SAFETY_SESSION_INTERVAL}'
          AND activated_at <= NOW()`,
      [payload.ownerId],
    );

    const sharesResult = await pool.query<EligibleTrustedSafetyShare>(
      `SELECT tss.id, tss.contact_type, tss.contact_user_id, tss.contact_phone, tss.contact_email,
              COALESCE(np.push_enabled, false) AS push_enabled
         FROM trusted_safety_shares tss
         LEFT JOIN users contact ON contact.id = tss.contact_user_id
         LEFT JOIN notification_preferences np ON np.user_id = contact.id
         LEFT JOIN user_blocks owner_blocks
           ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = contact.id
         LEFT JOIN user_blocks contact_blocks
           ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = tss.owner_id
        WHERE tss.owner_id = $1
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND tss.activated_at > NOW() - INTERVAL '${TRUSTED_SAFETY_SESSION_INTERVAL}'
          AND tss.activated_at <= NOW()
          AND (
            (tss.contact_type = 'mwm_user'
             AND tss.contact_user_id IS NOT NULL
             AND contact.approved = true
             AND COALESCE(contact.account_status, 'active') = 'active'
             AND np.topics @> ARRAY['safety']::text[]
             AND owner_blocks.id IS NULL
             AND contact_blocks.id IS NULL)
            OR (tss.contact_type = 'phone' AND tss.contact_phone IS NOT NULL)
            OR (tss.contact_type = 'email' AND tss.contact_email IS NOT NULL)
          )`,
      [payload.ownerId],
    );
    result.eligibleContacts = sharesResult.rows.length;
    if (sharesResult.rows.length === 0) return result;

    const location = `${payload.locationCity.trim()}, ${payload.locationRegion.trim()}`;
    const title = `Safety Alert — ${payload.ownerFirstName.trim()}`;
    const body = `${payload.ownerFirstName.trim()} is currently in ${location}. ${payload.alertTitle.trim()}: ${payload.alertDescription.trim()} This alert was also sent to them. No action is required unless you hear otherwise.`;

    for (const share of sharesResult.rows) {
      const auditId = await beginDeliveryAudit(share.id, { ...payload, alertSource }, body);
      if (!auditId) {
        result.auditFailures += 1;
        continue;
      }
      const attempt = share.contact_type === "mwm_user"
        ? await deliverToMwmContact(share, payload.alertType, payload.locationCity, payload.locationRegion, title, body)
        : await deliverToExternalContact(share, payload.ownerFirstName.trim(), location, body);
      countAttempt(result, attempt);
      if (!await finishDeliveryAudit(auditId, attempt)) result.auditFailures += 1;
    }

    logger.info(
      { ownerId: payload.ownerId, eligibleContacts: result.eligibleContacts, alertType: payload.alertType },
      "Trusted safety share dispatch attempts completed",
    );
    return result;
  } catch {
    // Do not leak provider, contact, or location details through process logs.
    logger.error({ ownerId: payload.ownerId, alertSource }, "Trusted safety share dispatch stopped safely");
    return { ...result, failed: result.failed + 1 };
  }
}

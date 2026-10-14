/**
 * Trusted Safety Alerts — durable, consent-bounded alert dispatch.
 *
 * An accepted contact relationship is a persistent guardian authorization. A
 * temporary live-location session is separate and is never inferred here.
 * This module records each eligible dispatch before attempting a provider,
 * creates a durable in-app notice for MWM members, and retains bounded retry
 * state without storing a phone number, email, token, coordinate, or activity.
 */
import { createHash } from "node:crypto";
import { pool } from "@workspace/db";
import pino from "pino";
import { expireTrustedLocationSessions } from "./trustedSafetyShareLifecycle";
import { allowsSafetyCheckinNotification } from "./safetyNotificationPreferences";

const logger = pino({ name: "trusted-safety-alerts" });
const MAX_RETRY_ATTEMPTS = 3;

export interface TrustedSafetyAlertPayload {
  /** Stable opaque identifier from the approved severe-alert source. */
  eventId: string;
  ownerId: string;
  ownerFirstName: string;
  /** General city/region only — never a coordinate, address, or travel trail. */
  locationCity: string;
  locationRegion: string;
  alertTitle: string;
  alertDescription: string;
  alertType: "weather" | "civil_emergency" | "natural_disaster" | "community_safety";
  alertSource?: "noaa" | "fema" | "mwm_community";
}

const SEVERE_TYPES: TrustedSafetyAlertPayload["alertType"][] = [
  "weather", "civil_emergency", "natural_disaster", "community_safety",
];

export type TrustedSafetyDeliveryStatus =
  | "pending"
  | "in_app_created"
  | "provider_accepted"
  | "provider_rejected"
  | "not_configured"
  | "retry_scheduled"
  | "acknowledged"
  | "failed";

export interface TrustedSafetyDispatchResult {
  eligibleContacts: number;
  inAppCreated: number;
  providerAccepted: number;
  providerRejected: number;
  notConfigured: number;
  retryScheduled: number;
  failed: number;
  duplicateEvents: number;
  auditFailures: number;
  skipped: boolean;
}

function emptyDispatchResult(skipped = false): TrustedSafetyDispatchResult {
  return {
    eligibleContacts: 0, inAppCreated: 0, providerAccepted: 0,
    providerRejected: 0, notConfigured: 0, retryScheduled: 0,
    failed: 0, duplicateEvents: 0, auditFailures: 0, skipped,
  };
}

/** Reject malformed or privacy-unsafe runtime input before any database read. */
export function isTrustedSafetyAlertPayload(value: unknown): value is TrustedSafetyAlertPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  const allowedKeys = new Set([
    "eventId", "ownerId", "ownerFirstName", "locationCity", "locationRegion",
    "alertTitle", "alertDescription", "alertType", "alertSource",
  ]);
  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) return false;
  const strings = [
    payload.eventId, payload.ownerId, payload.ownerFirstName, payload.locationCity,
    payload.locationRegion, payload.alertTitle, payload.alertDescription,
  ];
  if (strings.some((field) => typeof field !== "string" || !field.trim() || field.length > 500)) return false;
  if (!SEVERE_TYPES.includes(payload.alertType as TrustedSafetyAlertPayload["alertType"])) return false;
  return payload.alertSource === undefined
    || payload.alertSource === "noaa"
    || payload.alertSource === "fema"
    || payload.alertSource === "mwm_community";
}

/** A 2xx Expo response is provider acknowledgement, never device delivery. */
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
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

function eventFingerprint(ownerId: string, eventId: string): string {
  return createHash("sha256").update(`${ownerId}\u0000${eventId}`).digest("hex");
}

function retryAt(attemptCount: number): Date | null {
  if (attemptCount >= MAX_RETRY_ATTEMPTS) return null;
  const minutes = [1, 5, 30][Math.max(0, Math.min(attemptCount, 2))] ?? 30;
  return new Date(Date.now() + minutes * 60_000);
}

export function trustedSafetyInAppNotification(
  shareId: string,
  alertType: TrustedSafetyAlertPayload["alertType"],
  locationCity: string,
  locationRegion: string,
  title: string,
  body: string,
  deliveryId?: string,
) {
  return {
    type: "safety",
    title,
    body,
    data: {
      type: "trusted_safety_alert",
      alertType,
      locationCity,
      locationRegion,
      shareId,
      ...(deliveryId ? { safetyAlertDeliveryId: deliveryId } : {}),
    },
  };
}

type EligibleTrustedSafetyShare = {
  id: string;
  contact_type: "mwm_user" | "phone" | "email";
  contact_user_id: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  push_enabled: boolean;
  topics_text: string | null;
};

type DeliveryAudit = {
  id: string;
  delivery_status: TrustedSafetyDeliveryStatus;
  attempt_count: number;
  in_app_notification_id: string | null;
};

type DeliveryAttempt = {
  method: "in_app" | "in_app+push" | "push" | "sms" | "email" | "none";
  status: TrustedSafetyDeliveryStatus;
  errorMessage: string | null;
  inAppNotificationId: string | null;
  retryable: boolean;
};

async function beginDeliveryAudit(
  shareId: string,
  payload: TrustedSafetyAlertPayload,
  notificationBody: string,
): Promise<DeliveryAudit | null> {
  try {
    const result = await pool.query<DeliveryAudit>(
      `INSERT INTO trusted_safety_alert_log
         (id, share_id, owner_id, event_fingerprint, alert_type, alert_source,
          alert_title, alert_body, location_city, location_region,
          contact_delivery_method, delivery_status, error_message, attempt_count,
          next_retry_at, created_at, updated_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,'none','pending',NULL,0,NOW(),NOW(),NOW())
       ON CONFLICT (event_fingerprint, share_id) WHERE event_fingerprint IS NOT NULL
       DO UPDATE SET updated_at = trusted_safety_alert_log.updated_at
       RETURNING id, delivery_status, attempt_count, in_app_notification_id`,
      [
        shareId, payload.ownerId, eventFingerprint(payload.ownerId, payload.eventId),
        payload.alertType, payload.alertSource ?? "mwm_community", payload.alertTitle,
        notificationBody, payload.locationCity, payload.locationRegion,
      ],
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

async function finishDeliveryAudit(
  audit: DeliveryAudit,
  attempt: DeliveryAttempt,
): Promise<boolean> {
  try {
    const nextRetry = attempt.retryable ? retryAt(audit.attempt_count) : null;
    const finalStatus: TrustedSafetyDeliveryStatus = attempt.retryable && nextRetry
      ? "retry_scheduled"
      : attempt.status;
    const result = await pool.query<{ id: string }>(
      `UPDATE trusted_safety_alert_log
          SET contact_delivery_method = $1,
              delivery_status = $2,
              error_message = $3,
              in_app_notification_id = COALESCE(in_app_notification_id, $4),
              attempt_count = attempt_count + 1,
              attempted_at = NOW(),
              next_retry_at = $5,
              updated_at = NOW()
        WHERE id = $6
        RETURNING id`,
      [attempt.method, finalStatus, attempt.errorMessage, attempt.inAppNotificationId, nextRetry, audit.id],
    );
    return Boolean(result.rows[0]);
  } catch {
    return false;
  }
}

async function deliverToMwmContact(
  share: EligibleTrustedSafetyShare,
  payload: Pick<TrustedSafetyAlertPayload, "alertType" | "locationCity" | "locationRegion">,
  title: string,
  body: string,
  audit: DeliveryAudit,
): Promise<DeliveryAttempt> {
  if (!share.contact_user_id) {
    return { method: "none", status: "failed", errorMessage: "Eligible app contact was unavailable", inAppNotificationId: null, retryable: false };
  }
  let notificationId = audit.in_app_notification_id;
  try {
    if (!notificationId) {
      const inApp = trustedSafetyInAppNotification(
        share.id, payload.alertType, payload.locationCity, payload.locationRegion,
        title, body, audit.id,
      );
      const inserted = await pool.query<{ id: string }>(
        `INSERT INTO notifications (id, user_id, type, title, body, data, read, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, false, NOW())
         RETURNING id`,
        [share.contact_user_id, inApp.type, inApp.title, inApp.body, JSON.stringify(inApp.data)],
      );
      notificationId = inserted.rows[0]?.id ?? null;
    }
    if (!notificationId) {
      return { method: "in_app", status: "failed", errorMessage: "In-app notification record was not created", inAppNotificationId: null, retryable: true };
    }
    if (!share.push_enabled) {
      return { method: "in_app", status: "in_app_created", errorMessage: null, inAppNotificationId: notificationId, retryable: false };
    }
    const tokenResult = await pool.query<{ token: string }>(
      `SELECT token FROM push_tokens WHERE user_id = $1 AND active = true ORDER BY updated_at DESC NULLS LAST LIMIT 1`,
      [share.contact_user_id],
    );
    const token = tokenResult.rows[0]?.token;
    if (!token) {
      return { method: "in_app", status: "in_app_created", errorMessage: null, inAppNotificationId: notificationId, retryable: false };
    }
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token, title, body,
        data: { type: "trusted_safety_alert", alertType: payload.alertType, locationCity: payload.locationCity, locationRegion: payload.locationRegion, deliveryId: audit.id },
        sound: "default", priority: "high",
      }),
    });
    const pushState = await expoPushRequestState(response);
    if (pushState === "provider_accepted") {
      return { method: "in_app+push", status: "provider_accepted", errorMessage: null, inAppNotificationId: notificationId, retryable: false };
    }
    const retryable = "status" in response && typeof response.status === "number" && response.status >= 500;
    return {
      method: "in_app+push",
      status: "in_app_created",
      errorMessage: retryable ? "Push provider was temporarily unavailable; durable in-app alert created" : "Push provider rejected the request; durable in-app alert created",
      inAppNotificationId: notificationId,
      retryable,
    };
  } catch {
    return {
      method: "in_app+push", status: "in_app_created",
      errorMessage: "Push request failed; durable in-app alert created",
      inAppNotificationId: notificationId, retryable: true,
    };
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
      if (!sid || !token || !from) return { method: "sms", status: "not_configured", errorMessage: "SMS provider is not configured", inAppNotificationId: null, retryable: false };
      const { default: twilio } = await import("twilio");
      const message = await twilio(sid, token).messages.create({ from, to: share.contact_phone, body: `MWM Safety Alert — ${body}` });
      return message.sid
        ? { method: "sms", status: "provider_accepted", errorMessage: null, inAppNotificationId: null, retryable: false }
        : { method: "sms", status: "provider_rejected", errorMessage: "SMS provider did not acknowledge the request", inAppNotificationId: null, retryable: false };
    }
    if (share.contact_type === "email" && share.contact_email) {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) return { method: "email", status: "not_configured", errorMessage: "Email provider is not configured", inAppNotificationId: null, retryable: false };
      const { Resend } = await import("resend");
      const response = await new Resend(resendKey).emails.send({
        from: "Mapping With Melanin <safety@mappingwithmelanin.com>", to: share.contact_email,
        subject: `Safety Alert — ${ownerFirstName} in ${location}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px"><h2>Safety Alert</h2><p>${escapeHtml(body)}</p><hr/><p>You received this because ${escapeHtml(ownerFirstName)} added you as a trusted safety contact on Mapping With Melanin.</p></div>`,
      });
      return response.error || !response.data?.id
        ? { method: "email", status: "provider_rejected", errorMessage: "Email provider rejected the request", inAppNotificationId: null, retryable: false }
        : { method: "email", status: "provider_accepted", errorMessage: null, inAppNotificationId: null, retryable: false };
    }
    return { method: "none", status: "failed", errorMessage: "Eligible contact had no configured delivery address", inAppNotificationId: null, retryable: false };
  } catch {
    // Do not persist provider errors: they may echo a recipient address or token.
    return { method: share.contact_type === "phone" ? "sms" : "email", status: "failed", errorMessage: "Provider request failed", inAppNotificationId: null, retryable: true };
  }
}

function countAttempt(result: TrustedSafetyDispatchResult, attempt: DeliveryAttempt) {
  if (attempt.status === "in_app_created") result.inAppCreated += 1;
  if (attempt.status === "provider_accepted") result.providerAccepted += 1;
  if (attempt.status === "provider_rejected") result.providerRejected += 1;
  if (attempt.status === "not_configured") result.notConfigured += 1;
  if (attempt.retryable) result.retryScheduled += 1;
  if (attempt.status === "failed" && !attempt.retryable) result.failed += 1;
}

function isTerminalAudit(status: TrustedSafetyDeliveryStatus): boolean {
  return ["in_app_created", "provider_accepted", "provider_rejected", "not_configured", "acknowledged", "failed"].includes(status);
}

async function dispatchEligibleShare(
  share: EligibleTrustedSafetyShare,
  payload: TrustedSafetyAlertPayload,
  title: string,
  body: string,
  result: TrustedSafetyDispatchResult,
): Promise<void> {
  const audit = await beginDeliveryAudit(share.id, payload, body);
  if (!audit) { result.auditFailures += 1; return; }
  if (isTerminalAudit(audit.delivery_status) || audit.delivery_status === "retry_scheduled") {
    result.duplicateEvents += 1;
    return;
  }
  const location = `${payload.locationCity.trim()}, ${payload.locationRegion.trim()}`;
  const attempt = share.contact_type === "mwm_user"
    ? await deliverToMwmContact(share, payload, title, body, audit)
    : await deliverToExternalContact(share, payload.ownerFirstName.trim(), location, body);
  countAttempt(result, attempt);
  if (!await finishDeliveryAudit(audit, attempt)) result.auditFailures += 1;
}

/**
 * Mirrors a verified severe alert to currently eligible, opted-in contacts.
 * This creates no public alert and does not make any decision about delivery to
 * a physical device; provider acceptance is explicitly not device delivery.
 */
export async function notifyTrustedSafetyContacts(payload: TrustedSafetyAlertPayload): Promise<TrustedSafetyDispatchResult> {
  if (!isTrustedSafetyAlertPayload(payload)) return emptyDispatchResult(true);
  const result = emptyDispatchResult();
  try {
    // Coordinate expiry is a separate cleanup; it never changes alert consent.
    await expireTrustedLocationSessions(payload.ownerId);
    const ownerResult = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE id = $1
        AND COALESCE(lower(approved::text) IN ('true', 't', '1'), false)
        AND COALESCE(account_status, 'active') = 'active'`,
      [payload.ownerId],
    );
    if (!ownerResult.rows[0]) return emptyDispatchResult(true);
    const sharesResult = await pool.query<EligibleTrustedSafetyShare>(
      `SELECT tss.id, tss.contact_type, tss.contact_user_id, tss.contact_phone, tss.contact_email,
              COALESCE(np.push_enabled, false) AS push_enabled, np.topics::text AS topics_text
         FROM trusted_safety_shares tss
         LEFT JOIN users contact ON contact.id = tss.contact_user_id
         LEFT JOIN notification_preferences np ON np.user_id = contact.id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = contact.id
         LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = tss.owner_id
        WHERE tss.owner_id = $1
          AND tss.status = 'active'
          AND tss.owner_enabled = true
          AND tss.contact_accepted = true
          AND ((tss.contact_type = 'mwm_user' AND tss.contact_user_id IS NOT NULL
                AND COALESCE(lower(contact.approved::text) IN ('true', 't', '1'), false)
                AND COALESCE(contact.account_status, 'active') = 'active'
                AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL)
            OR (tss.contact_type = 'phone' AND tss.contact_phone IS NOT NULL)
            OR (tss.contact_type = 'email' AND tss.contact_email IS NOT NULL))`,
      [payload.ownerId],
    );
    const eligibleShares = sharesResult.rows.filter((share) =>
      share.contact_type !== "mwm_user" || allowsSafetyCheckinNotification(share.topics_text),
    );
    result.eligibleContacts = eligibleShares.length;
    if (eligibleShares.length === 0) return result;
    const location = `${payload.locationCity.trim()}, ${payload.locationRegion.trim()}`;
    const title = `Safety Alert — ${payload.ownerFirstName.trim()}`;
    const body = `${payload.ownerFirstName.trim()} is currently in ${location}. ${payload.alertTitle.trim()}: ${payload.alertDescription.trim()} This alert was also sent to them. No action is required unless you hear otherwise.`;
    for (const share of eligibleShares) await dispatchEligibleShare(share, payload, title, body, result);
    logger.info({ eligibleContacts: result.eligibleContacts, alertType: payload.alertType }, "Trusted safety alert dispatch attempts completed");
    return result;
  } catch {
    logger.error({ alertType: payload.alertType }, "Trusted safety alert dispatch stopped safely");
    return { ...result, failed: result.failed + 1 };
  }
}

/**
 * Bounded recovery worker. It only retries a previously persisted, authorized
 * event/recipient pair and never recreates a durable in-app notification.
 */
export async function retryTrustedSafetyAlertDeliveries(limit = 50): Promise<{ attempted: number; completed: number }> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || 1, 100));
  const rows = await pool.query<{
    id: string; share_id: string; owner_id: string; alert_type: TrustedSafetyAlertPayload["alertType"];
    alert_title: string; alert_body: string; location_city: string; location_region: string;
    attempt_count: number; in_app_notification_id: string | null; contact_type: EligibleTrustedSafetyShare["contact_type"];
    contact_user_id: string | null; contact_phone: string | null; contact_email: string | null;
    push_enabled: boolean; topics_text: string | null; owner_first_name: string | null;
  }>(
    `SELECT log.id, log.share_id, log.owner_id, log.alert_type, log.alert_title, log.alert_body,
            log.location_city, log.location_region, log.attempt_count, log.in_app_notification_id,
            tss.contact_type, tss.contact_user_id, tss.contact_phone, tss.contact_email,
            COALESCE(np.push_enabled, false) AS push_enabled, np.topics::text AS topics_text,
            owner.first_name AS owner_first_name
       FROM trusted_safety_alert_log log
       JOIN trusted_safety_shares tss ON tss.id = log.share_id
       JOIN users owner ON owner.id = log.owner_id
       LEFT JOIN users contact ON contact.id = tss.contact_user_id
       LEFT JOIN notification_preferences np ON np.user_id = contact.id
       LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = contact.id
       LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = contact.id AND contact_blocks.blocked_id = tss.owner_id
      WHERE log.delivery_status = 'retry_scheduled'
        AND log.next_retry_at <= NOW()
        AND log.attempt_count < $1
        AND tss.status = 'active' AND tss.owner_enabled = true AND tss.contact_accepted = true
        AND ((tss.contact_type = 'mwm_user' AND tss.contact_user_id IS NOT NULL
              AND COALESCE(lower(contact.approved::text) IN ('true', 't', '1'), false)
              AND COALESCE(contact.account_status, 'active') = 'active'
              AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL)
          OR (tss.contact_type = 'phone' AND tss.contact_phone IS NOT NULL)
          OR (tss.contact_type = 'email' AND tss.contact_email IS NOT NULL))
      ORDER BY log.next_retry_at ASC
      LIMIT $2`,
    [MAX_RETRY_ATTEMPTS, safeLimit],
  );
  let completed = 0;
  for (const row of rows.rows) {
    const share: EligibleTrustedSafetyShare = {
      id: row.share_id, contact_type: row.contact_type, contact_user_id: row.contact_user_id,
      contact_phone: row.contact_phone, contact_email: row.contact_email,
      push_enabled: row.push_enabled, topics_text: row.topics_text,
    };
    if (share.contact_type === "mwm_user" && !allowsSafetyCheckinNotification(share.topics_text)) continue;
    const audit: DeliveryAudit = { id: row.id, delivery_status: "retry_scheduled", attempt_count: Number(row.attempt_count), in_app_notification_id: row.in_app_notification_id };
    const attempt = share.contact_type === "mwm_user"
      ? await deliverToMwmContact(share, { alertType: row.alert_type, locationCity: row.location_city, locationRegion: row.location_region }, row.alert_title, row.alert_body, audit)
      : await deliverToExternalContact(share, row.owner_first_name?.trim() || "A Mapping With Melanin member", `${row.location_city}, ${row.location_region}`, row.alert_body);
    if (await finishDeliveryAudit(audit, attempt)) completed += 1;
  }
  return { attempted: rows.rows.length, completed };
}

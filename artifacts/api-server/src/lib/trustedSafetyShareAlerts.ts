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

/**
 * Mirror a safety alert to all active trusted contacts of the given user.
 * Safe to call on every alert — the function applies all filtering internally.
 */
export async function notifyTrustedSafetyContacts(
  payload: TrustedSafetyAlertPayload
): Promise<void> {
  const {
    ownerId,
    ownerFirstName,
    locationCity,
    locationRegion,
    alertTitle,
    alertDescription,
    alertType,
    alertSource = "mwm_community",
  } = payload;

  // Only mirror truly severe alerts.
  if (!SEVERE_TYPES.includes(alertType)) {
    logger.debug({ alertType }, "Skipping non-severe alert for trusted-share");
    return;
  }

  try {
    // Auto-pause check: if owner's home city matches the alert city, they're home.
    const ownerResult = await pool.query<{ home_city: string | null }>(
      `SELECT home_city FROM users WHERE id = $1`,
      [ownerId]
    );
    const homeCity = ownerResult.rows[0]?.home_city?.toLowerCase().trim() ?? "";
    const alertCity = locationCity.toLowerCase().trim();
    if (homeCity && alertCity && homeCity === alertCity) {
      logger.info({ ownerId, homeCity, alertCity }, "Trusted-share skipped — owner is home");
      // Auto-pause all their shares
      await pool.query(
        `UPDATE trusted_safety_shares
         SET status = 'paused_home', updated_at = NOW()
         WHERE owner_id = $1 AND status = 'active'`,
        [ownerId]
      );
      return;
    }

    // Fetch all active trusted shares for this owner.
    const sharesResult = await pool.query(
      `SELECT * FROM trusted_safety_shares
       WHERE owner_id = $1
         AND status = 'active'
         AND owner_enabled = true
         AND contact_accepted = true`,
      [ownerId]
    );

    if (sharesResult.rows.length === 0) return;

    const location = locationRegion
      ? `${locationCity}, ${locationRegion}`
      : locationCity;

    const notifTitle = `Safety Alert — ${ownerFirstName}`;
    const notifBody = `${ownerFirstName} is currently in ${location}. ${alertTitle} has been issued for that area. This alert was also sent to them. No action is required unless you hear otherwise.`;

    for (const share of sharesResult.rows) {
      let deliveryMethod = "none";
      let deliveryStatus = "failed";
      let errorMessage: string | null = null;

      try {
        if (share.contact_type === "mwm_user" && share.contact_user_id) {
          // ── Push notification (Expo) ──────────────────────────────────────
          const tokenResult = await pool.query<{ token: string }>(
            `SELECT token FROM push_tokens WHERE user_id = $1 LIMIT 1`,
            [share.contact_user_id]
          );
          const pushToken = tokenResult.rows[0]?.token;
          if (pushToken) {
            const resp = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: pushToken,
                title: notifTitle,
                body: notifBody,
                data: {
                  type: "trusted_safety_alert",
                  alertType,
                  locationCity,
                  locationRegion,
                },
                sound: "default",
                priority: "high",
              }),
            });
            deliveryMethod = "push";
            deliveryStatus = resp.ok ? "sent" : "failed";
            if (!resp.ok) errorMessage = `Expo push HTTP ${resp.status}`;

          } else {
            deliveryMethod = "in_app";
            deliveryStatus = "sent";
            errorMessage = "Push unavailable; delivered to in-app notification center";
          }
          // Persist every MWM alert. This is the reliable fallback when push is
          // unavailable or Expo rejects a send; it exposes only the safety-safe
          // city/region payload described above.
          const inApp = trustedSafetyInAppNotification(
            share.id, alertType, locationCity, locationRegion, notifTitle, notifBody,
          );
          await pool.query(
            `INSERT INTO notifications (id, user_id, type, title, body, data, read, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, false, NOW())
             ON CONFLICT DO NOTHING`,
            [share.contact_user_id, inApp.type, inApp.title, inApp.body, JSON.stringify(inApp.data)]
          );
          if (deliveryStatus === "failed") {
            deliveryMethod = "in_app";
            deliveryStatus = "sent";
            errorMessage = `${errorMessage ?? "Push delivery failed"}; delivered to in-app notification center`;
          }
        } else if (share.contact_type === "phone" && share.contact_phone) {
          // ── SMS via Twilio ────────────────────────────────────────────────
          const sid = process.env.TWILIO_ACCOUNT_SID;
          const token = process.env.TWILIO_AUTH_TOKEN;
          const from = process.env.TWILIO_FROM_NUMBER;
          if (sid && token && from) {
            const { default: twilio } = await import("twilio");
            const client = twilio(sid, token);
            await client.messages.create({
              from,
              to: share.contact_phone,
              body: `MWM Safety Alert — ${notifBody}`,
            });
            deliveryMethod = "sms";
            deliveryStatus = "sent";
          } else {
            deliveryMethod = "sms";
            deliveryStatus = "failed";
            errorMessage = "Twilio credentials not configured";
          }
        } else if (share.contact_type === "email" && share.contact_email) {
          // ── Email via Resend ──────────────────────────────────────────────
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);
            const { error } = await resend.emails.send({
              from: "Mapping With Melanin <safety@mappingwithmelanin.com>",
              to: share.contact_email,
              subject: `Safety Alert — ${ownerFirstName} in ${location}`,
              html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
                  <h2 style="color:#1a1a1a;margin-bottom:8px">Safety Alert</h2>
                  <p style="color:#333;font-size:16px;line-height:1.6">${notifBody}</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="color:#999;font-size:13px">
                    You received this because ${ownerFirstName} added you as a trusted safety contact
                    on Mapping With Melanin. They can manage this at any time in their Safety settings.
                  </p>
                </div>
              `,
            });
            deliveryMethod = "email";
            deliveryStatus = error ? "failed" : "sent";
            if (error) errorMessage = `${error.name}: ${error.message}`;
          } else {
            deliveryMethod = "email";
            deliveryStatus = "failed";
            errorMessage = "RESEND_API_KEY not configured";
          }
        }
      } catch (deliveryErr: unknown) {
        errorMessage = deliveryErr instanceof Error ? deliveryErr.message : String(deliveryErr);
        logger.warn({ shareId: share.id, deliveryErr }, "Trusted-share delivery failed");
      }

      // Log every delivery attempt.
      try {
        await pool.query(
          `INSERT INTO trusted_safety_alert_log
             (id, share_id, owner_id, alert_type, alert_source, alert_title,
              alert_body, location_city, location_region,
              contact_delivery_method, delivery_status, error_message, created_at)
           VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
          [
            share.id, ownerId, alertType, alertSource,
            alertTitle, notifBody,
            locationCity, locationRegion,
            deliveryMethod, deliveryStatus, errorMessage,
          ]
        );
      } catch (logErr) {
        logger.warn({ logErr }, "Failed to write trusted_safety_alert_log");
      }
    }

    logger.info(
      { ownerId, contactCount: sharesResult.rows.length, alertType },
      "Trusted safety share alerts dispatched"
    );
  } catch (err) {
    // Never crash the caller — trusted-share delivery is best-effort.
    logger.error({ err, ownerId }, "notifyTrustedSafetyContacts failed");
  }
}

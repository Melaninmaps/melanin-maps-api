import { pool } from "@workspace/db";
import { sendPushToUser } from "../lib/pushNotifications";
import { logger } from "../lib/logger";

export type OfficialAlertKind = "product_recall" | "public_health_alert";
export type OfficialAlertSource = "fda" | "cpsc" | "cdc";

export type OfficialPublicAlertInput = Readonly<{
  source: OfficialAlertSource;
  externalId: string;
  kind: OfficialAlertKind;
  title: string;
  summary: string;
  officialUrl: string;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  sourcePayload?: Record<string, unknown>;
}>;

export type OfficialPublicAlert = Readonly<{
  id: string;
  source: OfficialAlertSource;
  kind: OfficialAlertKind;
  title: string;
  summary: string;
  officialUrl: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
}>;

const OFFICIAL_HOSTS: Record<OfficialAlertSource, readonly string[]> = {
  fda: ["fda.gov", "www.fda.gov", "api.fda.gov", "open.fda.gov"],
  cpsc: ["cpsc.gov", "www.cpsc.gov"],
  cdc: ["cdc.gov", "www.cdc.gov", "emergency.cdc.gov"],
};

function boundedText(value: string, maximum: number, label: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) {
    throw new Error(`${label} must be between 1 and ${maximum} characters.`);
  }
  return normalized;
}

function trustedOfficialUrl(source: OfficialAlertSource, value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || !OFFICIAL_HOSTS[source].includes(url.hostname.toLowerCase())) {
    throw new Error("Official alerts must link to the matching government source.");
  }
  return url.toString();
}

function toAlert(row: Record<string, unknown>): OfficialPublicAlert {
  return {
    id: String(row.id),
    source: row.source as OfficialAlertSource,
    kind: row.alert_kind as OfficialAlertKind,
    title: String(row.title),
    summary: String(row.summary),
    officialUrl: String(row.official_url),
    issuedAt: row.issued_at instanceof Date ? row.issued_at : null,
    expiresAt: row.expires_at instanceof Date ? row.expires_at : null,
  };
}

export async function upsertOfficialPublicAlert(input: OfficialPublicAlertInput): Promise<OfficialPublicAlert> {
  const source = input.source;
  const externalId = boundedText(input.externalId, 160, "externalId");
  const title = boundedText(input.title, 500, "title");
  const summary = boundedText(input.summary, 1200, "summary");
  const officialUrl = trustedOfficialUrl(source, input.officialUrl);

  const result = await pool.query(
    `INSERT INTO official_public_alerts
      (source, external_id, alert_kind, title, summary, official_url, issued_at, expires_at, source_payload, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())
     ON CONFLICT (source, external_id) DO UPDATE SET
       alert_kind = EXCLUDED.alert_kind,
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       official_url = EXCLUDED.official_url,
       issued_at = EXCLUDED.issued_at,
       expires_at = EXCLUDED.expires_at,
       source_payload = EXCLUDED.source_payload,
       updated_at = NOW()
     RETURNING id, source, alert_kind, title, summary, official_url, issued_at, expires_at`,
    [
      source,
      externalId,
      input.kind,
      title,
      summary,
      officialUrl,
      input.issuedAt ?? null,
      input.expiresAt ?? null,
      JSON.stringify(input.sourcePayload ?? {}),
    ],
  );
  return toAlert(result.rows[0] as Record<string, unknown>);
}

/**
 * Delivers only once per user per alert. Consent is evaluated immediately before
 * each new delivery; a missing preference remains opt-out for both alert types.
 */
export async function deliverOfficialPublicAlert(alert: OfficialPublicAlert): Promise<{ delivered: number; pushed: number }> {
  const preferenceColumn = alert.kind === "product_recall"
    ? "notif_product_recalls"
    : "notif_public_health_alerts";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const deliveries = await client.query<{ user_id: string }>(
      `WITH eligible AS (
         SELECT us.user_id
           FROM user_settings us
           JOIN users u ON u.id = us.user_id
          WHERE COALESCE(u.approved, false) = true
            AND us.${preferenceColumn} = true
       ), claimed AS (
         INSERT INTO official_public_alert_deliveries (alert_id, user_id)
         SELECT $1::uuid, eligible.user_id FROM eligible
         ON CONFLICT (alert_id, user_id) DO NOTHING
         RETURNING user_id
       ), notification_rows AS (
         INSERT INTO notifications (user_id, type, title, body, entity_id, entity_type, data)
         SELECT user_id, 'system', $2, $3, $1::text, 'official_public_alert', $4::jsonb
           FROM claimed
         RETURNING id, user_id
       )
       UPDATE official_public_alert_deliveries delivery
          SET notification_id = notification_rows.id
         FROM notification_rows
        WHERE delivery.alert_id = $1::uuid
          AND delivery.user_id = notification_rows.user_id
       RETURNING delivery.user_id`,
      [
        alert.id,
        alert.title,
        alert.summary,
        JSON.stringify({
          type: alert.kind,
          officialAlertId: alert.id,
          source: alert.source,
          officialUrl: alert.officialUrl,
          issuedAt: alert.issuedAt?.toISOString() ?? null,
          disclaimer: "Official source notice only; not medical advice.",
        }),
      ],
    );
    await client.query("COMMIT");

    let pushed = 0;
    for (const row of deliveries.rows) {
      try {
        await sendPushToUser(row.user_id, {
          title: alert.title,
          body: alert.summary,
          data: {
            screen: "notifications",
            officialAlertId: alert.id,
            officialUrl: alert.officialUrl,
            type: alert.kind,
          },
        });
        pushed += 1;
      } catch (error) {
        logger.warn({ error, alertId: alert.id, userId: row.user_id }, "Official alert push failed after in-app delivery");
      }
    }
    return { delivered: deliveries.rowCount ?? 0, pushed };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listRecentOfficialPublicAlerts(limit = 30): Promise<OfficialPublicAlert[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const result = await pool.query(
    `SELECT id, source, alert_kind, title, summary, official_url, issued_at, expires_at
       FROM official_public_alerts
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY COALESCE(issued_at, created_at) DESC
      LIMIT $1`,
    [safeLimit],
  );
  return result.rows.map((row) => toAlert(row as Record<string, unknown>));
}

import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { logger } from "../lib/logger";
import { sendPushToBusinessOwnersByCity } from "../lib/pushNotifications";

const INCIDENT_THRESHOLD = 3;
const INCIDENT_WINDOW_DAYS = 7;

const CATEGORY_LABELS: Record<string, string> = {
  safety: "Safety Concern",
  sundown: "Sundown Town Warning",
  discrimination: "Discrimination Incident",
  business: "Business Safety Update",
  resource: "Community Resource",
  positive: "Positive Safety Tip",
  police: "Police / ICE Encounter",
};

export interface ApprovedIncidentInput {
  city: string | null;
  region: string | null;
  category: string;
  area: string | null;
}

export interface IncidentProjection {
  incidentId: string;
  reportCount: number;
  severity: string;
  created: boolean;
  needsNotification: boolean;
}

interface ScopedApprovedIncidentInput {
  city: string;
  region: string;
  category: string;
  area: string | null;
}

export async function projectApprovedIncident(
  client: PoolClient,
  input: ScopedApprovedIncidentInput,
): Promise<IncidentProjection | null> {
  const sinceDate = new Date(Date.now() - INCIDENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const identity = [input.city.trim().toLocaleLowerCase(), input.region.trim().toLocaleLowerCase(), input.category].join("|");
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [identity]);

  const aggregateResult = await client.query<{ count: string; severity: string | null }>(
    `SELECT
       COUNT(*)::text AS count,
       CASE MAX(CASE severity
         WHEN 'critical' THEN 4
         WHEN 'high' THEN 3
         WHEN 'medium' THEN 2
         WHEN 'low' THEN 1
         ELSE 0
       END)
         WHEN 4 THEN 'critical'
         WHEN 3 THEN 'high'
         WHEN 2 THEN 'medium'
         WHEN 1 THEN 'low'
         ELSE NULL
       END AS severity
     FROM safety_reports
     WHERE LOWER(incident_city) = LOWER($1)
       AND LOWER(incident_region) = LOWER($2)
       AND category = $3
       AND status = 'approved'
       AND created_at >= $4`,
    [input.city, input.region, input.category, sinceDate],
  );
  const reportCount = Number.parseInt(aggregateResult.rows[0]?.count ?? "0", 10);
  const severity = aggregateResult.rows[0]?.severity ?? null;

  logger.info(
    { city: input.city, region: input.region, category: input.category, reportCount, threshold: INCIDENT_THRESHOLD },
    "[safety] approved threshold check",
  );

  const existingResult = await client.query<{ id: string; notifications_sent: boolean }>(
    `SELECT id, notifications_sent FROM safety_incidents
     WHERE LOWER(city) = LOWER($1)
       AND LOWER(region) = LOWER($2)
       AND category = $3
       AND status = 'active'
       AND triggered_at >= $4
     LIMIT 1
     FOR UPDATE`,
    [input.city, input.region, input.category, sinceDate],
  );
  const existingIncident = existingResult.rows[0] ?? null;
  const existingId = existingIncident?.id ?? null;

  if (reportCount < INCIDENT_THRESHOLD) {
    if (existingId) {
      await client.query(
        `UPDATE safety_incidents
         SET report_count = $1,
             severity = COALESCE($2, severity),
             status = 'resolved',
             resolved_at = NOW()
         WHERE id = $3`,
        [reportCount, severity, existingId],
      );
    }
    return null;
  }

  const rankedSeverity = severity ?? "medium";
  if (existingId) {
    await client.query(
      `UPDATE safety_incidents
       SET report_count = $1,
           severity = $2,
           resolved_at = NULL
       WHERE id = $3`,
      [reportCount, rankedSeverity, existingId],
    );
    return {
      incidentId: existingId,
      reportCount,
      severity: rankedSeverity,
      created: false,
      needsNotification: !existingIncident?.notifications_sent,
    };
  }

  const insertResult = await client.query<{ id: string }>(
    `INSERT INTO safety_incidents
       (city, region, neighborhood, category, severity, report_count, status, notifications_sent, triggered_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', false, NOW()) RETURNING id`,
    [input.city, input.region, input.area, input.category, rankedSeverity, reportCount],
  );
  const incidentId = insertResult.rows[0]?.id;
  return incidentId
    ? { incidentId, reportCount, severity: rankedSeverity, created: true, needsNotification: true }
    : null;
}

export async function checkApprovedIncidentThreshold(input: ApprovedIncidentInput): Promise<void> {
  // A city without a region is ambiguous (for example Richmond, VA vs Richmond, CA).
  // Historical records without a region remain preserved but cannot create a public alert.
  if (!input.city || !input.region) return;

  const scopedInput = {
    city: input.city,
    region: input.region,
    category: input.category,
    area: input.area,
  };
  const client = await pool.connect();
  let projection: IncidentProjection | null = null;
  try {
    await client.query("BEGIN");
    projection = await projectApprovedIncident(client, scopedInput);
    await client.query("COMMIT");
  } catch (error: unknown) {
    await client.query("ROLLBACK").catch(() => undefined);
    logger.error({ error }, "[safety] approved incident projection failed");
    throw error;
  } finally {
    client.release();
  }

  if (!projection?.needsNotification) return;

  await notifyNewApprovedIncident(input, projection);
}

export async function notifyNewApprovedIncident(
  input: ApprovedIncidentInput,
  projection: IncidentProjection,
): Promise<void> {
  if (!input.city || !input.region || !projection.needsNotification) return;

  const categoryLabel = CATEGORY_LABELS[input.category] ?? input.category;
  const cityRegion = `${input.city}, ${input.region}`;
  const locationLabel = input.area ? `${input.area}, ${cityRegion}` : cityRegion;
  const delivery = await sendPushToBusinessOwnersByCity(input.city, input.region, {
    title: "⚠️ Safety Alert Near Your Business",
    body: `A ${categoryLabel} has been approved in ${locationLabel} based on ${projection.reportCount} community reports. Review your safety status.`,
    data: {
      screen: "safety",
      incidentId: projection.incidentId,
      city: input.city,
      region: input.region,
      category: input.category,
    },
  });
  if (delivery.delivered && delivery.recipientCount > 0) {
    await pool.query("UPDATE safety_incidents SET notifications_sent = true WHERE id = $1", [projection.incidentId]);
  }
}

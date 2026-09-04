import { pool } from "@workspace/db";
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

export async function checkApprovedIncidentThreshold(input: {
  city: string | null;
  category: string;
  severity: string;
  area: string | null;
}): Promise<void> {
  if (!input.city) return;
  try {
    const sinceDate = new Date(Date.now() - INCIDENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM safety_reports
       WHERE incident_city ILIKE $1
         AND category = $2
         AND status = 'approved'
         AND created_at >= $3`,
      [input.city, input.category, sinceDate],
    );
    const reportCount = Number.parseInt(countResult.rows[0]?.count ?? "0", 10);
    logger.info({ city: input.city, category: input.category, reportCount, threshold: INCIDENT_THRESHOLD }, "[safety] approved threshold check");
    if (reportCount < INCIDENT_THRESHOLD) return;

    const existingResult = await pool.query<{ id: string }>(
      `SELECT id FROM safety_incidents
       WHERE city ILIKE $1 AND category = $2 AND status = 'active' AND triggered_at >= $3
       LIMIT 1`,
      [input.city, input.category, sinceDate],
    );

    if (existingResult.rows.length > 0) {
      const incidentId = existingResult.rows[0]?.id;
      if (!incidentId) return;
      await pool.query(
        `UPDATE safety_incidents SET report_count = $1, severity = $2 WHERE id = $3`,
        [reportCount, input.severity, incidentId],
      );
      return;
    }

    const insertResult = await pool.query<{ id: string }>(
      `INSERT INTO safety_incidents (city, neighborhood, category, severity, report_count, status, notifications_sent, triggered_at)
       VALUES ($1, $2, $3, $4, $5, 'active', false, NOW()) RETURNING id`,
      [input.city, input.area, input.category, input.severity, reportCount],
    );
    const incidentId = insertResult.rows[0]?.id;
    if (!incidentId) return;

    const categoryLabel = CATEGORY_LABELS[input.category] ?? input.category;
    const locationLabel = input.area ? `${input.area}, ${input.city}` : input.city;
    const delivery = await sendPushToBusinessOwnersByCity(input.city, {
      title: "⚠️ Safety Alert Near Your Business",
      body: `A ${categoryLabel} has been approved in ${locationLabel} based on ${reportCount} community reports. Review your safety status.`,
      data: { screen: "safety", incidentId, city: input.city, category: input.category },
    });
    if (delivery.delivered && delivery.recipientCount > 0) {
      await pool.query("UPDATE safety_incidents SET notifications_sent = true WHERE id = $1", [incidentId]);
    }
  } catch (error: unknown) {
    logger.error({ error }, "[safety] approved incident check failed");
  }
}

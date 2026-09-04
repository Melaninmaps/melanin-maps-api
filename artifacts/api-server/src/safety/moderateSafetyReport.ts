import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import {
  notifyNewApprovedIncident,
  projectApprovedIncident,
  type ApprovedIncidentInput,
  type IncidentProjection,
} from "./approvedIncidentAlerts";
import { updateBusinessSafetyRating } from "./businessSafetyRating";
import { reportMustBeAnonymous } from "./reportContract";
import { invalidateProximityWarningCache } from "./proximityWarningCache";
import { logger } from "../lib/logger";

export type SafetyReportModerationStatus = "pending" | "approved" | "rejected";

export interface ModeratedSafetyReport {
  id: string;
  category: string;
  status: string;
  targetType: string;
  targetId: string | null;
  incidentCity: string | null;
  incidentRegion: string | null;
  incidentArea: string | null;
  severity: string;
  moderatorNotes: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

interface ModerationResult {
  report: ModeratedSafetyReport;
  incidentInput: ApprovedIncidentInput | null;
  incidentProjection: IncidentProjection | null;
}

async function updateReport(
  client: PoolClient,
  input: {
    id: string;
    status: SafetyReportModerationStatus;
    moderatorNotes: string | null;
    reviewedBy: string;
  },
): Promise<ModeratedSafetyReport | null> {
  const result = await client.query<{
    id: string;
    category: string;
    status: string;
    target_type: string;
    target_id: string | null;
    incident_city: string | null;
    incident_region: string | null;
    incident_area: string | null;
    severity: string;
    moderator_notes: string | null;
    reviewed_at: Date | null;
    reviewed_by: string | null;
  }>(
    `UPDATE safety_reports
     SET status = $1,
         moderator_notes = $2,
         reviewed_at = NOW(),
         reviewed_by = $3
     WHERE id = $4
     RETURNING id, category, status, target_type, target_id,
               incident_city, incident_region, incident_area, severity,
               moderator_notes, reviewed_at, reviewed_by`,
    [input.status, input.moderatorNotes, input.reviewedBy, input.id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    status: row.status,
    targetType: row.target_type,
    targetId: row.target_id,
    incidentCity: row.incident_city,
    incidentRegion: row.incident_region,
    incidentArea: row.incident_area,
    severity: row.severity,
    moderatorNotes: row.moderator_notes,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
  };
}

export async function moderateSafetyReport(input: {
  id: string;
  status: SafetyReportModerationStatus;
  moderatorNotes?: string;
  reviewedBy: string;
}): Promise<ModerationResult | null> {
  const client = await pool.connect();
  let result: ModerationResult | null = null;
  try {
    await client.query("BEGIN");
    const report = await updateReport(client, {
      id: input.id,
      status: input.status,
      moderatorNotes: input.moderatorNotes ?? null,
      reviewedBy: input.reviewedBy,
    });
    if (!report) {
      await client.query("ROLLBACK");
      return null;
    }

    if (report.targetType === "business" && report.targetId) {
      await updateBusinessSafetyRating(report.targetId, client);
    }

    const incidentInput: ApprovedIncidentInput | null = report.incidentCity && report.incidentRegion
      ? {
          city: report.incidentCity,
          region: report.incidentRegion,
          category: report.category,
          area: reportMustBeAnonymous(report.category) ? null : report.incidentArea,
        }
      : null;
    const incidentProjection = incidentInput
      ? await projectApprovedIncident(client, {
          city: incidentInput.city as string,
          region: incidentInput.region as string,
          category: incidentInput.category,
          area: incidentInput.area,
        })
      : null;

    await client.query("COMMIT");
    invalidateProximityWarningCache();
    result = { report, incidentInput, incidentProjection };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  // Push delivery happens after commit. notifications_sent remains false until
  // Expo accepts a delivery, so any later moderation refresh safely retries.
  if (result.incidentInput && result.incidentProjection?.needsNotification) {
    try {
      await notifyNewApprovedIncident(result.incidentInput, result.incidentProjection);
    } catch (error) {
      logger.warn({ error, incidentId: result.incidentProjection.incidentId }, "[safety] post-commit incident notification deferred");
    }
  }
  return result;
}

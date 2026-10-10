import { pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { updateBusinessSafetyRating } from "./businessSafetyRating";
import { projectApprovedIncident } from "./approvedIncidentAlerts";
import { invalidateProximityWarningCache } from "./proximityWarningCache";

/**
 * Reconciles **display projections only** after Safety Hub lifecycle controls
 * have taken effect. It never deletes source reports or alerts, overwrites
 * withdrawal/correction audit fields, or sends a new notification.
 *
 * Expiration is represented by the already-recorded display/alert expiry
 * timestamp. Corrections are made non-current until a separate governed review
 * explicitly establishes a new display window. Withdrawals are already
 * non-current at write time; this runner removes their dependent projections.
 */
export interface SafetyHubLifecycleRunResult {
  expiredReportDisplaysObserved: number;
  correctedReportDisplaysDeactivated: number;
  expiredCommunityAlertsDeactivated: number;
  correctedCommunityAlertsDeactivated: number;
  businessRatingsReconciled: number;
  staleIncidentsResolved: number;
  activeIncidentsReconciled: number;
  displayCachesInvalidated: boolean;
}

type LifecycleClient = PoolClient;
type LifecycleDatabase = Pick<typeof pool, "connect">;

interface ActiveIncidentProjection {
  city: string;
  region: string;
  category: string;
  neighborhood: string | null;
}

function policeEncounterType(category: string): string | null {
  const match = /^police:(.+)$/.exec(category);
  return match?.[1] ?? null;
}

function countRows(result: { rowCount?: number | null; rows: unknown[] }): number {
  return result.rowCount ?? result.rows.length;
}

/**
 * Runs one transaction so cached/public projections are invalidated only after
 * their durable state has committed. The database dependency is injectable to
 * keep lifecycle behavior testable without a deployment database.
 */
export async function runSafetyHubLifecycleReconciliation(input: {
  database?: LifecycleDatabase;
  now?: Date;
} = {}): Promise<SafetyHubLifecycleRunResult> {
  const database = input.database ?? pool;
  const now = input.now ?? new Date();
  const client: LifecycleClient = await database.connect();
  let result: SafetyHubLifecycleRunResult;

  try {
    await client.query("BEGIN");

    // An elapsed display window is durable audit evidence, not a deletion cue.
    const expiredReports = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM safety_reports
       WHERE status = 'approved'
         AND withdrawn_at IS NULL
         AND display_expires_at <= $1`,
      [now],
    );

    // A correction must no longer be a current display projection. Keep the
    // original report and all correction fields; only end its display window.
    const correctedReports = await client.query<{ id: string }>(
      `UPDATE safety_reports
       SET display_expires_at = $1
       WHERE status = 'approved'
         AND withdrawn_at IS NULL
         AND corrected_at IS NOT NULL
         AND (display_expires_at IS NULL OR display_expires_at > $1)
       RETURNING id`,
      [now],
    );

    // Community alerts retain their original report, expiry, reporter, and any
    // audit fields. is_active is a current-display projection only.
    const expiredCommunityAlerts = await client.query<{ id: string }>(
      `UPDATE community_alerts
       SET is_active = false
       WHERE is_active = true
         AND expires_at <= $1
       RETURNING id`,
      [now],
    );
    const correctedCommunityAlerts = await client.query<{ id: string }>(
      `UPDATE community_alerts
       SET is_active = false
       WHERE is_active = true
         AND corrected_at IS NOT NULL
       RETURNING id`,
    );

    // Rebuild business safety-rating projections from their still-current,
    // approved evidence. This includes withdrawn and elapsed display records,
    // which have no lifecycle "processed" flag by design because audit rows
    // must remain immutable and retained.
    const impactedBusinesses = await client.query<{ target_id: string }>(
      `SELECT DISTINCT target_id
       FROM safety_reports
       WHERE target_type = 'business'
         AND target_id IS NOT NULL
         AND status = 'approved'
         AND (
           withdrawn_at IS NOT NULL
           OR corrected_at IS NOT NULL
           OR display_expires_at IS NULL
           OR display_expires_at <= $1
         )`,
      [now],
    );
    for (const business of impactedBusinesses.rows) {
      await updateBusinessSafetyRating(business.target_id, client);
    }

    // Incidents beyond the seven-day display window are retained as resolved
    // records; they are not purged. Current incidents are reconciled below with
    // the same corroborated-evidence predicate used at moderation time.
    const staleIncidents = await client.query<{ id: string }>(
      `UPDATE safety_incidents
       SET status = 'resolved',
           resolved_at = COALESCE(resolved_at, $1)
       WHERE status = 'active'
         AND triggered_at <= $1 - INTERVAL '7 days'
       RETURNING id`,
      [now],
    );
    const activeIncidents = await client.query<ActiveIncidentProjection>(
      `SELECT city, region, category, neighborhood
       FROM safety_incidents
       WHERE status = 'active'
         AND region IS NOT NULL
         AND triggered_at > $1 - INTERVAL '7 days'
       ORDER BY triggered_at ASC`,
      [now],
    );
    for (const incident of activeIncidents.rows) {
      const encounterType = policeEncounterType(incident.category);
      await projectApprovedIncident(client, {
        city: incident.city,
        region: incident.region,
        category: encounterType ? "police" : incident.category,
        encounterType,
        area: encounterType ? null : incident.neighborhood,
      });
    }

    await client.query("COMMIT");
    const expiredReportDisplaysObserved = Number.parseInt(expiredReports.rows[0]?.count ?? "0", 10) || 0;
    const correctedReportDisplaysDeactivated = countRows(correctedReports);
    const expiredCommunityAlertsDeactivated = countRows(expiredCommunityAlerts);
    const correctedCommunityAlertsDeactivated = countRows(correctedCommunityAlerts);
    const businessRatingsReconciled = impactedBusinesses.rows.length;
    const staleIncidentsResolved = countRows(staleIncidents);
    const activeIncidentsReconciled = activeIncidents.rows.length;
    const displayCachesInvalidated = (
      expiredReportDisplaysObserved > 0
      || correctedReportDisplaysDeactivated > 0
      || expiredCommunityAlertsDeactivated > 0
      || correctedCommunityAlertsDeactivated > 0
      || businessRatingsReconciled > 0
      || staleIncidentsResolved > 0
      || activeIncidentsReconciled > 0
    );

    result = {
      expiredReportDisplaysObserved,
      correctedReportDisplaysDeactivated,
      expiredCommunityAlertsDeactivated,
      correctedCommunityAlertsDeactivated,
      businessRatingsReconciled,
      staleIncidentsResolved,
      activeIncidentsReconciled,
      displayCachesInvalidated,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  if (result.displayCachesInvalidated) {
    invalidateProximityWarningCache("report_lifecycle_changed");
  }
  return result;
}

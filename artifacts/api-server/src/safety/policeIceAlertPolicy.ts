import {
  normalizePoliceEncounterType,
  type IncidentLocation,
  type PoliceEncounterType,
} from "./reportContract";

/**
 * Police/ICE reports are observations, never verified threats at intake.
 * A member must affirm this versioned notice for every submission.
 */
export const POLICE_ICE_REPORTING_CONSENT_VERSION = "police-ice-p0-v1";
export const POLICE_ICE_CORROBORATION_THRESHOLD = 3;
export const POLICE_ICE_ALERT_TTL_MS = 2 * 60 * 60 * 1000;

export type PoliceIceAlertKind = "police" | "ice";
export type PoliceIceAlertState = "under_review" | "corroborated" | "resolved" | "expired";

export function hasPoliceIceReportingConsent(body: Record<string, unknown>): boolean {
  return body.reportingConsent === true
    && body.reportingConsentVersion === POLICE_ICE_REPORTING_CONSENT_VERSION;
}

export function policeIceAlertKind(encounterType: unknown): PoliceIceAlertKind | null {
  const normalized = normalizePoliceEncounterType(encounterType);
  if (!normalized) return null;
  return normalized === "ice_activity" ? "ice" : "police";
}

export function policeIceIncidentCategory(encounterType: PoliceEncounterType): string {
  return `police:${encounterType}`;
}

/**
 * The alert may name only the city/region. Raw area, street, coordinates, and
 * reporter information must never cross this boundary.
 */
export function coarsePoliceIceGeneralArea(location: Pick<IncidentLocation, "city" | "region">): string {
  return [location.city, location.region].filter(Boolean).join(", ");
}

export function policeIceAlertExpiresAt(triggeredAt: Date): Date {
  return new Date(triggeredAt.getTime() + POLICE_ICE_ALERT_TTL_MS);
}

export function policeIceAlertState(input: {
  approvedReportCount: number;
  triggeredAt?: Date | null;
  resolvedAt?: Date | null;
  now?: Date;
}): PoliceIceAlertState {
  if (input.resolvedAt) return "resolved";
  if (input.approvedReportCount < POLICE_ICE_CORROBORATION_THRESHOLD) return "under_review";
  if (input.triggeredAt && policeIceAlertExpiresAt(input.triggeredAt).getTime() <= (input.now ?? new Date()).getTime()) {
    return "expired";
  }
  return "corroborated";
}

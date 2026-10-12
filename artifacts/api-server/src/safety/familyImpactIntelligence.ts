/**
 * Consent-bounded family impact intelligence.
 *
 * This evaluates an already-authorized, time-bounded member location only inside
 * the server. It returns an impact category, never a coordinate, address,
 * location timestamp, route, or claim that a geographically distant member is
 * personally safe.
 */
export const FAMILY_IMPACT_LOCATION_SCOPE = "active_temporary_location_only" as const;
export const MAX_FAMILY_IMPACT_LOCATION_AGE_MS = 10 * 60 * 1000;

export type FamilyImpactStatus =
  | "potentially_affected"
  | "outside_reported_area"
  | "location_unknown"
  | "member_confirmed_safety";

export type EmergencyBoundary =
  | { kind: "polygon"; coordinates: readonly (readonly [number, number])[]; uncertaintyMeters?: number }
  | { kind: "county"; countyCode: string }
  | { kind: "warning_zone"; warningZone: string };

export interface AuthorizedFamilyImpactLocation {
  latitude: number | null;
  longitude: number | null;
  capturedAt: Date | string | null;
  accuracyMeters: number | null;
  countyCode?: string | null;
  warningZone?: string | null;
}

export interface FamilyImpactClassification {
  status: FamilyImpactStatus;
  reason: "inside_boundary" | "boundary_uncertainty" | "outside_boundary" | "stale_or_missing_location" | "unmatched_area" | "member_confirmed";
}

function validCoordinate(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function capturedAtMs(value: Date | string | null): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalized(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

function pointInsidePolygon(latitude: number, longitude: number, coordinates: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const [xi, yi] = coordinates[i] ?? [];
    const [xj, yj] = coordinates[j] ?? [];
    if (!Number.isFinite(xi) || !Number.isFinite(yi) || !Number.isFinite(xj) || !Number.isFinite(yj)) return false;
    const intersects = ((yi > latitude) !== (yj > latitude))
      && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function metersToSegment(latitude: number, longitude: number, a: readonly [number, number], b: readonly [number, number]): number {
  // Local equirectangular approximation is sufficient for the uncertainty edge:
  // never promotes an "outside" result to personal safety.
  const scaleY = 111_320;
  const scaleX = scaleY * Math.cos((latitude * Math.PI) / 180);
  const px = longitude * scaleX;
  const py = latitude * scaleY;
  const ax = a[0] * scaleX;
  const ay = a[1] * scaleY;
  const bx = b[0] * scaleX;
  const by = b[1] * scaleY;
  const dx = bx - ax;
  const dy = by - ay;
  const denominator = dx * dx + dy * dy;
  const factor = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denominator));
  return Math.hypot(px - (ax + factor * dx), py - (ay + factor * dy));
}

function distanceToPolygonEdge(latitude: number, longitude: number, coordinates: readonly (readonly [number, number])[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coordinates.length; i += 1) {
    const a = coordinates[i];
    const b = coordinates[(i + 1) % coordinates.length];
    if (!a || !b) return Number.POSITIVE_INFINITY;
    nearest = Math.min(nearest, metersToSegment(latitude, longitude, a, b));
  }
  return nearest;
}

export function classifyFamilyImpact(
  boundary: EmergencyBoundary,
  location: AuthorizedFamilyImpactLocation | null,
  options: { now?: Date; memberConfirmedSafe?: boolean; maxLocationAgeMs?: number } = {},
): FamilyImpactClassification {
  if (options.memberConfirmedSafe) return { status: "member_confirmed_safety", reason: "member_confirmed" };
  const now = options.now ?? new Date();
  const capturedAt = location ? capturedAtMs(location.capturedAt) : null;
  const maxLocationAgeMs = Number.isFinite(options.maxLocationAgeMs) && (options.maxLocationAgeMs ?? 0) >= 0
    ? options.maxLocationAgeMs!
    : MAX_FAMILY_IMPACT_LOCATION_AGE_MS;
  if (!location || !capturedAt || now.getTime() - capturedAt > maxLocationAgeMs || capturedAt > now.getTime()) {
    return { status: "location_unknown", reason: "stale_or_missing_location" };
  }
  if (boundary.kind === "county") {
    return normalized(location.countyCode) === normalized(boundary.countyCode)
      ? { status: "potentially_affected", reason: "inside_boundary" }
      : location.countyCode ? { status: "outside_reported_area", reason: "unmatched_area" } : { status: "location_unknown", reason: "stale_or_missing_location" };
  }
  if (boundary.kind === "warning_zone") {
    return normalized(location.warningZone) === normalized(boundary.warningZone)
      ? { status: "potentially_affected", reason: "inside_boundary" }
      : location.warningZone ? { status: "outside_reported_area", reason: "unmatched_area" } : { status: "location_unknown", reason: "stale_or_missing_location" };
  }
  if (!validCoordinate(location.latitude) || !validCoordinate(location.longitude) || boundary.coordinates.length < 3) {
    return { status: "location_unknown", reason: "stale_or_missing_location" };
  }
  if (pointInsidePolygon(location.latitude, location.longitude, boundary.coordinates)) {
    return { status: "potentially_affected", reason: "inside_boundary" };
  }
  const uncertainty = Math.max(0, Math.min(20_000, location.accuracyMeters ?? 0)) + Math.max(0, Math.min(20_000, boundary.uncertaintyMeters ?? 0));
  if (uncertainty > 0 && distanceToPolygonEdge(location.latitude, location.longitude, boundary.coordinates) <= uncertainty) {
    return { status: "potentially_affected", reason: "boundary_uncertainty" };
  }
  return { status: "outside_reported_area", reason: "outside_boundary" };
}

/** Never phrase geographic separation as proof of a member's wellbeing. */
export function familyImpactDisclosure(status: FamilyImpactStatus): string {
  switch (status) {
    case "potentially_affected": return "Potentially within the affected area. This does not confirm their safety or condition.";
    case "outside_reported_area": return "Outside the reported area based on a consented location. This does not confirm their safety or condition.";
    case "member_confirmed_safety": return "They explicitly confirmed they are safe.";
    default: return "Location is unavailable or no longer current. Their safety is unknown.";
  }
}

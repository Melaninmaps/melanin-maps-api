import { authenticatedFetch } from "@/lib/authenticatedFetch";

/**
 * Discovery telemetry is deliberately aggregate-only. It has no field for
 * query text, addresses, descriptions, coordinates, or arbitrary metadata.
 */
export type DiscoveryAnalyticsEvent =
  | "result_exposed"
  | "result_opened"
  | "filter_changed"
  | "map_toggled"
  | "save_changed"
  | "correction_submitted"
  | "coverage_request";

export type DiscoveryAnalyticsInput = {
  eventName: DiscoveryAnalyticsEvent;
  surface: "discover" | "businesses" | "map" | "explore" | "smart_search";
  entryPoint: "result_card" | "filter_chip" | "map_handoff" | "save_button" | "correction_form" | "coverage_request" | "results";
  resultId?: string;
  resultType?: "business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination";
  rank?: number;
  resultCount?: number;
  zeroResult?: boolean;
  filters?: {
    categoryIds?: string[];
    specialtyIds?: string[];
    ownershipClaims?: string[];
    recordTypes?: Array<"business" | "cultural_site" | "community_place" | "event" | "resource" | "travel_destination">;
  };
};

let preferences: Promise<{ searchImprovement: boolean; consentVersion: string }> | null = null;

function getPreferences() {
  preferences ??= authenticatedFetch("/api/discovery/v1/preferences")
    .then(async (response) => {
      if (!response.ok) return { searchImprovement: false, consentVersion: "1" };
      const value = await response.json() as { searchImprovement?: unknown; consentVersion?: unknown };
      return {
        searchImprovement: value.searchImprovement === true,
        consentVersion: typeof value.consentVersion === "string" && value.consentVersion.length > 0
          ? value.consentVersion
          : "1",
      };
    })
    .catch(() => ({ searchImprovement: false, consentVersion: "1" }));
  return preferences;
}

export function resetDiscoveryAnalyticsPreferenceCache() {
  preferences = null;
}

export async function emitDiscoveryAnalytics(input: DiscoveryAnalyticsInput): Promise<void> {
  const preference = await getPreferences();
  if (!preference.searchImprovement) return;
  const event = {
    schemaVersion: "1" as const,
    eventId: crypto.randomUUID(),
    idempotencyKey: `${crypto.randomUUID()}-${input.eventName}`,
    eventName: input.eventName,
    consent: { searchImprovement: true, version: preference.consentVersion },
    surface: input.surface,
    platform: "web_desktop",
    entryPoint: input.entryPoint,
    appVersion: "web-1.0.0",
    ...(input.resultId ? { resultId: input.resultId } : {}),
    ...(input.resultType ? { recordType: input.resultType } : {}),
    ...(input.rank ? { rank: input.rank } : {}),
    ...(input.resultCount !== undefined ? { resultCount: input.resultCount } : {}),
    ...(input.zeroResult !== undefined ? { zeroResult: input.zeroResult } : {}),
    ...(input.filters ? { filters: input.filters } : {}),
    ...(input.eventName === "coverage_request" ? { coverageRequested: true } : {}),
  };
  await authenticatedFetch("/api/discovery/v1/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => undefined);
}
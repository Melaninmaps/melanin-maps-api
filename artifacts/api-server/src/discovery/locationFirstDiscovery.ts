import type {
  CoverageGap,
  DiscoveryRecord,
  LocationFirstQuery,
  LocationFirstResponse,
} from "../shared/discoveryContracts";

export interface LocationFirstDiscoveryRepository {
  findExact(input: LocationFirstQuery): Promise<DiscoveryRecord[]>;
  findNearestAvailableLocation(input: LocationFirstQuery): Promise<{ city: string; stateCode: string | null; distanceMiles: number | null } | null>;
  recordCoverageGap(input: CoverageGap): Promise<void>;
  recordFlywheelSignal(input: {
    surface: LocationFirstQuery["surface"];
    action: "search" | "zero_result";
    city: string | null;
    stateCode: string | null;
    recordType: LocationFirstQuery["filters"]["recordTypes"][number] | null;
    category: string | null;
    specialty: string | null;
  }): Promise<void>;
}

function suggestedActionsForEmpty(query: LocationFirstQuery): LocationFirstResponse["suggestedActions"] {
  const base: LocationFirstResponse["suggestedActions"] = ["expand_radius", "show_nearest_city"];
  if (query.filters.recordTypes.includes("event")) return [...base, "submit_event"];
  return [...base, "submit_listing"];
}

export async function executeLocationFirstDiscovery(
  query: LocationFirstQuery,
  repository: LocationFirstDiscoveryRepository,
): Promise<LocationFirstResponse> {
  const recordType = query.filters.recordTypes.length === 1 ? query.filters.recordTypes[0] : null;

  // Fire-and-forget flywheel signal — never block the member's result on telemetry.
  repository.recordFlywheelSignal({
    surface: query.surface,
    action: "search",
    city: query.location.city,
    stateCode: query.location.stateCode,
    recordType,
    category: query.filters.category,
    specialty: query.filters.specialty,
  }).catch(() => {/* telemetry failure is silent */});

  // Never transform a missing location into an all-national inventory dump.
  if (!query.location.city || query.locationMode === "all_locations") {
    return {
      query,
      requiresLocation: !query.location.city,
      records: [],
      coverageGap: null,
      suggestedActions: [],
      nearestAvailableLocation: null,
    };
  }

  const records = await repository.findExact(query);
  if (records.length) {
    return { query, requiresLocation: false, records, coverageGap: null, suggestedActions: [], nearestAvailableLocation: null };
  }

  const coverageGap: CoverageGap = {
    city: query.location.city,
    stateCode: query.location.stateCode,
    recordType: recordType ?? "business",
    category: query.filters.category,
    specialty: query.filters.specialty,
    observedAt: new Date().toISOString(),
  };

  // Record gap + zero-result signal in parallel; degrade gracefully on failure.
  await Promise.allSettled([
    repository.recordCoverageGap(coverageGap),
    repository.recordFlywheelSignal({
      surface: query.surface,
      action: "zero_result",
      city: query.location.city,
      stateCode: query.location.stateCode,
      recordType,
      category: query.filters.category,
      specialty: query.filters.specialty,
    }),
  ]);

  return {
    query,
    requiresLocation: false,
    records: [],
    coverageGap,
    suggestedActions: suggestedActionsForEmpty(query),
    nearestAvailableLocation: await repository.findNearestAvailableLocation(query).catch(() => null),
  };
}

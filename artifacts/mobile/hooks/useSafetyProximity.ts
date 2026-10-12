import { useCallback } from "react";

/**
 * Legacy proximity warnings are retained as types only while the remaining map
 * presentation code is retired. They must not collect device coordinates,
 * start a location watch, call a proximity endpoint, or surface a member's
 * proximity to a safety report.
 */
export interface ProximityWarning {
  type: "business";
  targetId: string;
  name: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  reportCount: number;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export interface AreaIncident {
  id: string;
  city: string;
  neighborhood: string | null;
  category: string;
  severity: string;
  reportCount: number;
}

export function useSafetyProximity({ enabled: _enabled = true }: { enabled?: boolean } = {}) {
  const dismissWarning = useCallback(async (_targetId: string) => undefined, []);
  const dismissAll = useCallback(() => undefined, []);

  return {
    warnings: [] as ProximityWarning[],
    areaIncidents: [] as AreaIncident[],
    locationGranted: false,
    userLocation: null as { lat: number; lng: number } | null,
    dismissWarning,
    dismissAll,
  };
}

import { useCallback } from "react";

/**
 * Retained only as a fail-closed compatibility boundary while legacy map
 * components are removed. Community Intelligence is member-selected,
 * city-level, consented, and aggregate-only; it must never infer a city from
 * device coordinates or present an automatic location-derived safety alert.
 */
export interface GeoAlert {
  city: string;
  avgSafetyScore: number;
  approvedSurveyCount: number;
  confidence: "minimum_sample" | "larger_sample";
}

export function useGeoSafeAlert() {
  const dismissAlert = useCallback(() => undefined, []);
  const recheck = useCallback(async () => undefined, []);

  return {
    alert: null as GeoAlert | null,
    checking: false,
    dismissAlert,
    recheck,
  };
}

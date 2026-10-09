export type MapDistanceOrigin = {
  lat: number;
  lng: number;
  /** A member-selected public place label or the fixed device-location label. */
  label: string;
  source: "device" | "manual";
};

const MAX_MANUAL_ORIGIN_LABEL_LENGTH = 120;

/**
 * Manual map origins are intentionally browser-local and require an explicit
 * member action before Google Maps geocodes the submitted place.
 */
export function normalizeManualMapDistanceOrigin(value: string): string | null {
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > MAX_MANUAL_ORIGIN_LABEL_LENGTH) return null;
  return normalized;
}

export function isFiniteMapCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** A member's manual selection deliberately takes precedence for displayed distances. */
export function resolveMapDistanceOrigin(
  manualOrigin: MapDistanceOrigin | null,
  deviceCoordinates: { lat: number; lng: number } | null,
): MapDistanceOrigin | null {
  if (manualOrigin) return manualOrigin;
  if (!deviceCoordinates) return null;
  return {
    lat: deviceCoordinates.lat,
    lng: deviceCoordinates.lng,
    label: "your current location",
    source: "device",
  };
}

export function mapDistanceOriginContext(origin: MapDistanceOrigin): string {
  return origin.source === "device"
    ? "from your current location"
    : `from ${origin.label}`;
}

export type MapLocationFailureKind =
  | "permission"
  | "services_off"
  | "timeout"
  | "unavailable";

export interface MapLocationNotice {
  kind: MapLocationFailureKind;
  message: string;
}

/**
 * Turns native location failures into concise, recoverable map guidance.
 * Provider details remain private; the member receives only the next action.
 */
export function mapLocationFailureNotice(error: unknown): MapLocationNotice {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (/permission|denied|unauthori[sz]ed/.test(message)) {
    return {
      kind: "permission",
      message:
        "Location permission is off. Turn it on for Mapping With Melanin in phone Settings, then tap Retry location.",
    };
  }

  if (/timeout|timed out/.test(message)) {
    return {
      kind: "timeout",
      message:
        "Your phone is still finding a precise location. Check that Location Services are on, then tap Retry location.",
    };
  }

  return {
    kind: "unavailable",
    message:
      "We could not read your location right now. Check Location Services and your connection, then tap Retry location.",
  };
}

export function mapLocationServicesOffNotice(): MapLocationNotice {
  return {
    kind: "services_off",
    message:
      "Location Services are off on this phone. Turn them on in Settings, then tap Retry location.",
  };
}

export type MapGeolocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "timed_out"
  | "error";

/** Native browser timeout supplied to `getCurrentPosition`. */
export const MAP_GEOLOCATION_TIMEOUT_MS = 12_000;
/**
 * Browser geolocation implementations occasionally fail to invoke the native
 * timeout callback. This short independent guard preserves an honest fallback
 * without persisting or fabricating a location.
 */
export const MAP_GEOLOCATION_WATCHDOG_MS = MAP_GEOLOCATION_TIMEOUT_MS + 500;

export type MapGeolocationFailure = {
  status: Extract<MapGeolocationStatus, "denied" | "timed_out" | "error">;
  message: string;
};

export function mapGeolocationFailure(errorCode: number | null | undefined): MapGeolocationFailure {
  if (errorCode === 1) {
    return {
      status: "denied",
      message: "Location permission is off. This map is showing your saved home area, not your live location. Allow location for Mapping With Melanin in your browser settings, then try again.",
    };
  }
  if (errorCode === 3) {
    return {
      status: "timed_out",
      message: "Your location did not respond in time. This map is showing your saved home area, not your live location. Try again when your connection and device location are available.",
    };
  }
  return {
    status: "error",
    message: "Your location could not be determined. This map is showing your saved home area, not your live location. You can try again or search a city.",
  };
}

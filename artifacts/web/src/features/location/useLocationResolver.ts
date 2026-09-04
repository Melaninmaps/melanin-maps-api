import { useCallback, useState } from "react";
import { locationResolutionErrorMessage } from "./locationResolutionMessages";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type ResolvedArea = {
  id: string;
  label: string;
  /** Canonical city name from an approved location or published inventory index. */
  cityName: string;
  /** State code (e.g. "NC") or null for locations outside the US or without a state */
  stateCode: string | null;
  /** Neighborhood name or null if this is a city-level match */
  neighborhoodName: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ResolutionState = "idle" | "locating" | "resolving" | "ready" | "error";

export function useLocationResolver() {
  const [state, setState] = useState<ResolutionState>("idle");
  const [error, setError] = useState<string | null>(null);

  const resolveAreaText = useCallback(async (areaText: string): Promise<ResolvedArea | null> => {
    const q = areaText.trim();
    if (!q) {
      setError("Enter a city, neighborhood, or ZIP code first.");
      setState("error");
      return null;
    }
    setError(null);
    setState("resolving");
    try {
      const response = await fetch(
        `${BASE}/api/locations/resolve?q=${encodeURIComponent(q)}`,
        { credentials: "include", headers: { Accept: "application/json" } },
      );
      const responseError = locationResolutionErrorMessage(response.status);
      if (!response.ok && responseError) {
        throw new Error(responseError);
      }
      const result = (await response.json()) as ResolvedArea;
      setState("ready");
      return result;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "We could not search that area right now.",
      );
      setState("error");
      return null;
    }
  }, []);

  const useBrowserLocation = useCallback(async (): Promise<ResolvedArea | null> => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setError(
        "Location sharing requires a supported browser over a secure connection. You can enter a city instead.",
      );
      setState("error");
      return null;
    }
    setError(null);
    setState("locating");

    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (geolocationError) => {
          const message =
            geolocationError.code === geolocationError.PERMISSION_DENIED
              ? "Location permission was not granted. Enter a city or neighborhood instead."
              : geolocationError.code === geolocationError.TIMEOUT
                ? "Location lookup timed out. Enter a city or try again."
                : "Your location could not be determined. Enter a city or neighborhood instead.";
          setError(message);
          setState("error");
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
      );
    });
    if (!position) return null;

    setState("resolving");
    try {
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `${BASE}/api/locations/reverse?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
        { credentials: "include", headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        throw new Error(
          "We found your approximate location but could not identify the area. Enter a city instead.",
        );
      }
      const result = (await response.json()) as ResolvedArea;
      setState("ready");
      return result;
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "We could not identify your area.",
      );
      setState("error");
      return null;
    }
  }, []);

  return { state, error, resolveAreaText, useBrowserLocation };
}

import { useEffect, useRef, useState } from "react";
import type { Business } from "@/constants/types";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

const MAP_PIN_LOAD_ERROR = "Unable to refresh the MWM map pins. Showing the last available pins.";

/**
 * The web map and native map share this canonical, lightweight business-pin
 * layer. It is intentionally independent of the locality search used for the
 * "Around you" panel: changing GPS permission, a radius, or a transient local
 * request must never erase valid MWM markers already on the map.
 */
export function useCanonicalMapPins({ enabled = true }: { enabled?: boolean } = {}) {
  const [pins, setPins] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const requestId = ++requestGeneration.current;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`${getApiBase()}/api/businesses/map-pins`, {
          headers: await getMemberApiHeaders(),
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json() as { pins?: unknown };
        if (!Array.isArray(payload.pins)) throw new Error("Invalid map-pins response");

        const nextPins = payload.pins.flatMap((raw): Business[] => {
          if (!raw || typeof raw !== "object") return [];
          const pin = raw as Record<string, unknown>;
          const latitude = Number(pin.latitude);
          const longitude = Number(pin.longitude);
          const id = typeof pin.id === "string" ? pin.id : "";
          const name = typeof pin.name === "string" ? pin.name : "";
          if (
            !id ||
            !name ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001)
          ) return [];

          // Map-pins deliberately carries only marker-safe fields. Defaults make
          // the existing native business card and profile handoff safe; selecting
          // a pin still routes to the canonical full business profile by ID.
          return [{
            id,
            name,
            category: typeof pin.category === "string" ? pin.category : "Business",
            subcategory: typeof pin.subcategory === "string"
              ? pin.subcategory
              : (typeof pin.category === "string" ? pin.category : "Business"),
            address: "",
            city: typeof pin.city === "string" ? pin.city : "",
            state: typeof pin.state === "string" ? pin.state : "",
            country: typeof pin.country === "string" ? pin.country : undefined,
            rating: 0,
            reviewCount: 0,
            verified: false,
            featured: false,
            description: "",
            latitude,
            longitude,
            tags: [],
            confidenceScore: 0,
            blackOwned: false,
            ownershipDesignations: [],
            verifiedDesignations: [],
            listingStatus: typeof pin.listing_status === "string" ? pin.listing_status : null,
          }];
        });

        if (!controller.signal.aborted && requestId === requestGeneration.current) {
          setPins(nextPins);
          setError(null);
        }
      } catch {
        if (!controller.signal.aborted && requestId === requestGeneration.current) {
          // Keep the last good web-equivalent layer instead of blinking all pins
          // out during a temporary API or connectivity failure.
          setError(MAP_PIN_LOAD_ERROR);
        }
      } finally {
        if (!controller.signal.aborted && requestId === requestGeneration.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [enabled]);

  return { pins, isLoading, error };
}

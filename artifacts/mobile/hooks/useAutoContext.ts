/**
 * useAutoContext — returns GPS-derived location context for contribution forms.
 *
 * Returns: { lat, lng, city, state, neighborhood, nearbyBusinesses[], label, loading, denied }
 *
 * - label is the editable summary line: "Near Sunrise Market, Atlanta — tap to change"
 * - If permission denied: denied=true; consuming form falls back to a neighborhood picker
 * - Caches result for 5 minutes so repeated form opens don't hammer GPS
 * - NEVER blocks form submission on a denied permission
 */
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { getApiBase } from "@/lib/api";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface NearbyBusiness {
  id: string;
  name: string;
  category: string;
  distance?: number;
}

export interface AutoContext {
  lat: number | null;
  lng: number | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  nearbyBusinesses: NearbyBusiness[];
  /** "Near {nearestBusiness}, {city}" or "{city}, {state}" fallback */
  label: string | null;
  loading: boolean;
  denied: boolean;
  /** Call to re-run location detection (e.g. after user grants permission) */
  refresh: () => void;
}

interface Cache {
  context: AutoContext;
  timestamp: number;
}

let cache: Cache | null = null;
const API_BASE = getApiBase();

export function useAutoContext(): AutoContext {
  const [ctx, setCtx] = useState<AutoContext>({
    lat: null,
    lng: null,
    city: null,
    state: null,
    neighborhood: null,
    nearbyBusinesses: [],
    label: null,
    loading: true,
    denied: false,
    refresh: () => {},
  });

  const mounted = useRef(true);

  const detect = useCallback(async () => {
    // Return cached result if still fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      setCtx(cache.context);
      return;
    }

    setCtx((c) => ({ ...c, loading: true }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!mounted.current) return;
        setCtx({
          lat: null, lng: null, city: null, state: null, neighborhood: null,
          nearbyBusinesses: [], label: null, loading: false, denied: true,
          refresh: () => {},
        });
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = pos.coords;

      // Reverse geocode via Expo (on-device, no extra API key needed)
      const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const city = geo?.city ?? geo?.subregion ?? null;
      const state = geo?.region ?? null;
      const neighborhood = geo?.district ?? geo?.street ?? null;

      // Fetch nearest businesses (best-effort — don't block context on failure)
      let nearbyBusinesses: NearbyBusiness[] = [];
      try {
        const resp = await fetch(
          `${API_BASE}/api/businesses?lat=${lat}&lng=${lng}&radius=0.5&limit=3&sort=distance`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (resp.ok) {
          const data = await resp.json();
          nearbyBusinesses = (data.businesses ?? []).map((b: any) => ({
            id: b.id,
            name: b.name,
            category: b.category,
            distance: b.distance,
          }));
        }
      } catch {
        // GPS context is still valid without nearby businesses
      }

      const nearest = nearbyBusinesses[0]?.name ?? null;
      const label = nearest && city
        ? `Near ${nearest}, ${city}`
        : city && state
        ? `${city}, ${state}`
        : neighborhood ?? null;

      const result: AutoContext = {
        lat, lng, city, state, neighborhood,
        nearbyBusinesses, label,
        loading: false, denied: false,
        refresh: () => {},
      };

      cache = { context: result, timestamp: Date.now() };
      if (mounted.current) setCtx(result);
    } catch {
      if (!mounted.current) return;
      setCtx((c) => ({ ...c, loading: false, denied: false }));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(detect);
    return () => { mounted.current = false; };
  }, [detect]);

  // Patch refresh into returned object
  return { ...ctx, refresh: detect };
}

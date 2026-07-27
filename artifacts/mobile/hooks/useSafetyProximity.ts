import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, AppState } from "react-native";

const DISMISSED_KEY = "@melanin_proximity_dismissed_";
const COOLDOWN_MS = 30 * 60 * 1000;
const POLL_INTERVAL_MS = 30_000;
const MIN_MOVE_METERS = 50;
const WARNING_RADIUS_METERS = 500;

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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useSafetyProximity({ enabled = true }: { enabled?: boolean } = {}) {
  const [warnings, setWarnings] = useState<ProximityWarning[]>([]);
  const [areaIncidents, setAreaIncidents] = useState<AreaIncident[]>([]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [appActive, setAppActive] = useState(AppState.currentState === "active");

  const lastPollPos = useRef<{ lat: number; lng: number } | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());

  // Pause when app is backgrounded or inactive
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (next) => {
      setAppActive(next === "active");
    });
    return () => sub.remove();
  }, []);

  const shouldPoll = enabled && appActive;

  const fetchWarnings = useCallback(async (lat: number, lng: number) => {
    try {
      const token = await SecureStore.getItemAsync("auth_session_token").catch(() => null);
      const url = `${getApiBase()}/api/reports/proximity-warnings?lat=${lat}&lng=${lng}&radius=${WARNING_RADIUS_METERS}`;
      const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      if (!res.ok) return;
      const data = await res.json() as {
        warnings: ProximityWarning[];
        areaIncidents: AreaIncident[];
      };

      const active = (data.warnings ?? []).filter(
        (w) => !dismissedRef.current.has(w.targetId)
      );

      setWarnings(active);
      setAreaIncidents(data.areaIncidents ?? []);
    } catch { /* silent — location data, not critical */ }
  }, []);

  const pollIfMoved = useCallback(async (lat: number, lng: number) => {
    const last = lastPollPos.current;
    if (last && haversineMeters(last.lat, last.lng, lat, lng) < MIN_MOVE_METERS) return;
    lastPollPos.current = { lat, lng };
    await fetchWarnings(lat, lng);
  }, [fetchWarnings]);

  const dismissWarning = useCallback(async (targetId: string) => {
    dismissedRef.current.add(targetId);
    setWarnings((prev) => prev.filter((w) => w.targetId !== targetId));
    await AsyncStorage.setItem(DISMISSED_KEY + targetId, String(Date.now())).catch(() => {});
  }, []);

  const dismissAll = useCallback(() => {
    setWarnings((prev) => {
      prev.forEach((w) => {
        dismissedRef.current.add(w.targetId);
        AsyncStorage.setItem(DISMISSED_KEY + w.targetId, String(Date.now())).catch(() => {});
      });
      return [];
    });
  }, []);

  // Subscription effect — starts only when shouldPoll is true, cleans up when it becomes false
  useEffect(() => {
    let cancelled = false;

    async function loadDismissed() {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const proximityKeys = keys.filter((k) => k.startsWith(DISMISSED_KEY));
        const entries = await AsyncStorage.multiGet(proximityKeys);
        for (const [key, val] of entries) {
          if (!val) continue;
          const elapsed = Date.now() - parseInt(val, 10);
          if (elapsed < COOLDOWN_MS) {
            dismissedRef.current.add(key.replace(DISMISSED_KEY, ""));
          } else {
            await AsyncStorage.removeItem(key).catch(() => {});
          }
        }
      } catch { /* */ }
    }

    async function start() {
      // Guard first — skip AsyncStorage reads and all setup when disabled
      if (!shouldPoll || cancelled) return;

      await loadDismissed();

      if (Platform.OS === "web") {
        if (typeof window === "undefined" || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const { latitude: lat, longitude: lng } = pos.coords;
            setUserLocation({ lat, lng });
            void pollIfMoved(lat, lng);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 10000 }
        );

        if (navigator.geolocation.watchPosition) {
          const watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (cancelled) return;
              const { latitude: lat, longitude: lng } = pos.coords;
              setUserLocation({ lat, lng });
              void pollIfMoved(lat, lng);
            },
            () => {},
            { enableHighAccuracy: false }
          );
          return () => {
            cancelled = true;
            navigator.geolocation.clearWatch(watchId);
          };
        }
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      setLocationGranted(true);

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: MIN_MOVE_METERS,
          timeInterval: POLL_INTERVAL_MS,
        },
        (loc) => {
          if (cancelled) return;
          const { latitude: lat, longitude: lng } = loc.coords;
          setUserLocation({ lat, lng });
          void pollIfMoved(lat, lng);
        }
      );

      if (cancelled) {
        sub.remove();
        return;
      }
      locationSub.current = sub;
    }

    void start();

    return () => {
      cancelled = true;
      locationSub.current?.remove();
      locationSub.current = null;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [shouldPoll, pollIfMoved]);

  return {
    warnings,
    areaIncidents,
    locationGranted,
    userLocation,
    dismissWarning,
    dismissAll,
  };
}

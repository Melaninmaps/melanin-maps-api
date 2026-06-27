import { useEffect, useRef, useState, useCallback } from "react";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AlertType = "police" | "ice" | "checkpoint" | "traffic" | "other";

export interface ActivityAlert {
  id: string;
  type: AlertType;
  lat: number;
  lng: number;
  description: string | null;
  confirmedCount: number;
  clearedCount: number;
  distanceMeters: number;
  createdAt: string;
  expiresAt: string;
}

export const ALERT_META: Record<AlertType, { label: string; icon: string; color: string; bgColor: string }> = {
  police: { label: "Police Activity", icon: "🚔", color: "#2563EB", bgColor: "#1E3A8A" },
  ice: { label: "ICE Activity", icon: "⚠️", color: "#DC2626", bgColor: "#7F1D1D" },
  checkpoint: { label: "Checkpoint", icon: "🛑", color: "#D97706", bgColor: "#78350F" },
  traffic: { label: "Traffic Stop", icon: "🚦", color: "#7C3AED", bgColor: "#4C1D95" },
  other: { label: "Community Alert", icon: "📢", color: "#059669", bgColor: "#064E3B" },
};

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

const POLL_INTERVAL_MS = 30_000;
const ALERT_RADIUS_KM = 1.5;

export function useActivityAlerts() {
  const [alerts, setAlerts] = useState<ActivityAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNearby = useCallback(async () => {
    const loc = locationRef.current;
    if (!loc) return;
    try {
      const res = await fetch(
        `${getApiBase()}/api/community-alerts/nearby?lat=${loc.lat}&lng=${loc.lng}&radius=${ALERT_RADIUS_KM}`,
      );
      if (!res.ok) return;
      const data = await res.json() as { alerts: ActivityAlert[] };
      setAlerts(data.alerts ?? []);
    } catch { }
  }, []);

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    locationRef.current = { lat, lng };
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${getApiBase()}/api/community-alerts/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lng }),
      });
    } catch { }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (Platform.OS === "web") return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        await updateLocation(loc.coords.latitude, loc.coords.longitude);
        await fetchNearby();

        timerRef.current = setInterval(async () => {
          try {
            const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            await updateLocation(fresh.coords.latitude, fresh.coords.longitude);
            await fetchNearby();
          } catch { }
        }, POLL_INTERVAL_MS);
      } catch { }
    }

    void init();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNearby, updateLocation]);

  const reportAlert = useCallback(async (type: AlertType, description?: string): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    const loc = locationRef.current;
    if (!loc) return false;
    try {
      const token = await getToken();
      if (!token) return false;
      const res = await fetch(`${getApiBase()}/api/community-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, lat: loc.lat, lng: loc.lng, description }),
      });
      if (!res.ok) return false;
      await fetchNearby();
      return true;
    } catch { return false; }
  }, [fetchNearby]);

  const confirmAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${getApiBase()}/api/community-alerts/${alertId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchNearby();
    } catch { }
  }, [fetchNearby]);

  const clearAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${getApiBase()}/api/community-alerts/${alertId}/clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchNearby();
    } catch { }
  }, [fetchNearby]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissed((prev) => new Set([...prev, alertId]));
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  return { alerts: visible, reportAlert, confirmAlert, clearAlert, dismissAlert };
}

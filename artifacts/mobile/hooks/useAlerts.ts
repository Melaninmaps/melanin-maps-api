import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { getApiBase } from "@/lib/api";

export interface LiveAlertItem {
  id: string;
  type: "safety" | "community" | "weather" | "travel";
  title: string;
  message: string;
  location: string;
  timeAgo: string;
  severity: "low" | "medium" | "high";
  source?: "nws" | "fema" | "community";
  expires?: string;
}

interface UseAlertsResult {
  alerts: LiveAlertItem[];
  isLoading: boolean;
  isLive: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => void;
}

export function useAlerts(state?: string): UseAlertsResult {
  const [alerts, setAlerts] = useState<LiveAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in to load live safety and weather alerts.");
      const qs = state ? `?state=${encodeURIComponent(state)}` : "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${apiBase}/api/alerts${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { alerts: LiveAlertItem[]; lastUpdated: string };
      setAlerts(data.alerts ?? []);
      setIsLive(true);
      setError(null);
      setLastUpdated(data.lastUpdated);
    } catch (cause) {
      setAlerts([]);
      setIsLive(false);
      setError(cause instanceof Error ? cause.message : "Live safety and weather alerts are unavailable.");
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  useEffect(() => {
    void Promise.resolve().then(fetchAlerts);
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, isLoading, isLive, error, lastUpdated, refetch: fetchAlerts };
}

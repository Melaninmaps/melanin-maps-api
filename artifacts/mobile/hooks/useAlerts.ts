import { useState, useEffect, useCallback } from "react";
import { ALERTS } from "@/constants/data";

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
  lastUpdated: string | null;
  refetch: () => void;
}

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

export function useAlerts(state?: string): UseAlertsResult {
  const [alerts, setAlerts] = useState<LiveAlertItem[]>(ALERTS as LiveAlertItem[]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const qs = state ? `?state=${encodeURIComponent(state)}` : "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${apiBase}/api/alerts${qs}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { alerts: LiveAlertItem[]; lastUpdated: string };
      setAlerts(data.alerts.length > 0 ? data.alerts : (ALERTS as LiveAlertItem[]));
      setIsLive(data.alerts.length > 0);
      setLastUpdated(data.lastUpdated);
    } catch {
      setAlerts(ALERTS as LiveAlertItem[]);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, isLoading, isLive, lastUpdated, refetch: fetchAlerts };
}

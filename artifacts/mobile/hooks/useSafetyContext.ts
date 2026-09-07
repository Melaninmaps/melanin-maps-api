import { getApiBase } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";

export interface IncidentCount {
  type: string;
  count: number;
}

export interface SafetyContext {
  city: string;
  source: string;
  period: string;
  totalIncidents: number;
  topConcerns: IncidentCount[];
  trend: "improving" | "stable" | "worsening";
  lastUpdated: string;
  cached?: boolean;
  available?: boolean;
  message?: string;
}

interface UseSafetyContextResult {
  context: SafetyContext | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const SUPPORTED_CITIES: { key: string; label: string }[] = [
  { key: "chicago", label: "Chicago" },
  { key: "new-york", label: "New York" },
  { key: "philadelphia", label: "Philadelphia" },
  { key: "washington-dc", label: "Washington DC" },
];



export function useSafetyContext(city: string | null): UseSafetyContextResult {
  const [context, setContext] = useState<SafetyContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!city) return;
    const apiBase = getApiBase();

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiBase}/api/safety-context?city=${encodeURIComponent(city)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error ?? `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as SafetyContext;
      if (data.available === false) {
        setContext(null);
        return;
      }
      setContext(data);
    } catch (e) {
      setError("Could not load safety data");
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    void Promise.resolve().then(fetchContext);
  }, [fetchContext]);

  return { context, isLoading, error, refetch: fetchContext };
}

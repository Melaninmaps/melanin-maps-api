import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export interface PointsLedgerEntry {
  id: string;
  action: string;
  points: number;
  entityId: string | null;
  createdAt: string;
}

export function usePoints() {
  const [total, setTotal] = useState(0);
  const [ledger, setLedger] = useState<PointsLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as {
          total: number;
          ledger: PointsLedgerEntry[];
        };
        setTotal(data.total);
        setLedger(data.ledger);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const addLocal = useCallback((pts: number) => {
    setTotal((prev) => prev + pts);
  }, []);

  return { total, ledger, isLoading, refresh: load, addLocal };
}

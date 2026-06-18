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

export function useCheckins() {
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      const apiBase = getApiBase();
      if (!token || !apiBase) return;
      try {
        const res = await fetch(`${apiBase}/api/checkins/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { checkIns: { businessId: string }[] };
          setCheckedInIds([...new Set(data.checkIns.map((c) => c.businessId))]);
        }
      } catch {}
    }
    load();
  }, []);

  const checkIn = useCallback(async (businessId: string): Promise<number | null> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return null;
    try {
      const res = await fetch(`${apiBase}/api/checkins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { pointsEarned: number };
        setCheckedInIds((prev) =>
          prev.includes(businessId) ? prev : [...prev, businessId],
        );
        return data.pointsEarned;
      }
    } catch {}
    return null;
  }, []);

  const hasCheckedIn = useCallback(
    (id: string) => checkedInIds.includes(id),
    [checkedInIds],
  );

  return { checkedInIds, hasCheckedIn, checkIn };
}

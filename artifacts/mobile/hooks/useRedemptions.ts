import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_session_token";
function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function getToken() {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); } catch { return null; }
}

export interface Reward {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  status: string;
  createdAt: string;
}

export function useRedemptions() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRewards = useCallback(async () => {
    const apiBase = getApiBase();
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/rewards`);
      if (res.ok) {
        const data = await res.json() as { rewards: Reward[] };
        setRewards(data.rewards);
      }
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/redemptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { redemptions: Redemption[] };
        setRedemptions(data.redemptions);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadRewards);
    void Promise.resolve().then(loadHistory);
  }, [loadRewards, loadHistory]);

  const redeem = useCallback(async (rewardId: string): Promise<{ pointsSpent: number } | null> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return null;
    try {
      const res = await fetch(`${apiBase}/api/redemptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rewardId }),
      });
      if (res.ok) {
        const data = await res.json() as { pointsSpent: number };
        await loadHistory();
        return data;
      }
      if (res.status === 400) {
        const data = await res.json() as { error: string };
        throw new Error(data.error);
      }
    } catch (e) { throw e; }
    return null;
  }, [loadHistory]);

  return { rewards, redemptions, isLoading, redeem };
}

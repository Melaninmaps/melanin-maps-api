import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_session_token";
function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function getToken() {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); } catch { return null; }
}

export interface FlashDeal {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  discountText: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useDeals(businessId: string) {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    const apiBase = getApiBase();
    if (!apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/deals/${businessId}`);
      if (res.ok) {
        const data = await res.json() as { deals: FlashDeal[] };
        setDeals(data.deals);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [businessId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const postDeal = useCallback(async (title: string, discountText?: string, description?: string) => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return null;
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`${apiBase}/api/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId, title, discountText, description, expiresAt }),
      });
      if (res.ok) {
        const data = await res.json() as { deal: FlashDeal };
        setDeals((prev) => [data.deal, ...prev]);
        return data.deal;
      }
    } catch {}
    return null;
  }, [businessId]);

  return { deals, isLoading, refresh: load, postDeal };
}

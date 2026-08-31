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

export interface BusinessInvite {
  id: string;
  reviewId: string | null;
  invitedByUserId: string | null;
  businessId: string | null;
  businessName: string | null;
  socialHandle: string;
  socialPlatform: string;
  status: string;
  trialStartDate: string;
  trialEndDate: string;
  notes: string | null;
  createdAt: string;
}

export function useBusinessInvites() {
  const [invites, setInvites] = useState<BusinessInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { invites: BusinessInvite[] };
        setInvites(data.invites);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const updateStatus = useCallback(async (id: string, status: string, notes?: string): Promise<boolean> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/api/admin/invites/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        const data = (await res.json()) as { invite: BusinessInvite };
        setInvites((prev) => prev.map((inv) => inv.id === id ? data.invite : inv));
        return true;
      }
    } catch {}
    return false;
  }, []);

  return { invites, isLoading, refresh: load, updateStatus };
}

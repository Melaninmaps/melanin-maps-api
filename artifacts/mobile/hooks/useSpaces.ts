import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const AUTH_TOKEN_KEY = "auth_session_token";
function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken() {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export interface CommunitySpace {
  id: string;
  postedById: string;
  postedByName: string | null;
  title: string;
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string;
  state: string | null;
  spaceType: string;
  priceLabel: string | null;
  sqft: number | null;
  listingUrl: string | null;
  agentName: string | null;
  agentPhone: string | null;
  agentEmail: string | null;
  agentUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface CreateSpacePayload {
  title: string;
  description?: string;
  address?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  spaceType: string;
  priceLabel?: string;
  sqft?: number;
  listingUrl?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentUrl?: string;
}

export function useSpaces(params?: { city?: string; spaceType?: string; q?: string }) {
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const apiBase = getApiBase();
    if (!apiBase) return;
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params?.city) qs.set("city", params.city);
      if (params?.spaceType) qs.set("spaceType", params.spaceType);
      if (params?.q) qs.set("q", params.q);
      const res = await fetch(`${apiBase}/api/spaces?${qs.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { spaces: CommunitySpace[] };
        setSpaces(data.spaces);
      }
    } finally { setIsLoading(false); }
  }, [params?.city, params?.spaceType, params?.q]);

  useEffect(() => { load(); }, [load]);

  const createSpace = useCallback(async (payload: CreateSpacePayload): Promise<CommunitySpace | null> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return null;
    const res = await fetch(`${apiBase}/api/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create listing");
    const data = (await res.json()) as { space: CommunitySpace };
    setSpaces((prev) => [data.space, ...prev]);
    return data.space;
  }, []);

  const removeSpace = useCallback(async (id: string): Promise<void> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    await fetch(`${apiBase}/api/spaces/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSpaces((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { spaces, isLoading, refresh: load, createSpace, removeSpace };
}

export function useSpaceDetail(id: string) {
  const [space, setSpace] = useState<CommunitySpace | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const apiBase = getApiBase();
    if (!apiBase) return;
    setIsLoading(true);
    fetch(`${apiBase}/api/spaces/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSpace((d as { space: CommunitySpace }).space))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { space, isLoading };
}

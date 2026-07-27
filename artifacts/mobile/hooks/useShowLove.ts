import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

export interface ShowLoveNomination {
  id: number;
  nominator_id: string | null;
  nominator_first_name: string | null;
  nominator_last_name: string | null;
  nominator_image: string | null;
  nominee_type: string;
  nominee_name: string;
  nominee_user_id: string | null;
  nominee_business_id: string | null;
  nominee_handle: string | null;
  nominee_image_url: string | null;
  category: string;
  what_known_for: string[];
  reason: string;
  experience: string | null;
  city: string | null;
  show_love_count: number;
  support_count: number;
  saved_count: number;
  visited_count: number;
  total_reactions: number;
  my_reaction: string | null;
  spotlight_type: string | null;
  created_at: string;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await SecureStore.getItemAsync("auth_session_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {};
}

export function useShowLove(options: { category?: string; nomineeType?: string; search?: string } = {}) {
  const [nominations, setNominations] = useState<ShowLoveNomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "20", offset: "0" });
      if (options.category) params.set("category", options.category);
      if (options.nomineeType) params.set("nomineeType", options.nomineeType);
      if (options.search) params.set("search", options.search);

      const headers = await getAuthHeader();
      const res = await globalThis.fetch(`${getApiBase()}/api/show-love?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { nominations: ShowLoveNomination[]; total: number };
      setNominations(data.nominations);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [options.category, options.nomineeType, options.search]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { nominations, isLoading, error, total, refetch: fetch };
}

export function useShowLoveReceived(userId: string | null) {
  const [nominations, setNominations] = useState<ShowLoveNomination[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await globalThis.fetch(`${getApiBase()}/api/show-love/received/${userId}`, { headers });
      if (!res.ok) return;
      const data = (await res.json()) as { nominations: ShowLoveNomination[] };
      setNominations(data.nominations);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { nominations, isLoading, refetch: fetch };
}

export async function createShowLoveNomination(payload: {
  nomineeName: string;
  nomineeType: string;
  nomineeUserId?: string;
  nomineeBusinessId?: string;
  nomineeHandle?: string;
  category: string;
  whatKnownFor: string[];
  reason: string;
  experience?: string;
  city?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
    const res = await globalThis.fetch(`${getApiBase()}/api/show-love`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return { ok: false, error: data.error ?? "Failed to submit" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function reactToShowLove(nominationId: number, reactionType: string): Promise<{ ok: boolean; action?: string; reactionType?: string | null }> {
  try {
    const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
    const res = await globalThis.fetch(`${getApiBase()}/api/show-love/${nominationId}/react`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reactionType }),
    });
    if (!res.ok) return { ok: false };
    return await res.json() as { ok: boolean; action?: string; reactionType?: string | null };
  } catch {
    return { ok: false };
  }
}

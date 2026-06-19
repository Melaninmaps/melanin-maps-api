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

export interface Group {
  id: number;
  name: string;
  description: string | null;
  category: string;
  memberCount: number;
  isPrivate: boolean;
  city: string | null;
  state: string | null;
  createdAt: string;
  isMember: boolean;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      if (!apiBase) { setIsLoading(false); return; }
      const token = await getToken();
      const res = await fetch(`${apiBase}/api/groups`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { groups: Group[] };
        setGroups(data.groups);
      }
    } catch {
      // show empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchGroups(); }, [fetchGroups]);

  const join = useCallback(async (groupId: number) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return false;
    try {
      const res = await fetch(`${apiBase}/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g,
          ),
        );
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  const leave = useCallback(async (groupId: number) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return false;
    try {
      const res = await fetch(`${apiBase}/api/groups/${groupId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, isMember: false, memberCount: Math.max(g.memberCount - 1, 0) } : g,
          ),
        );
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  const create = useCallback(async (payload: {
    name: string;
    description?: string;
    category?: string;
    city?: string;
    state?: string;
    isPrivate?: boolean;
  }) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return null;
    try {
      const res = await fetch(`${apiBase}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json() as { group: Group };
        const newGroup = { ...data.group, isMember: true };
        setGroups((prev) => [newGroup, ...prev]);
        return newGroup;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  return { groups, isLoading, refetch: fetchGroups, join, leave, create };
}

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

export interface ApiConversation {
  id: number;
  title: string;
  participantIds: string[];
  businessId: string | null;
  type: "dm" | "business" | "ai";
  requestStatus: "pending" | "accepted" | null;
  requestedBy: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
}

export interface UserSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  isPrivate: boolean;
}

export function useConversations() {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBase = getApiBase();
      const token = await getToken();
      if (!apiBase || !token) { setConversations([]); setIsLoading(false); return; }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${apiBase}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { conversations: ApiConversation[] };
      setConversations(data.conversations);
    } catch {
      setConversations([]);
      setError("Could not load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(fetch_); }, [fetch_]);

  const createConversation = useCallback(async (title: string, participantId?: string, businessId?: string) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return null;
    try {
      const res = await fetch(`${apiBase}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, participantId, businessId }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { conversation: ApiConversation };
      setConversations((prev) => [data.conversation, ...prev]);
      return data.conversation;
    } catch { return null; }
  }, []);

  const createDM = useCallback(async (participantId: string, participantName: string) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return null;
    try {
      const res = await fetch(`${apiBase}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: participantName, participantId, type: "dm" }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { conversation: ApiConversation };
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === data.conversation.id);
        if (exists) return prev;
        return [data.conversation, ...prev];
      });
      return data.conversation;
    } catch { return null; }
  }, []);

  const acceptRequest = useCallback(async (convId: number) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return false;
    try {
      const res = await fetch(`${apiBase}/api/conversations/${convId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      setConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, requestStatus: "accepted" } : c)
      );
      return true;
    } catch { return false; }
  }, []);

  const declineRequest = useCallback(async (convId: number) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return false;
    try {
      const res = await fetch(`${apiBase}/api/conversations/${convId}/decline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      return true;
    } catch { return false; }
  }, []);

  const searchUsers = useCallback(async (q: string): Promise<UserSearchResult[]> => {
    if (q.trim().length < 2) return [];
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return [];
    try {
      const res = await fetch(`${apiBase}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json() as { users: UserSearchResult[] };
      return data.users;
    } catch { return []; }
  }, []);

  return { conversations, isLoading, error, refetch: fetch_, createConversation, createDM, acceptRequest, declineRequest, searchUsers };
}

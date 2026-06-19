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
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
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
      if (!apiBase || !token) {
        setConversations([]);
        setIsLoading(false);
        return;
      }
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

  useEffect(() => { void fetch_(); }, [fetch_]);

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
    } catch {
      return null;
    }
  }, []);

  return { conversations, isLoading, error, refetch: fetch_, createConversation };
}

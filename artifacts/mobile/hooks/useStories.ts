import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_session_token";
function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}
async function getToken() {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); } catch { return null; }
}

export interface BusinessStory {
  id: string;
  businessId: string;
  authorName: string;
  content: string;
  imageUrl: string | null;
  storyType: string;
  expiresAt: string | null;
  createdAt: string;
}

export function useStories(businessId: string) {
  const [stories, setStories] = useState<BusinessStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    const apiBase = getApiBase();
    if (!apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/stories/${businessId}`);
      if (res.ok) {
        const data = await res.json() as { stories: BusinessStory[] };
        setStories(data.stories);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  return { stories, isLoading, refresh: load };
}

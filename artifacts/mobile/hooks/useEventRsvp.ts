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

export function useEventRsvp(eventId: string) {
  const [isRsvped, setIsRsvped] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const apiBase = getApiBase();
      if (!apiBase || !eventId) return;
      try {
        const token = await getToken();
        const res = await fetch(
          `${apiBase}/api/events/${encodeURIComponent(eventId)}/rsvps`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            count: number;
            isRsvped: boolean;
          };
          setRsvpCount(data.count);
          setIsRsvped(data.isRsvped);
        }
      } catch {}
    }
    load();
  }, [eventId]);

  const toggle = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      if (isRsvped) {
        await fetch(
          `${apiBase}/api/events/${encodeURIComponent(eventId)}/rsvp`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        setIsRsvped(false);
        setRsvpCount((c) => Math.max(0, c - 1));
      } else {
        await fetch(
          `${apiBase}/api/events/${encodeURIComponent(eventId)}/rsvp`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` } },
        );
        setIsRsvped(true);
        setRsvpCount((c) => c + 1);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [eventId, isRsvped]);

  return { isRsvped, rsvpCount, isLoading, toggle };
}

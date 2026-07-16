import * as Notifications from "expo-notifications";
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

interface RsvpOptions {
  eventTitle?: string;
  eventDate?: string;
}

export function useEventRsvp(eventId: string, options?: RsvpOptions) {
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

  const scheduleReminder = useCallback(async (eventTitle?: string, eventDate?: string) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You're going! See you there.",
          body: eventTitle ? `Your RSVP for "${eventTitle}" is confirmed.` : "Your RSVP is confirmed.",
          sound: true,
        },
        trigger: null,
      });

      if (eventDate) {
        const eventDateObj = new Date(eventDate);
        const dayBefore = new Date(eventDateObj);
        dayBefore.setDate(dayBefore.getDate() - 1);
        dayBefore.setHours(9, 0, 0, 0);
        if (dayBefore > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: eventTitle ? `Tomorrow: ${eventTitle}` : "Tomorrow's event",
              body: "Your event is tomorrow — get ready!",
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
          });
        }
      }
    } catch {}
  }, []);

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
        void scheduleReminder(options?.eventTitle, options?.eventDate);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, [eventId, isRsvped, options, scheduleReminder]);

  return { isRsvped, rsvpCount, isLoading, toggle };
}

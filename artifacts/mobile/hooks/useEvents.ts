import { useState, useEffect, useCallback } from "react";
import type { Event } from "@/constants/types";
import { EVENTS } from "@/constants/data";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

function mapApiEvent(e: Record<string, unknown>): Event {
  return {
    id: e.id as string,
    title: e.title as string,
    description: (e.description as string) ?? "",
    date: e.date as string,
    dateShort: e.dateShort as string,
    time: (e.time as string) ?? "",
    location: (e.location as string) ?? "",
    city: e.city as string,
    state: e.state as string,
    category: (e.category as string) ?? "Cultural",
    attendees: (e.attendees as number) ?? 0,
    organizer: (e.organizer as string) ?? "",
    price: (e.price as string) ?? "Free",
    isFree: Boolean(e.isFree),
    latitude: e.latitude != null ? parseFloat(e.latitude as string) : 0,
    longitude: e.longitude != null ? parseFloat(e.longitude as string) : 0,
    featured: Boolean(e.featured),
  };
}

interface UseEventsOptions {
  category?: string;
  search?: string;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { category, search } = options;
  const [events, setEvents] = useState<Event[]>(EVENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiBase = getApiBase();
      if (!apiBase) {
        setEvents(EVENTS);
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (search) params.set("search", search);
      const qs = params.toString();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${apiBase}/api/events${qs ? `?${qs}` : ""}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { events: Record<string, unknown>[] };
      const mapped = data.events.map(mapApiEvent);
      setEvents(mapped.length > 0 ? mapped : EVENTS);
    } catch {
      setEvents(EVENTS);
    } finally {
      setIsLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

export function useEventById(id: string) {
  const staticEvent = EVENTS.find((e) => e.id === id);
  const [event, setEvent] = useState<Event | undefined>(staticEvent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const apiBase = getApiBase();
        if (!apiBase) {
          setEvent(staticEvent);
          setIsLoading(false);
          return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${apiBase}/api/events/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { event: Record<string, unknown> };
        setEvent(mapApiEvent(data.event));
      } catch {
        setEvent(staticEvent);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  return { event, isLoading };
}

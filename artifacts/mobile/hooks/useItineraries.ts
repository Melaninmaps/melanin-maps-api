import { Platform } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

/**
 * Compatibility view for the historic My Trips screen. The canonical lifecycle is
 * now the authenticated private Trips API; `stops` remains empty because stops,
 * providers, flights, hotels, events, documents, reminders, and sharing are not
 * part of this bounded Trip aggregate.
 */
export interface ItineraryStop {
  businessId: string;
  businessName: string;
  category: string;
  address: string;
}

export interface Itinerary {
  id: string;
  name: string;
  destination: string;
  stops: ItineraryStop[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

type ApiTrip = Readonly<{
  id: string;
  title: string;
  destination: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ItineraryEntry = Readonly<{
  id: string;
  dayLabel: string;
  dayOrder: number;
  startTimeLabel: string;
  endTimeLabel: string;
  title: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ItineraryEntryInput = Pick<ItineraryEntry, "dayLabel" | "dayOrder" | "startTimeLabel" | "endTimeLabel" | "title" | "note">;

type ItineraryChanges = Partial<Pick<Itinerary, "name" | "destination" | "notes" | "stops">>;

function toItinerary(trip: ApiTrip): Itinerary {
  return {
    id: trip.id,
    name: trip.title,
    destination: trip.destination,
    notes: trip.note,
    stops: [],
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
}

async function tripRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getMemberApiHeaders();
  return fetch(`${getApiBase()}/api/kinfolk/trips${path}`, {
    ...init,
    // Browser/native each follow their established authentication convention.
    credentials: Platform.OS === "web" ? "include" : undefined,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const payload = await response.json().catch(() => ({})) as { error?: unknown };
  return new Error(typeof payload.error === "string" ? payload.error : fallback);
}

/**
 * Owner-only manual day items. This hook has no AsyncStorage fallback, migration,
 * or cross-feature side effect; ordering is persisted and confirmed on the server.
 */
export function useTripItinerary(tripId: string | null) {
  const [entries, setEntries] = useState<ItineraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);
  const path = tripId ? `/${encodeURIComponent(tripId)}/itinerary` : null;

  const load = useCallback(async () => {
    if (!path) { setEntries([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await tripRequest(path, { cache: "no-store" });
      if (!response.ok) throw await responseError(response, "Private itinerary could not be loaded.");
      const payload = await response.json() as { entries?: ItineraryEntry[] };
      setEntries(Array.isArray(payload.entries) ? payload.entries : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private itinerary could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => { void load(); }, [load]);

  const mutate = useCallback(async (suffix: string, init: RequestInit, fallback: string) => {
    if (!path) throw new Error("Private Trip not found.");
    const response = await tripRequest(`${path}${suffix}`, { ...init, cache: "no-store" });
    if (!response.ok) throw await responseError(response, fallback);
    await load();
  }, [load, path]);

  const createEntry = useCallback(async (input: ItineraryEntryInput, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to save a private itinerary item.");
    await mutate("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, memberConfirmed: true }) }, "Private itinerary item could not be created.");
  }, [mutate]);

  const updateEntry = useCallback(async (entryId: string, input: ItineraryEntryInput, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to update a private itinerary item.");
    await mutate(`/${encodeURIComponent(entryId)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, memberConfirmed: true }) }, "Private itinerary item could not be updated.");
  }, [mutate]);

  const deleteEntry = useCallback(async (entryId: string, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to delete a private itinerary item.");
    await mutate(`/${encodeURIComponent(entryId)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberConfirmed: true }) }, "Private itinerary item could not be deleted.");
  }, [mutate]);

  const reorderEntries = useCallback(async (entryIds: string[], memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to reposition private itinerary items.");
    await mutate("/order", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryIds, memberConfirmed: true }) }, "Private itinerary could not be reordered.");
  }, [mutate]);

  return { entries, isLoading, error, createEntry, updateEntry, deleteEntry, reorderEntries, refresh: load };
}

/**
 * My Trips never reads, writes, deletes, or migrates @melanin_maps_itineraries.
 * Any old AsyncStorage entries stay untouched on that device and are labelled as
 * legacy, non-migrated data by the screen rather than presented as account Trips.
 */
export function useItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tripRequest("");
      if (!response.ok) throw await responseError(response, "Saved Trips could not be loaded.");
      const payload = await response.json() as { trips?: ApiTrip[] };
      setItineraries(Array.isArray(payload.trips) ? payload.trips.map(toItinerary) : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Saved Trips could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createItinerary = useCallback(async (
    name: string,
    notes = "",
    destination = "",
    memberConfirmed = false,
  ): Promise<Itinerary> => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to save a private Trip.");
    const response = await tripRequest("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: name, destination, note: notes, memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Saved Trip could not be created.");
    const payload = await response.json() as { trip?: ApiTrip };
    if (!payload.trip) throw new Error("Saved Trip could not be created.");
    const created = toItinerary(payload.trip);
    setItineraries((current) => [created, ...current]);
    return created;
  }, []);

  const updateItinerary = useCallback(async (id: string, changes: ItineraryChanges, memberConfirmed = false): Promise<Itinerary> => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to update a private Trip.");
    const current = itineraries.find((item) => item.id === id);
    if (!current) throw new Error("Saved Trip not found.");
    // Stops have no server relation in this intentionally bounded aggregate.
    if (changes.stops !== undefined) throw new Error("Trip stops are not part of the private account-backed Trip lifecycle.");
    const response = await tripRequest(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: changes.name ?? current.name,
        destination: changes.destination ?? current.destination,
        note: changes.notes ?? current.notes,
        memberConfirmed: true,
      }),
    });
    if (!response.ok) throw await responseError(response, "Saved Trip could not be updated.");
    const payload = await response.json() as { trip?: ApiTrip };
    if (!payload.trip) throw new Error("Saved Trip could not be updated.");
    const updated = toItinerary(payload.trip);
    setItineraries((items) => items.map((item) => item.id === id ? updated : item));
    return updated;
  }, [itineraries]);

  const deleteItinerary = useCallback(async (id: string, memberConfirmed = false): Promise<void> => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to delete a private Trip.");
    const response = await tripRequest(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Saved Trip could not be deleted.");
    setItineraries((items) => items.filter((item) => item.id !== id));
  }, []);

  const unsupportedStops = useCallback(async (): Promise<never> => {
    throw new Error("Trip stops are not part of the private account-backed Trip lifecycle.");
  }, []);

  return {
    itineraries,
    isLoading,
    error,
    createItinerary,
    updateItinerary,
    deleteItinerary,
    addStop: unsupportedStops,
    removeStop: unsupportedStops,
    refresh: load,
  };
}

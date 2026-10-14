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

import { Platform } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

/**
 * Compatibility view for the historic My Trips screen. The canonical lifecycle is
 * now the authenticated private Trips API; `stops` remains empty because stops,
 * providers, hotels, events, documents, reminders, and sharing are not part of
 * this bounded Trip aggregate. Optional flights are a separate owner-confirmed,
 * non-automatic selected-Trip context.
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

/** Existing Temporary Stay lifecycle metadata only; it deliberately contains no address or provider data. */
export type TripTemporaryStay = Readonly<{
  id: string;
  label: string;
  isActive: true;
  arrivalDate: string;
  departureDate: string;
  expiresAt: string;
  linked: boolean;
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
 * Owner-only, selected-Trip management for an already-saved active Temporary
 * Stay. It neither creates/edits a stay nor sends any address to chat/memory,
 * nearby search, calendar, booking, provider, reminder, sharing, or analytics.
 */
export function useTripTemporaryStays(tripId: string | null) {
  const [stays, setStays] = useState<TripTemporaryStay[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);
  const path = tripId ? `/${encodeURIComponent(tripId)}/temporary-stays` : null;

  const load = useCallback(async () => {
    if (!path) { setStays([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await tripRequest(path, { cache: "no-store" });
      if (!response.ok) throw await responseError(response, "Temporary Stays could not be loaded for this private Trip.");
      const payload = await response.json() as { stays?: TripTemporaryStay[] };
      setStays(Array.isArray(payload.stays) ? payload.stays : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Temporary Stays could not be loaded for this private Trip.");
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => { void load(); }, [load]);

  const linkStay = useCallback(async (stayId: string, memberConfirmed = false) => {
    if (!path) throw new Error("Private Trip not found.");
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to link a Temporary Stay.");
    const response = await tripRequest(path, {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temporaryStayId: stayId, memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Temporary Stay could not be linked to this private Trip.");
    await load();
  }, [load, path]);

  const unlinkStay = useCallback(async (stayId: string, memberConfirmed = false) => {
    if (!path) throw new Error("Private Trip not found.");
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to unlink a Temporary Stay.");
    const response = await tripRequest(`${path}/${encodeURIComponent(stayId)}`, {
      method: "DELETE", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Temporary Stay could not be unlinked from this private Trip.");
    await load();
  }, [load, path]);

  return { stays, isLoading, error, linkStay, unlinkStay, refresh: load };
}

/** A private owner flight context; it is not status tracking, booking, or automatic Kinfolk context. */
export type TripFlight = Readonly<{
  id: string;
  flightNumber: string;
  airline: string;
  departureDate: string;
  origin: string;
  destination: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
}>;

export type TripFlightInput = Pick<TripFlight, "flightNumber" | "airline" | "departureDate" | "origin" | "destination" | "notes">;

/**
 * Selected-Trip flight controls only. The API receives only deliberate member
 * actions and never a PNR, booking reference, exact address, coordinates, or live location.
 */
export function useTripFlights(tripId: string | null) {
  const [flights, setFlights] = useState<TripFlight[]>([]);
  const [availableFlights, setAvailableFlights] = useState<TripFlight[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);
  const path = tripId ? `/${encodeURIComponent(tripId)}/flights` : null;

  const load = useCallback(async () => {
    if (!path) { setFlights([]); setAvailableFlights([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [attachedResponse, availableResponse] = await Promise.all([
        tripRequest(path, { cache: "no-store" }),
        tripRequest(`${path}/available`, { cache: "no-store" }),
      ]);
      if (!attachedResponse.ok) throw await responseError(attachedResponse, "Private flights could not be loaded for this Trip.");
      if (!availableResponse.ok) throw await responseError(availableResponse, "Available private flights could not be loaded.");
      const attached = await attachedResponse.json() as { flights?: TripFlight[] };
      const available = await availableResponse.json() as { flights?: TripFlight[] };
      setFlights(Array.isArray(attached.flights) ? attached.flights : []);
      setAvailableFlights(Array.isArray(available.flights) ? available.flights : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private flights could not be loaded for this Trip.");
    } finally { setIsLoading(false); }
  }, [path]);

  useEffect(() => { void load(); }, [load]);
  const mutate = useCallback(async (suffix: string, init: RequestInit, fallback: string) => {
    if (!path) throw new Error("Private Trip not found.");
    const response = await tripRequest(`${path}${suffix}`, { ...init, cache: "no-store" });
    if (!response.ok) throw await responseError(response, fallback);
    await load();
  }, [load, path]);
  const createFlight = useCallback(async (input: TripFlightInput, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to save a private flight.");
    await mutate("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, memberConfirmed: true }) }, "Private flight could not be saved.");
  }, [mutate]);
  const updateFlight = useCallback(async (id: string, input: TripFlightInput, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to correct a private flight.");
    await mutate(`/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, memberConfirmed: true }) }, "Private flight could not be corrected.");
  }, [mutate]);
  const attachFlight = useCallback(async (id: string, correction: TripFlightInput | undefined, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to attach a private flight.");
    await mutate(`/${encodeURIComponent(id)}/attach`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(correction ? { memberConfirmed: true, flight: correction } : { memberConfirmed: true }) }, "Private flight could not be attached.");
  }, [mutate]);
  const unlinkFlight = useCallback(async (id: string, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to unlink a private flight.");
    await mutate(`/${encodeURIComponent(id)}/attachment`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberConfirmed: true }) }, "Private flight could not be unlinked.");
  }, [mutate]);
  const deleteFlight = useCallback(async (id: string, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to remove a private flight.");
    await mutate(`/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberConfirmed: true }) }, "Private flight could not be removed.");
  }, [mutate]);
  return { flights, availableFlights, isLoading, error, createFlight, updateFlight, attachFlight, unlinkFlight, deleteFlight, refresh: load };
}

export type PrivateAvailabilityBlock = Readonly<{
  id: string;
  label: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  planningOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type PrivateAvailabilityBlockInput = Omit<PrivateAvailabilityBlock, "id" | "createdAt" | "updatedAt">;
type PrivateAvailabilityPreviewInput = Pick<PrivateAvailabilityBlockInput, "startAt" | "endAt" | "timeZone">;
type PrivateAvailabilityPreview = Readonly<{ hasConflict: boolean; conflictCount: number }>;

async function availabilityRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getMemberApiHeaders();
  return fetch(`${getApiBase()}/api/kinfolk/availability-blocks${path}`, {
    ...init,
    credentials: Platform.OS === "web" ? "include" : undefined,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
}

/**
 * Manual owner-only availability controls. This hook has no local persistence,
 * provider connection, external-calendar read/sync, or automatic chat use.
 */
export function usePrivateAvailabilityBlocks() {
  const [blocks, setBlocks] = useState<PrivateAvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const response = await availabilityRequest("", { cache: "no-store" });
      if (!response.ok) throw await responseError(response, "Private availability blocks could not be loaded.");
      const payload = await response.json() as { availabilityBlocks?: PrivateAvailabilityBlock[] };
      setBlocks(Array.isArray(payload.availabilityBlocks) ? payload.availabilityBlocks : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Private availability blocks could not be loaded.");
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createBlock = useCallback(async (input: PrivateAvailabilityBlockInput, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to save a private availability block.");
    const response = await availabilityRequest("", {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Private availability block could not be created.");
    await load();
  }, [load]);

  const updateBlock = useCallback(async (id: string, input: PrivateAvailabilityBlockInput, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to update a private availability block.");
    const response = await availabilityRequest(`/${encodeURIComponent(id)}`, {
      method: "PUT", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Private availability block could not be updated.");
    await load();
  }, [load]);

  const deleteBlock = useCallback(async (id: string, memberConfirmed = false) => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to delete a private availability block.");
    const response = await availabilityRequest(`/${encodeURIComponent(id)}`, {
      method: "DELETE", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Private availability block could not be deleted.");
    await load();
  }, [load]);

  const preview = useCallback(async (input: PrivateAvailabilityPreviewInput, memberConfirmed = false): Promise<PrivateAvailabilityPreview> => {
    if (!memberConfirmed) throw new Error("Explicit confirmation is required to check private availability.");
    const response = await availabilityRequest("/preview", {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, memberConfirmed: true }),
    });
    if (!response.ok) throw await responseError(response, "Private availability preview could not be checked.");
    const result = await response.json() as Partial<PrivateAvailabilityPreview>;
    if (typeof result.hasConflict !== "boolean" || typeof result.conflictCount !== "number") {
      throw new Error("Private availability preview could not be checked.");
    }
    return { hasConflict: result.hasConflict, conflictCount: result.conflictCount };
  }, []);

  return { blocks, isLoading, error, createBlock, updateBlock, deleteBlock, preview, refresh: load };
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

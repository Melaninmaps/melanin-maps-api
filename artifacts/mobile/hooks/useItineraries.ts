import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@melanin_maps_itineraries";

export interface ItineraryStop {
  businessId: string;
  businessName: string;
  category: string;
  address: string;
}

export interface Itinerary {
  id: string;
  name: string;
  stops: ItineraryStop[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

function makeId(): string {
  return `itin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setItineraries(JSON.parse(raw) as Itinerary[]);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback(async (items: Itinerary[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    setItineraries(items);
  }, []);

  const createItinerary = useCallback(async (name: string, notes = ""): Promise<Itinerary> => {
    const now = new Date().toISOString();
    const item: Itinerary = { id: makeId(), name, stops: [], notes, createdAt: now, updatedAt: now };
    const updated = [item, ...itineraries];
    await persist(updated);
    return item;
  }, [itineraries, persist]);

  const updateItinerary = useCallback(async (id: string, changes: Partial<Pick<Itinerary, "name" | "notes" | "stops">>) => {
    const updated = itineraries.map((i) =>
      i.id === id ? { ...i, ...changes, updatedAt: new Date().toISOString() } : i
    );
    await persist(updated);
  }, [itineraries, persist]);

  const deleteItinerary = useCallback(async (id: string) => {
    await persist(itineraries.filter((i) => i.id !== id));
  }, [itineraries, persist]);

  const addStop = useCallback(async (itineraryId: string, stop: ItineraryStop) => {
    const updated = itineraries.map((i) => {
      if (i.id !== itineraryId) return i;
      const alreadyAdded = i.stops.some((s) => s.businessId === stop.businessId);
      if (alreadyAdded) return i;
      return { ...i, stops: [...i.stops, stop], updatedAt: new Date().toISOString() };
    });
    await persist(updated);
  }, [itineraries, persist]);

  const removeStop = useCallback(async (itineraryId: string, businessId: string) => {
    const updated = itineraries.map((i) =>
      i.id !== itineraryId ? i : { ...i, stops: i.stops.filter((s) => s.businessId !== businessId), updatedAt: new Date().toISOString() }
    );
    await persist(updated);
  }, [itineraries, persist]);

  return { itineraries, isLoading, createItinerary, updateItinerary, deleteItinerary, addStop, removeStop, refresh: load };
}

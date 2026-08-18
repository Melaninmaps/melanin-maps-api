import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LocationContext as SharedLocationContext } from "@/shared/discoveryContracts";

type LocationContextValue = {
  location: SharedLocationContext;
  setExplicitLocation(next: Pick<SharedLocationContext, "city" | "stateCode" | "neighborhood">): void;
  requestDeviceLocation(): Promise<void>;
  clearLocation(): void;
};

const EMPTY_LOCATION: SharedLocationContext = {
  city: null, stateCode: null, neighborhood: null,
  latitude: null, longitude: null, source: "none",
};

const Context = createContext<LocationContextValue | null>(null);
const STORAGE_KEY = "mwm.discovery.location.v1";

export function LocationContextProvider({
  children,
  initialLocation = EMPTY_LOCATION,
}: {
  children: ReactNode;
  initialLocation?: SharedLocationContext;
}) {
  const [location, setLocation] = useState<SharedLocationContext>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SharedLocationContext) : initialLocation;
    } catch {
      return initialLocation;
    }
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location)); } catch { /* ignore */ }
  }, [location]);

  const value = useMemo<LocationContextValue>(() => ({
    location,
    setExplicitLocation(next) {
      setLocation({ ...EMPTY_LOCATION, ...next, source: "explicit" });
    },
    async requestDeviceLocation() {
      if (!navigator.geolocation) throw new Error("This browser does not support location services.");
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, timeout: 10_000,
        }),
      );
      // Store coordinates only; the API reverse-geocodes to city/state.
      setLocation({
        ...EMPTY_LOCATION,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: "device",
      });
    },
    clearLocation() { setLocation(EMPTY_LOCATION); },
  }), [location]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDiscoveryLocation(): LocationContextValue {
  const value = useContext(Context);
  if (!value) throw new Error("useDiscoveryLocation must be used inside LocationContextProvider.");
  return value;
}

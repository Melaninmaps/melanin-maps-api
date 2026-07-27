import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@melanin_maps_dismissed_businesses";

export function useDismissedBusinesses() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try { setDismissed(new Set(JSON.parse(val) as string[])); } catch { }
      }
    });
  }, []);

  const dismissBusiness = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isDismissed = useCallback((id: string) => dismissed.has(id), [dismissed]);

  return { isDismissed, dismissBusiness };
}

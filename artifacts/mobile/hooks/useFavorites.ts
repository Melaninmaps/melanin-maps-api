import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@melanin_maps_favorites";

export function useFavorites() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setSavedIds(JSON.parse(data) as string[]);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((ids: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }, []);

  const toggleSave = useCallback(
    (id: string) => {
      setSavedIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, isSaved, toggleSave };
}

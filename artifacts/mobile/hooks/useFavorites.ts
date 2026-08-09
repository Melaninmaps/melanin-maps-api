import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@mapping_with_melanin_favorites";
const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function useFavorites() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const local = await AsyncStorage.getItem(STORAGE_KEY);
        if (local) setSavedIds(JSON.parse(local) as string[]);
      } catch {}

      const token = await getToken();
      const apiBase = getApiBase();
      if (!token || !apiBase) return;

      try {
        const res = await fetch(`${apiBase}/api/saved-places`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { businessIds: string[] };
          setSavedIds(data.businessIds);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.businessIds));
        }
      } catch {}
    }
    load();
  }, []);

  const persist = useCallback((ids: string[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }, []);

  const toggleSave = useCallback(
    async (id: string) => {
      let wasSaved = false;
      setSavedIds((prev) => {
        wasSaved = prev.includes(id);
        const next = wasSaved ? prev.filter((x) => x !== id) : [...prev, id];
        persist(next);
        return next;
      });
      if (wasSaved) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const token = await getToken();
      const apiBase = getApiBase();
      if (!token || !apiBase) return;

      try {
        if (wasSaved) {
          await fetch(`${apiBase}/api/saved-places/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await fetch(`${apiBase}/api/saved-places`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ businessId: id }),
          });
        }
      } catch {}
    },
    [persist],
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, isSaved, toggleSave };
}

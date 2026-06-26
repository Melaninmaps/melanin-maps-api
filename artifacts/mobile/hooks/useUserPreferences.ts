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

export interface UserPreferences {
  userId: string;
  favoriteCategories: string[];
  favoriteCities: string[];
  avoidCategories: string[];
  budgetRange: string;
  tripStyle: string[];
  travelCompanion: string;
  dietaryNotes: string | null;
  communicationStyle: string;
  personalityMode: string;
  emojiLevel: string;
  humorLevel: string;
  culturalInterests: string[];
  knowBeforeYouGo: boolean;
  regionalFlavor: string;
}

const DEFAULT_PREFS: Omit<UserPreferences, "userId"> = {
  favoriteCategories: [],
  favoriteCities: [],
  avoidCategories: [],
  budgetRange: "any",
  tripStyle: [],
  travelCompanion: "solo",
  dietaryNotes: null,
  communicationStyle: "friendly",
  personalityMode: "neighborhood_guide",
  emojiLevel: "some",
  humorLevel: "light",
  culturalInterests: [],
  knowBeforeYouGo: true,
  regionalFlavor: "standard",
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { preferences: UserPreferences };
        setPreferences(data.preferences);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(async (updates: Partial<Omit<UserPreferences, "userId">>): Promise<boolean> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/api/kinfolk/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = (await res.json()) as { preferences: UserPreferences };
        setPreferences(data.preferences);
        return true;
      }
    } catch {}
    return false;
  }, []);

  return { preferences: preferences ?? null, isLoading, load, update, DEFAULT_PREFS };
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

export type SearchType = "business" | "smart" | "topic";

export interface SearchHistoryEntry {
  query: string;
  type: SearchType;
  categories: string[];
  ts: number;
}

const KEY = (type: SearchType) => `@melanin_maps_search_history_${type}`;
const MAX_PER_TYPE = 10;

function getApiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

async function getToken(): Promise<string | null> {
  if ((Platform.OS as string) === "web") return null;
  try {
    const { getItemAsync } = await import("expo-secure-store");
    return await getItemAsync("auth_session_token");
  } catch { return null; }
}

export async function loadHistory(type: SearchType): Promise<SearchHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY(type));
    return raw ? (JSON.parse(raw) as SearchHistoryEntry[]) : [];
  } catch { return []; }
}

export async function saveSearchEntry(
  type: SearchType,
  query: string,
  categories: string[] = [],
): Promise<SearchHistoryEntry[]> {
  const trimmed = query.trim();
  if (!trimmed) return loadHistory(type);

  const existing = await loadHistory(type);
  const deduped = existing.filter(
    (e) => e.query.toLowerCase() !== trimmed.toLowerCase(),
  );
  const entry: SearchHistoryEntry = { query: trimmed, type, categories, ts: Date.now() };
  const updated = [entry, ...deduped].slice(0, MAX_PER_TYPE);
  await AsyncStorage.setItem(KEY(type), JSON.stringify(updated));

  const token = await getToken();
  if (token) {
    fetch(`${getApiBase()}/api/search/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: trimmed, type, categories }),
    }).catch(() => {});
  }

  return updated;
}

export async function clearHistory(type?: SearchType): Promise<void> {
  const types: SearchType[] = type ? [type] : ["business", "smart", "topic"];
  await Promise.all(types.map((t) => AsyncStorage.removeItem(KEY(t))));
}

export function useSearchHistory(type: SearchType) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const local = await loadHistory(type);
      if (cancelled) return;
      setHistory(local);

      const token = await getToken();
      if (token) {
        try {
          const res = await fetch(`${getApiBase()}/api/search/history?type=${type}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok && !cancelled) {
            const data = await res.json() as { history: SearchHistoryEntry[] };
            const merged = mergeHistory(local, data.history);
            setHistory(merged);
            await AsyncStorage.setItem(KEY(type), JSON.stringify(merged));
          }
        } catch { }
      }
      if (!cancelled) setLoaded(true);
    };

    void load();
    return () => { cancelled = true; };
  }, [type]);

  const add = useCallback(async (query: string, categories: string[] = []) => {
    const updated = await saveSearchEntry(type, query, categories);
    setHistory(updated);
  }, [type]);

  const clear = useCallback(async () => {
    await clearHistory(type);
    setHistory([]);
  }, [type]);

  return { history, loaded, add, clear };
}

function mergeHistory(
  local: SearchHistoryEntry[],
  remote: SearchHistoryEntry[],
): SearchHistoryEntry[] {
  const seen = new Set<string>();
  const merged: SearchHistoryEntry[] = [];
  for (const e of [...local, ...remote].sort((a, b) => b.ts - a.ts)) {
    const key = e.query.toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push(e); }
  }
  return merged.slice(0, MAX_PER_TYPE);
}

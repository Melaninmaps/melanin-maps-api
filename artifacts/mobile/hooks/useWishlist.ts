import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

export interface WishlistItem {
  id: string;
  userId: string;
  businessName: string;
  category: string | null;
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  destinationType: string | null;
  description: string | null;
  mustTry: string | null;
  sessionId: string | null;
  notes: string | null;
  createdAt: string;
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { items: WishlistItem[] };
        setItems(data.items);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  const addItem = useCallback(async (item: {
    businessName: string;
    category?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    country?: string | null;
    destinationType?: string | null;
    description?: string | null;
    mustTry?: string | null;
    sessionId?: string | null;
  }): Promise<WishlistItem | null> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return null;
    try {
      const res = await fetch(`${apiBase}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = (await res.json()) as { item: WishlistItem };
        setItems((prev) => [data.item, ...prev]);
        return data.item;
      }
    } catch {}
    return null;
  }, []);

  const removeItem = useCallback(async (id: string): Promise<boolean> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/api/wishlist/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        return true;
      }
    } catch {}
    return false;
  }, []);

  const updateNotes = useCallback(async (id: string, notes: string): Promise<boolean> => {
    const token = await getToken();
    const apiBase = getApiBase();
    if (!token || !apiBase) return false;
    try {
      const res = await fetch(`${apiBase}/api/wishlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, notes } : i));
        return true;
      }
    } catch {}
    return false;
  }, []);

  const isWishlisted = useCallback((businessName: string): string | null => {
    return items.find((i) => i.businessName === businessName)?.id ?? null;
  }, [items]);

  return { items, isLoading, load, addItem, removeItem, updateNotes, isWishlisted };
}

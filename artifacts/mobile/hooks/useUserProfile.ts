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

export interface UserProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile(enabled = true) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!enabled) return;
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { user: UserProfile };
        setProfile(data.user);
      }
    } catch {
      setError("Could not load profile");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: { firstName?: string; lastName?: string; profileImageUrl?: string }) => {
    const apiBase = getApiBase();
    const token = await getToken();
    if (!apiBase || !token) return false;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json() as { user: UserProfile };
        setProfile(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { profile, isLoading, isSaving, error, updateProfile, refetch: fetchProfile };
}

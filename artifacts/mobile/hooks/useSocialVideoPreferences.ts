import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import {
  SOCIAL_VIDEO_PLATFORMS,
  type SocialVideoPlatform,
} from "@workspace/constants";

export const SOCIAL_VIDEO_PREFERENCES_STORAGE_KEY = "@mwm_social_video_platforms_v1";
const allPlatforms = [...SOCIAL_VIDEO_PLATFORMS];
let cached: SocialVideoPlatform[] | null = null;
const listeners = new Set<(value: SocialVideoPlatform[]) => void>();

function apiBase() {
  return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
}

function publish(value: SocialVideoPlatform[]) {
  cached = [...value];
  for (const listener of listeners) listener([...value]);
}

export async function cacheSocialVideoPreferences(value: SocialVideoPlatform[]) {
  await AsyncStorage.setItem(SOCIAL_VIDEO_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
  publish(value);
}

async function load(): Promise<SocialVideoPlatform[]> {
  if (cached) return cached;
  const stored = await AsyncStorage.getItem(SOCIAL_VIDEO_PREFERENCES_STORAGE_KEY).catch(() => null);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as SocialVideoPlatform[];
      if (Array.isArray(parsed)) publish(parsed);
    } catch { /* fall through to server */ }
  }
  try {
    const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
    const response = await fetch(`${apiBase()}/api/users/me/content-preferences`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) {
      const body = await response.json() as { socialVideoPlatforms?: SocialVideoPlatform[] };
      if (Array.isArray(body.socialVideoPlatforms)) {
        await cacheSocialVideoPreferences(body.socialVideoPlatforms);
        return body.socialVideoPlatforms;
      }
    }
  } catch { /* retain local or safe all-platform default */ }
  const value = cached ?? allPlatforms;
  publish(value);
  return value;
}

export function useSocialVideoPreferences() {
  const [platforms, setPlatforms] = useState<SocialVideoPlatform[]>(cached ?? allPlatforms);
  useEffect(() => {
    listeners.add(setPlatforms);
    void load();
    return () => { listeners.delete(setPlatforms); };
  }, []);
  return {
    platforms,
    allows: (platform: SocialVideoPlatform | null) => platform === null || platforms.includes(platform),
  };
}

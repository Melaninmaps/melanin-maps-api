import { useEffect, useState } from "react";
import {
  SOCIAL_VIDEO_PLATFORMS,
  type SocialVideoPlatform,
} from "@workspace/constants";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

const BASE = import.meta.env.BASE_URL;
const allPlatforms = [...SOCIAL_VIDEO_PLATFORMS];
let cachedPlatforms: SocialVideoPlatform[] | null = null;
let loadingPromise: Promise<SocialVideoPlatform[]> | null = null;
const listeners = new Set<(platforms: SocialVideoPlatform[]) => void>();

function notify(platforms: SocialVideoPlatform[]) {
  cachedPlatforms = [...platforms];
  for (const listener of listeners) listener([...platforms]);
}

async function loadPreferences(): Promise<SocialVideoPlatform[]> {
  if (cachedPlatforms) return cachedPlatforms;
  if (!loadingPromise) {
    loadingPromise = authenticatedFetch(`${BASE}api/users/me/content-preferences`)
      .then(async (response) => {
        if (!response.ok) return allPlatforms;
        const body = await response.json() as { socialVideoPlatforms?: SocialVideoPlatform[] };
        return Array.isArray(body.socialVideoPlatforms) ? body.socialVideoPlatforms : allPlatforms;
      })
      .catch(() => allPlatforms)
      .finally(() => { loadingPromise = null; });
  }
  const platforms = await loadingPromise;
  notify(platforms);
  return platforms;
}

export function updateCachedSocialVideoPreferences(platforms: SocialVideoPlatform[]) {
  notify(platforms);
}

export function useSocialVideoPreferences() {
  const [platforms, setPlatforms] = useState<SocialVideoPlatform[]>(cachedPlatforms ?? allPlatforms);

  useEffect(() => {
    listeners.add(setPlatforms);
    void loadPreferences();
    return () => { listeners.delete(setPlatforms); };
  }, []);

  return {
    platforms,
    allows: (platform: SocialVideoPlatform | null) => platform === null || platforms.includes(platform),
  };
}

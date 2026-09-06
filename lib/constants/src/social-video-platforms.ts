/**
 * Supported public social-video providers.
 *
 * This allowlist controls user-submitted video links and member display
 * preferences. A recognized provider does not authorize scraping or private
 * content access; links must already be public and user-supplied.
 */
export const SOCIAL_VIDEO_PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "twitch",
  "snapchat",
  "vimeo",
] as const;

export type SocialVideoPlatform = (typeof SOCIAL_VIDEO_PLATFORMS)[number];

export const SOCIAL_VIDEO_PLATFORM_OPTIONS: ReadonlyArray<{
  id: SocialVideoPlatform;
  label: string;
  helperText: string;
}> = [
  { id: "youtube", label: "YouTube", helperText: "Videos, Shorts, and creator channels" },
  { id: "tiktok", label: "TikTok", helperText: "Public creator videos" },
  { id: "instagram", label: "Instagram", helperText: "Public Reels and posts" },
  { id: "facebook", label: "Facebook", helperText: "Public videos and posts" },
  { id: "twitch", label: "Twitch", helperText: "Public streams, videos, and clips" },
  { id: "snapchat", label: "Snapchat", helperText: "Public Profiles, Stories, and Spotlight links" },
  { id: "vimeo", label: "Vimeo", helperText: "Public hosted videos" },
];

function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLocaleLowerCase().replace(/\.$/, "");
  return host === domain || host.endsWith(`.${domain}`);
}

export function detectSocialVideoPlatform(rawUrl: string): SocialVideoPlatform | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname;
    if (hostMatches(host, "youtube.com") || hostMatches(host, "youtu.be")) return "youtube";
    if (hostMatches(host, "tiktok.com")) return "tiktok";
    if (hostMatches(host, "instagram.com")) return "instagram";
    if (hostMatches(host, "facebook.com") || hostMatches(host, "fb.watch")) return "facebook";
    if (hostMatches(host, "twitch.tv")) return "twitch";
    if (hostMatches(host, "snapchat.com")) return "snapchat";
    if (hostMatches(host, "vimeo.com")) return "vimeo";
    return null;
  } catch {
    return null;
  }
}

export function getSocialVideoPlatformLabel(platform: SocialVideoPlatform): string {
  return SOCIAL_VIDEO_PLATFORM_OPTIONS.find((option) => option.id === platform)?.label ?? platform;
}

export function sanitizeSocialVideoPreferences(value: unknown): SocialVideoPlatform[] | null {
  if (!Array.isArray(value)) return null;
  const allowed = new Set<string>(SOCIAL_VIDEO_PLATFORMS);
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item)))] as SocialVideoPlatform[];
}

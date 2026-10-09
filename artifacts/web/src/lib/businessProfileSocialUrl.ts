export type BusinessSocialPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "twitter"
  | "youtube"
  | "pinterest";

const PLATFORM_BASE_URL: Record<BusinessSocialPlatform, string> = {
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/@",
  facebook: "https://www.facebook.com/",
  twitter: "https://x.com/",
  youtube: "https://www.youtube.com/@",
  pinterest: "https://www.pinterest.com/",
};

const PLATFORM_HOSTS: Record<BusinessSocialPlatform, ReadonlySet<string>> = {
  instagram: new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]),
  tiktok: new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]),
  facebook: new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"]),
  twitter: new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]),
  youtube: new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]),
  pinterest: new Set(["pinterest.com", "www.pinterest.com"]),
};

/**
 * Produces a safe business social-profile URL from either an exact platform URL
 * or a simple handle. Historic canonical profiles can store either form; never
 * concatenate an already-absolute URL into a platform base.
 */
export function normalizeBusinessSocialProfileUrl(
  value: unknown,
  platform: BusinessSocialPlatform,
): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (
        !["https:", "http:"].includes(url.protocol)
        || url.username
        || url.password
        || !PLATFORM_HOSTS[platform].has(url.hostname.toLocaleLowerCase("en-US"))
      ) {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }

  // Reject protocol-like and path-like values instead of turning an uncertain
  // receipt into a misleading outbound destination.
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  const handle = raw.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  if (!handle || !/^[a-z0-9._-]+$/i.test(handle)) return null;

  return `${PLATFORM_BASE_URL[platform]}${encodeURIComponent(handle)}`;
}

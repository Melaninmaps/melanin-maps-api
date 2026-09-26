export type TikTokVideoPreview = {
  thumbnailUrl: string;
  title: string | null;
  authorName: string | null;
};

type TikTokOEmbedResponse = {
  thumbnail_url?: unknown;
  title?: unknown;
  author_name?: unknown;
};

const MAX_TIKTOK_URL_LENGTH = 2_048;
const MAX_TITLE_LENGTH = 220;
const TIKTOK_THUMBNAIL_HOST_SUFFIXES = [
  "tiktokcdn.com",
  "muscdn.com",
];

function hostMatches(hostname: string, suffix: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return normalized === suffix || normalized.endsWith(`.${suffix}`);
}

function isCanonicalTikTokVideoUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.port || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    return host === "www.tiktok.com" && /^\/@[^/]+\/video\/\d+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

function safeTikTokThumbnailUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_TIKTOK_URL_LENGTH) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
    if (!TIKTOK_THUMBNAIL_HOST_SUFFIXES.some((suffix) => hostMatches(url.hostname, suffix))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TITLE_LENGTH) : null;
}

/**
 * Resolves only TikTok's documented public oEmbed metadata for a canonical
 * TikTok video URL. It never fetches a member-supplied host, persists metadata,
 * downloads video/image bytes, or exposes provider data beyond a feed preview.
 */
export async function fetchTikTokVideoPreview(
  rawUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<TikTokVideoPreview | null> {
  if (!isCanonicalTikTokVideoUrl(rawUrl)) return null;

  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(rawUrl)}`;
  const response = await fetcher(endpoint, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return null;

  const body = await response.json() as TikTokOEmbedResponse;
  const thumbnailUrl = safeTikTokThumbnailUrl(body.thumbnail_url);
  if (!thumbnailUrl) return null;

  return {
    thumbnailUrl,
    title: optionalText(body.title),
    authorName: optionalText(body.author_name),
  };
}

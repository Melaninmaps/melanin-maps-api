import { pool } from "@workspace/db";
import { detectSocialVideoPlatform } from "@workspace/constants";

export type OwnedMediaLookup = (userId: string, urls: string[]) => Promise<Set<string>>;

export function normalizeCommunityMediaUrls(value: unknown): string[] {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) {
      const unique = new Set<string>();
      for (const item of current) {
        if (typeof item !== "string") continue;
        const url = item.trim();
        if (url) unique.add(url);
      }
      return Array.from(unique).slice(0, 5);
    }
    if (typeof current !== "string" || !current.trim()) return [];
    try {
      current = JSON.parse(current);
    } catch {
      return [];
    }
  }
  return [];
}

const lookupOwnedReadyMedia: OwnedMediaLookup = async (userId, urls) => {
  if (urls.length === 0) return new Set();
  const result = await pool.query<{ public_url: string }>(
    `SELECT public_url
       FROM media_assets
      WHERE uploader_id = $1
        AND status = 'ready'
        AND public_url = ANY($2::text[])`,
    [userId, urls],
  );
  return new Set(result.rows.map((row) => row.public_url));
};

function isLegacyOwnedCommunityUpload(rawUrl: string, userId: string): boolean {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID?.trim();
  if (!bucketId) return false;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.hostname !== "storage.googleapis.com") return false;
    const expectedPrefix = `/${encodeURIComponent(bucketId)}/community-posts/${encodeURIComponent(userId)}/`;
    return url.pathname.startsWith(expectedPrefix);
  } catch {
    return false;
  }
}

export async function validateCommunityMediaUrls(
  value: unknown,
  userId: string,
  ownedMediaLookup: OwnedMediaLookup = lookupOwnedReadyMedia,
): Promise<{ urls: string[]; rejected: string[] }> {
  const requested = normalizeCommunityMediaUrls(value);
  const candidatesForOwnership = requested.filter((url) => (
    !detectSocialVideoPlatform(url) && !isLegacyOwnedCommunityUpload(url, userId)
  ));
  const ownedMedia = await ownedMediaLookup(userId, candidatesForOwnership);
  const urls = requested.filter((url) => (
    Boolean(detectSocialVideoPlatform(url))
    || isLegacyOwnedCommunityUpload(url, userId)
    || ownedMedia.has(url)
  ));
  const accepted = new Set(urls);
  return { urls, rejected: requested.filter((url) => !accepted.has(url)) };
}

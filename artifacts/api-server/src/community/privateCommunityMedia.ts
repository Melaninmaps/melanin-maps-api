import { pool } from "@workspace/db";

export const PRIVATE_COMMUNITY_MEDIA_REF_PREFIX = "community-private-media:";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim())))
    .filter(Boolean)
    .slice(0, 5);
}

export function normalizePrivateCommunityMediaAssetIds(value: unknown): string[] {
  return normalizeStringList(value).filter((id) => UUID.test(id));
}

export function toPrivateCommunityMediaReference(assetId: string): string {
  return `${PRIVATE_COMMUNITY_MEDIA_REF_PREFIX}${assetId}`;
}

export function privateCommunityMediaAssetIdsFromValue(value: unknown): string[] {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) {
      return normalizePrivateCommunityMediaAssetIds(
        current
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.startsWith(PRIVATE_COMMUNITY_MEDIA_REF_PREFIX)
            ? item.slice(PRIVATE_COMMUNITY_MEDIA_REF_PREFIX.length)
            : ""),
      );
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

export type PrivateCommunityMediaValidation = {
  assetIds: string[];
  rejected: string[];
};

/**
 * Only a ready, owner-controlled, non-public Community asset may be attached to
 * a restricted post. This never accepts a stored public URL as a private asset.
 */
export async function validatePrivateCommunityMediaAssetIds(
  value: unknown,
  userId: string,
): Promise<PrivateCommunityMediaValidation> {
  const requested = normalizePrivateCommunityMediaAssetIds(value);
  if (requested.length === 0) return { assetIds: [], rejected: [] };
  try {
    const result = await pool.query<{ id: string }>(
      `SELECT id::text AS id
         FROM media_assets
        WHERE uploader_id = $1
          AND purpose = 'community_post_private'
          AND status = 'ready'
          AND public_url IS NULL
          AND id = ANY($2::uuid[])`,
      [userId, requested],
    );
    const allowed = new Set(result.rows.map((row) => row.id));
    return {
      assetIds: requested.filter((id) => allowed.has(id)),
      rejected: requested.filter((id) => !allowed.has(id)),
    };
  } catch {
    // An unavailable ownership lookup is never permission to attach private
    // media. The caller returns a generic validation failure without logging a
    // private asset reference.
    return { assetIds: [], rejected: requested };
  }
}

export type PrivateCommunityMediaDescriptor = {
  assetId: string;
  type: "image" | "video";
  url: string;
};

export async function describePrivateCommunityMedia(
  postId: string,
  value: unknown,
): Promise<PrivateCommunityMediaDescriptor[]> {
  const requested = privateCommunityMediaAssetIdsFromValue(value);
  if (requested.length === 0) return [];
  try {
    const result = await pool.query<{ id: string; mime_type: string }>(
      `SELECT id::text AS id, mime_type
         FROM media_assets
        WHERE purpose = 'community_post_private'
          AND status = 'ready'
          AND public_url IS NULL
          AND id = ANY($1::uuid[])`,
      [requested],
    );
    const byId = new Map(result.rows.map((row) => [row.id, row]));
    return requested.flatMap((assetId) => {
      const asset = byId.get(assetId);
      if (!asset) return [];
      return [{
        assetId,
        type: asset.mime_type.startsWith("video/") ? "video" as const : "image" as const,
        // This is an application route, not a storage or signed-provider URL.
        url: `/api/community/posts/${encodeURIComponent(postId)}/private-media/${encodeURIComponent(assetId)}`,
      }];
    });
  } catch {
    return [];
  }
}

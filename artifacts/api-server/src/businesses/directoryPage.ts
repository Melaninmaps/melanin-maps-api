/**
 * Keep public Directory page boundaries stable across the primary route and
 * its operational direct-name fallback. This deliberately mirrors the legacy
 * `/businesses` defaults: an absent, malformed, or zero limit means 200.
 */
export interface DirectoryPage {
  offset: number;
  limit: number;
}

export function normalizeDirectoryPage(
  offsetParam: unknown,
  limitParam: unknown,
): DirectoryPage {
  const offsetInput = typeof offsetParam === "string" ? offsetParam : "0";
  const limitInput = typeof limitParam === "string" ? limitParam : "200";

  return {
    offset: Math.max(0, Number.parseInt(offsetInput, 10) || 0),
    limit: Math.min(200, Math.max(1, Number.parseInt(limitInput, 10) || 200)),
  };
}

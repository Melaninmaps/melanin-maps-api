const ASSET_PATH_RE = /^\/api\/kinfolk\/visual-evidence\/assets\/[A-Za-z0-9_-]{8,128}$/;

/** Rejects provider and third-party image URLs before any React Native Image renders them. */
export function kinfolkVerifiedVisualAssetUrl(assetPath: string, apiBase: string): string | null {
  if (!ASSET_PATH_RE.test(assetPath)) return null;
  const base = apiBase.trim().replace(/\/$/, "");
  return base ? `${base}${assetPath}` : null;
}

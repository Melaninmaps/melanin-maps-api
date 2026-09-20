const PRIVATE_SINGLE_SEGMENT_ROUTES = new Set(["mine", "duplicate-check"]);
const PUBLIC_STATIC_ROUTES = new Set([
  "/businesses",
  "/businesses/categories",
  "/businesses/map-pins",
  "/businesses/mention-search",
]);

export function isPublicBusinessDiscoveryRead(request: { method: string; path: string }): boolean {
  if (request.method !== "GET") return false;
  if (PUBLIC_STATIC_ROUTES.has(request.path)) return true;
  // This endpoint itself filters to approved + public contribution records.
  // Keeping the read public lets an approved community video appear on a
  // public listing without ever exposing pending or rejected submissions.
  if (/^\/businesses\/[^/]+\/contributions$/.test(request.path)) return true;
  const singleRecord = /^\/businesses\/([^/]+)$/.exec(request.path);
  return Boolean(singleRecord) && !PRIVATE_SINGLE_SEGMENT_ROUTES.has(singleRecord![1]);
}

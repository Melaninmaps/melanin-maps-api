/**
 * Normalize the community API's historical mediaUrls shapes.
 *
 * Older responses expose JSON text from PostgreSQL while newer clients and
 * generated contracts may expose an array directly. Invalid entries are
 * discarded so one malformed post cannot crash or blank an entire feed.
 */
export function parseMediaUrls(value: unknown): string[] | undefined {
  let candidate: unknown = value;
  for (let depth = 0; depth < 3 && typeof candidate === "string"; depth += 1) {
    if (!candidate.trim()) return undefined;
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return undefined;
    }
  }

  if (!Array.isArray(candidate)) return undefined;

  const unique = new Set<string>();
  for (const item of candidate) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (url) unique.add(url);
  }
  const urls = Array.from(unique).slice(0, 5);

  return urls.length > 0 ? urls : undefined;
}

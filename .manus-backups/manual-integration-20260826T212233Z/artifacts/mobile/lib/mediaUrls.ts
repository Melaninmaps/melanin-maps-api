/**
 * Normalize the community API's historical mediaUrls shapes.
 *
 * Older responses expose JSON text from PostgreSQL while newer clients and
 * generated contracts may expose an array directly. Invalid entries are
 * discarded so one malformed post cannot crash or blank an entire feed.
 */
export function parseMediaUrls(value: unknown): string[] | undefined {
  let candidate: unknown = value;

  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!Array.isArray(candidate)) return undefined;

  const urls = candidate
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return urls.length > 0 ? urls : undefined;
}

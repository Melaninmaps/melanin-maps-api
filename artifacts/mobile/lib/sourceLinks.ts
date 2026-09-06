export type SafeSourceLink = {
  title: string;
  url: string;
};

export function parseSafeSourceLink(value: unknown): SafeSourceLink | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { title?: unknown; url?: unknown };
  if (typeof candidate.title !== "string" || typeof candidate.url !== "string") return null;
  const title = candidate.title.trim();
  const rawUrl = candidate.url.trim();
  if (!title || !rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return { title, url: url.href };
  } catch {
    return null;
  }
}

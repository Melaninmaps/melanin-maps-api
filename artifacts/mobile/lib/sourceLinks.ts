export type SafeSourceLink = {
  title: string;
  url: string;
};

const NON_PUBLIC_SUFFIXES = [
  ".localhost", ".local", ".internal", ".lan", ".home", ".home.arpa",
  ".corp", ".invalid", ".test", ".example", ".onion",
] as const;

export function safePublicSourceUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password || !hostname.includes(".")) return null;
    if (/^[\d.]+$/.test(hostname) || hostname.includes(":") || hostname === "localhost") return null;
    if (NON_PUBLIC_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function parseSafeSourceLink(value: unknown): SafeSourceLink | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { title?: unknown; url?: unknown };
  if (typeof candidate.title !== "string" || typeof candidate.url !== "string") return null;
  const title = candidate.title.trim();
  const rawUrl = candidate.url.trim();
  if (!title || !rawUrl) return null;

  const url = safePublicSourceUrl(rawUrl);
  return url ? { title, url } : null;
}

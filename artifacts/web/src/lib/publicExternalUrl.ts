const NON_PUBLIC_SUFFIXES = [
  ".localhost", ".local", ".internal", ".lan", ".home", ".home.arpa",
  ".corp", ".invalid", ".test", ".example", ".onion",
] as const;

export function safePublicExternalHref(value: string): string | null {
  try {
    const url = new URL(value);
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

/**
 * URL Safety Validator — What's Happening submission guard
 *
 * Spec §H.1: Reject any URL that resolves to a private network, localhost,
 * metadata endpoint, or unsupported scheme BEFORE any outbound fetch.
 *
 * Returns a structured result so callers never need to catch network errors —
 * all unsafe/unreachable cases return { safe: false, reason }.
 */

import { pool } from "@workspace/db";

// ── Private / reserved CIDR ranges ────────────────────────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^127\./,                         // loopback
  /^10\./,                          // RFC 1918 Class A
  /^172\.(1[6-9]|2\d|3[01])\./,    // RFC 1918 Class B
  /^192\.168\./,                    // RFC 1918 Class C
  /^169\.254\./,                    // link-local / AWS metadata
  /^::1$/,                          // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,              // IPv6 unique local
  /^fd[0-9a-f]{2}:/i,              // IPv6 unique local
  /^0\./,                           // "this" network
  /^100\.(6[4-9]|[7-9]\d|1([01]\d|2[0-7]))\./,  // CGNAT
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
  "169.254.169.254",                // AWS/GCP instance metadata
  "fd00:ec2::254",                  // AWS metadata IPv6
]);

// ── Result type ───────────────────────────────────────────────────────────────

export type UrlSafetyResult =
  | { safe: true;  canonicalUrl: string; finalUrl: string; httpStatus: number; contentHash: string; publisher: string | null }
  | { safe: false; reason: string; canonicalUrl?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPrivateHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) return true;
  // Check if it looks like a raw IP in a private range
  return PRIVATE_IP_PATTERNS.some((r) => r.test(hostname));
}

function extractHostname(urlStr: string): string | null {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return null;
  }
}

// Simple content hash (not cryptographic — used for dedup only)
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content.slice(0, 8192));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

function guessPublisher(finalUrl: string): string | null {
  try {
    const { hostname } = new URL(finalUrl);
    // Strip common prefixes
    return hostname.replace(/^(www\.|m\.|mobile\.)/, "");
  } catch {
    return null;
  }
}

// ── Main validator ────────────────────────────────────────────────────────────

export async function validatePublicUrl(
  rawUrl: string,
  opts: { maxRedirects?: number; timeoutMs?: number; maxBytes?: number } = {},
): Promise<UrlSafetyResult> {
  const { maxRedirects = 3, timeoutMs = 10_000, maxBytes = 524_288 } = opts;

  // 1. Parse and reject non-HTTPS
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "URL is malformed and cannot be parsed." };
  }

  if (parsed.protocol !== "https:") {
    return { safe: false, reason: "Only HTTPS URLs are accepted. HTTP, ftp, and other schemes are rejected." };
  }

  // 2. Pre-fetch hostname check
  if (isPrivateHostname(parsed.hostname)) {
    return { safe: false, reason: `The submitted URL points to a private or reserved host (${parsed.hostname}) and cannot be fetched.` };
  }

  // 3. Fetch with redirect tracking
  const canonicalUrl = parsed.toString();
  let currentUrl = canonicalUrl;
  let redirectCount = 0;
  let lastStatus = 0;
  let finalUrl = canonicalUrl;
  let responseText = "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    while (redirectCount <= maxRedirects) {
      // Pre-check each hop hostname
      const hopHost = extractHostname(currentUrl);
      if (!hopHost || isPrivateHostname(hopHost)) {
        return {
          safe: false,
          reason: `URL redirected to a private or reserved host (${hopHost ?? "unknown"}) after ${redirectCount} redirect(s).`,
          canonicalUrl,
        };
      }

      const resp = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "MappingWithMelanin-SourceChecker/1.0 (+https://mappingwithmelanin.com)",
          Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
      });

      lastStatus = resp.status;

      if (resp.status >= 301 && resp.status <= 308) {
        const location = resp.headers.get("location");
        if (!location) {
          return { safe: false, reason: "URL returned a redirect with no Location header.", canonicalUrl };
        }
        // Resolve relative redirects
        try {
          currentUrl = new URL(location, currentUrl).toString();
        } catch {
          return { safe: false, reason: "URL returned a malformed redirect Location.", canonicalUrl };
        }
        redirectCount++;
        if (redirectCount > maxRedirects) {
          return { safe: false, reason: `URL exceeded ${maxRedirects} redirects and was rejected.`, canonicalUrl };
        }
        continue;
      }

      // Non-redirect: capture body excerpt for hash
      finalUrl = currentUrl;
      if (resp.ok) {
        const reader = resp.body?.getReader();
        if (reader) {
          let bytes = 0;
          const chunks: Uint8Array[] = [];
          while (bytes < maxBytes) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            chunks.push(value);
            bytes += value.length;
          }
          reader.cancel().catch(() => {});
          const joined = new Uint8Array(bytes);
          let offset = 0;
          for (const c of chunks) { joined.set(c, offset); offset += c.length; }
          responseText = new TextDecoder().decode(joined);
        }
      }
      break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      safe: false,
      reason: msg.includes("abort") || msg.includes("timeout")
        ? `URL fetch timed out after ${timeoutMs}ms.`
        : `URL fetch failed: ${msg.slice(0, 120)}`,
      canonicalUrl,
    };
  } finally {
    clearTimeout(timer);
  }

  // 4. Post-redirect private hostname check
  const finalHost = extractHostname(finalUrl);
  if (!finalHost || isPrivateHostname(finalHost)) {
    return {
      safe: false,
      reason: `URL ultimately resolved to a private or reserved host (${finalHost ?? "unknown"}) and was rejected.`,
      canonicalUrl,
    };
  }

  // 5. Require at least a 2xx or 4xx (not a server error we can't verify)
  if (lastStatus === 0) {
    return { safe: false, reason: "URL did not return an HTTP response.", canonicalUrl };
  }
  if (lastStatus >= 500) {
    return { safe: false, reason: `Source server returned ${lastStatus}; cannot verify the URL at this time.`, canonicalUrl };
  }
  if (lastStatus === 404) {
    return { safe: false, reason: "URL returned 404 Not Found.", canonicalUrl };
  }

  const contentHash = await hashContent(responseText);
  const publisher = guessPublisher(finalUrl);

  return { safe: true, canonicalUrl, finalUrl, httpStatus: lastStatus, contentHash, publisher };
}

// ── Dedup check against existing sources ─────────────────────────────────────

export async function findExistingSource(canonicalUrl: string): Promise<string | null> {
  try {
    const res = await pool.query<{ id: string }>(
      `SELECT id FROM happening_sources WHERE canonical_url = $1 LIMIT 1`,
      [canonicalUrl],
    );
    return res.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

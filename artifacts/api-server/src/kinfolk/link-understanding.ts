import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

/**
 * Server-side understanding for a member-supplied public link.
 *
 * This module deliberately does not call a model. A successful summary is an
 * extractive description of HTML fetched from the exact final URL; it is not a
 * verification of the page's claims. Unsafe, unavailable, non-HTML, and
 * unreadable links return no source and no summary.
 */

export type KinfolkLinkKind = "article" | "website" | "social";
export type KinfolkLinkFailureReason =
  | "invalid_url"
  | "unsafe_url"
  | "private_network"
  | "dns_unavailable"
  | "fetch_failed"
  | "timeout"
  | "invalid_redirect"
  | "too_many_redirects"
  | "http_error"
  | "unsupported_content_type"
  | "response_too_large"
  | "no_readable_content";

export type KinfolkLinkSource = Readonly<{
  /** The exact final public URL that was fetched, not an inferred source. */
  url: string;
  host: string;
  title?: string;
  siteName?: string;
  author?: string;
  publishedAt?: string;
}>;

export type KinfolkLinkSummary = Readonly<{
  /** Extracted verbatim or minimally normalized from the fetched HTML. */
  text: string;
  method: "extractive";
  provenance: "fetched_page_content";
  /** Page claims have not been independently corroborated by this module. */
  claimStatus: "unverified_source_claims";
}>;

export type KinfolkLinkUnderstanding =
  | Readonly<{
      state: "fetched";
      linkType: KinfolkLinkKind;
      source: KinfolkLinkSource;
      summary: KinfolkLinkSummary;
      /** Prevents consumers from presenting source assertions as verified facts. */
      claimBoundary: "source_claims_unverified";
    }>
  | Readonly<{
      state: "rejected" | "unavailable";
      reason: KinfolkLinkFailureReason;
      linkType: null;
      source: null;
      summary: null;
      /** No content was fetched; claims about the link must remain unknown. */
      claimBoundary: "unknown_without_fetched_content";
    }>;

export type KinfolkResolvedAddress = Readonly<{
  address: string;
  family: 4 | 6;
}>;

export type KinfolkLinkFetchResponse = Readonly<{
  status: number;
  headers: Readonly<Record<string, string | undefined>>;
  body: string;
}>;

export type KinfolkLinkUnderstandingDependencies = Readonly<{
  /** All answers are checked; a mixed public/private DNS answer is rejected. */
  resolveHostname?: (hostname: string) => Promise<KinfolkResolvedAddress[]>;
  /**
   * Implementations must make one request only and must not automatically
   * follow redirects. The default implementation pins the validated address.
   */
  fetchPage?: (input: Readonly<{
    url: string;
    hostname: string;
    address: KinfolkResolvedAddress;
    timeoutMs: number;
    maxBytes: number;
  }>) => Promise<KinfolkLinkFetchResponse>;
  timeoutMs?: number;
  maxRedirects?: number;
  maxBytes?: number;
}>;

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 256 * 1024;
const CONTROL_OR_WHITESPACE = /[\u0000-\u0020\u007f]/;
const PRIVATE_HOST_SUFFIXES = [
  ".localhost", ".local", ".localdomain", ".internal", ".intranet",
  ".lan", ".home", ".home.arpa", ".corp", ".private", ".invalid",
  ".test", ".example", ".onion",
];
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
]);
const SOCIAL_HOSTS = new Set([
  "facebook.com", "instagram.com", "tiktok.com", "twitter.com", "x.com",
  "threads.net", "linkedin.com", "reddit.com", "youtube.com", "youtu.be",
  "vimeo.com", "bsky.app", "bluesky.app", "pinterest.com", "snapchat.com",
]);

class LinkFetchError extends Error {
  constructor(readonly reason: Extract<KinfolkLinkFailureReason, "fetch_failed" | "timeout" | "response_too_large">) {
    super(reason);
  }
}

type ParsedPublicLink = Readonly<{
  url: string;
  hostname: string;
}>;

function cleanHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.+$/, "");
}

function hasBlockedHostnameSuffix(hostname: string): boolean {
  return BLOCKED_HOSTNAMES.has(hostname) || PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function parsePublicLink(value: string): ParsedPublicLink | null {
  // URL would otherwise silently trim some ASCII controls. Reject them instead
  // so a visibly different input cannot be fetched.
  if (typeof value !== "string" || !value || value.length > 2_048 || CONTROL_OR_WHITESPACE.test(value)) return null;
  const candidate = /^www\./i.test(value) ? `https://${value}` : value;
  try {
    const parsed = new URL(candidate);
    const hostname = cleanHostname(parsed.hostname);
    if (
      parsed.protocol !== "https:"
      || parsed.username
      || parsed.password
      || (parsed.port && parsed.port !== "443")
      || !hostname
      || !hostname.includes(".")
      || isIP(hostname) !== 0
      || hasBlockedHostnameSuffix(hostname)
    ) return null;
    parsed.hostname = hostname;
    parsed.hash = "";
    return { url: parsed.toString(), hostname };
  } catch {
    return null;
  }
}

/**
 * Normalizes a syntactically public HTTPS member link. This does not perform
 * DNS validation; callers that may fetch must use understandKinfolkLink.
 */
export function normalizeKinfolkLinkUrl(value: string): string | null {
  return parsePublicLink(value)?.url ?? null;
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = octets;
  return a === 0
    || a === 10
    || a === 127
    || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 0 || b === 2 || b === 88 || b === 168))
    || (a === 198 && (b === 18 || b === 19 || b === 51))
    || (a === 203 && b === 0 && c === 113);
}

function embeddedIpv4(address: string): string | null {
  // DNS libraries can return either compressed (`::ffff:127.0.0.1`) or
  // fully expanded (`0:0:0:0:0:ffff:127.0.0.1`) IPv4-embedded IPv6 forms.
  const match = address.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/);
  return match?.[1] ?? null;
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  const mapped = embeddedIpv4(normalized);
  if (mapped) return isPrivateIpv4(mapped);
  return normalized === "::"
    || normalized === "::1"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || /^fe[89a-f]/.test(normalized)
    || normalized.startsWith("ff")
    || normalized.startsWith("2001:db8:");
}

/** Exported for focused SSRF regression coverage and other server callers. */
export function isPrivateOrReservedNetworkAddress(address: string): boolean {
  const family = isIP(address.replace(/^\[|\]$/g, ""));
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

async function defaultResolveHostname(hostname: string): Promise<KinfolkResolvedAddress[]> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.flatMap((record) => (
    record.family === 4 || record.family === 6
      ? [{ address: record.address, family: record.family }]
      : []
  ));
}

function firstPinnedPublicAddress(addresses: KinfolkResolvedAddress[]): KinfolkResolvedAddress | null {
  if (addresses.length === 0) return null;
  // Reject on any unsafe answer rather than choosing a favorable address. This
  // prevents round-robin/mixed-answer DNS from becoming a private-network path.
  if (addresses.some((entry) => (
    (entry.family !== 4 && entry.family !== 6)
    || isPrivateOrReservedNetworkAddress(entry.address)
  ))) return null;
  return addresses[0] ?? null;
}

function headerValue(headers: Readonly<Record<string, string | undefined>>, name: string): string | undefined {
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === expected) return value;
  }
  return undefined;
}

async function defaultFetchPage(input: Readonly<{
  url: string;
  hostname: string;
  address: KinfolkResolvedAddress;
  timeoutMs: number;
  maxBytes: number;
}>): Promise<KinfolkLinkFetchResponse> {
  const parsed = new URL(input.url);
  return await new Promise<KinfolkLinkFetchResponse>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };
    const request = httpsRequest({
      protocol: "https:",
      hostname: input.hostname,
      port: parsed.port || 443,
      path: `${parsed.pathname}${parsed.search}`,
      method: "GET",
      agent: false,
      servername: input.hostname,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9",
        "Accept-Encoding": "identity",
        "User-Agent": "KinfolkLinkUnderstanding/1.0",
      },
      // Pin the request to the address that was checked above. https.request
      // would otherwise perform a second DNS lookup after our safety check.
      lookup: (_hostname, _options, callback) => callback(null, input.address.address, input.address.family),
    }, (response) => {
      const headers: Record<string, string | undefined> = {};
      for (const [name, value] of Object.entries(response.headers)) {
        headers[name] = Array.isArray(value) ? value.join(", ") : value;
      }
      const status = response.statusCode ?? 0;
      // Redirect and error responses are not body-parsed. This bounds all
      // reads while keeping each redirect under explicit validation.
      if (status < 200 || status >= 300) {
        response.resume();
        finish(() => resolve({ status, headers, body: "" }));
        return;
      }

      let total = 0;
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > input.maxBytes) {
          response.destroy();
          finish(() => reject(new LinkFetchError("response_too_large")));
          return;
        }
        chunks.push(chunk);
      });
      response.once("error", () => finish(() => reject(new LinkFetchError("fetch_failed"))));
      response.once("end", () => finish(() => resolve({
        status,
        headers,
        body: Buffer.concat(chunks).toString("utf8"),
      })));
    });
    request.setTimeout(input.timeoutMs, () => {
      request.destroy();
      finish(() => reject(new LinkFetchError("timeout")));
    });
    request.once("error", () => finish(() => reject(new LinkFetchError("fetch_failed"))));
    request.end();
  });
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_match, entity: string) => {
      const code = entity.toLowerCase().startsWith("x")
        ? Number.parseInt(entity.slice(1), 16)
        : Number.parseInt(entity, 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
    });
}

function normalizedText(value: string, max: number): string {
  return decodeHtml(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

function attributeValue(tag: string, name: string): string | null {
  const expression = new RegExp(`\\b${name}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(expression);
  return match ? (match[1] ?? match[2] ?? match[3] ?? null) : null;
}

function metaContent(html: string, names: string[]): string | null {
  const expected = new Set(names.map((name) => name.toLowerCase()));
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = attributeValue(tag, "property") ?? attributeValue(tag, "name");
    const content = attributeValue(tag, "content");
    if (key && content && expected.has(key.toLowerCase())) {
      const clean = normalizedText(content, 600);
      if (clean) return clean;
    }
  }
  return null;
}

function tagText(html: string, tagName: string, max: number): string | null {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}\\s*>`, "i"));
  if (!match?.[1]) return null;
  const clean = visibleText(match[1], max);
  return clean || null;
}

function visibleText(html: string, max: number): string {
  return normalizedText(
    html
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<(script|style|noscript|template|svg|iframe|object)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
    max,
  );
}

function extractiveSummary(html: string, description: string | null): string | null {
  // Prefer a fetched page description, then page-visible article/main/body text.
  // No generative paraphrase is used, so the result cannot invent a claim.
  if (description && description.length >= 24) return description.slice(0, 600).trim();
  const article = tagText(html, "article", 1_200)
    ?? tagText(html, "main", 1_200)
    ?? tagText(html, "body", 1_200);
  if (!article) return null;
  const sentences = article.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [article];
  const summary = sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 24)
    .slice(0, 2)
    .join(" ")
    .slice(0, 600)
    .trim();
  return summary.length >= 24 ? summary : null;
}

function socialHostname(hostname: string): boolean {
  const root = hostname.replace(/^(www|m|mobile)\./, "");
  return SOCIAL_HOSTS.has(root);
}

function classifyLink(html: string, hostname: string): KinfolkLinkKind {
  if (socialHostname(hostname)) return "social";
  const ogType = metaContent(html, ["og:type"]);
  const hasArticleSchema = /"@type"\s*:\s*(?:\[\s*)?"(?:article|newsarticle|blogposting)"/i.test(html);
  const hasArticleMarkup = /<article\b/i.test(html);
  return ogType?.toLowerCase() === "article" || hasArticleSchema || hasArticleMarkup
    ? "article"
    : "website";
}

function fetchedResult(url: string, hostname: string, html: string): KinfolkLinkUnderstanding {
  const title = metaContent(html, ["og:title", "twitter:title"]) ?? tagText(html, "title", 240);
  const description = metaContent(html, ["og:description", "description", "twitter:description"]);
  const summaryText = extractiveSummary(html, description);
  if (!summaryText) {
    return unavailable("no_readable_content");
  }
  const source: KinfolkLinkSource = {
    url,
    host: hostname,
    ...(title ? { title } : {}),
    ...(metaContent(html, ["og:site_name"]) ? { siteName: metaContent(html, ["og:site_name"])! } : {}),
    ...(metaContent(html, ["author", "article:author"]) ? { author: metaContent(html, ["author", "article:author"])! } : {}),
    ...(metaContent(html, ["article:published_time", "date", "datepublished"]) ? { publishedAt: metaContent(html, ["article:published_time", "date", "datepublished"])! } : {}),
  };
  return {
    state: "fetched",
    linkType: classifyLink(html, hostname),
    source,
    summary: {
      text: summaryText,
      method: "extractive",
      provenance: "fetched_page_content",
      claimStatus: "unverified_source_claims",
    },
    claimBoundary: "source_claims_unverified",
  };
}

function unavailable(reason: KinfolkLinkFailureReason): KinfolkLinkUnderstanding {
  return {
    state: "unavailable",
    reason,
    linkType: null,
    source: null,
    summary: null,
    claimBoundary: "unknown_without_fetched_content",
  };
}

function rejected(reason: Extract<KinfolkLinkFailureReason, "invalid_url" | "unsafe_url" | "private_network">): KinfolkLinkUnderstanding {
  return {
    state: "rejected",
    reason,
    linkType: null,
    source: null,
    summary: null,
    claimBoundary: "unknown_without_fetched_content",
  };
}

function redirectStatus(status: number): boolean {
  return status >= 301 && status <= 308;
}

/**
 * Fetches one member-supplied public HTTPS link with DNS pinning and explicit
 * redirect checks, then returns an extractive summary of that fetched page.
 * It never follows a redirect automatically and never substitutes another URL.
 */
export async function understandKinfolkLink(
  rawUrl: string,
  dependencies: KinfolkLinkUnderstandingDependencies = {},
): Promise<KinfolkLinkUnderstanding> {
  let current = parsePublicLink(rawUrl);
  if (!current) return rejected(rawUrl.startsWith("http") || rawUrl.startsWith("www.") ? "unsafe_url" : "invalid_url");

  const resolveHostname = dependencies.resolveHostname ?? defaultResolveHostname;
  const fetchPage = dependencies.fetchPage ?? defaultFetchPage;
  const timeoutMs = Math.min(15_000, Math.max(500, dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  const maxRedirects = Math.min(5, Math.max(0, dependencies.maxRedirects ?? DEFAULT_MAX_REDIRECTS));
  const maxBytes = Math.min(512 * 1024, Math.max(1_024, dependencies.maxBytes ?? DEFAULT_MAX_BYTES));

  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    let addresses: KinfolkResolvedAddress[];
    try {
      addresses = await resolveHostname(current.hostname);
    } catch {
      return unavailable("dns_unavailable");
    }
    const address = firstPinnedPublicAddress(addresses);
    if (!address) return rejected("private_network");

    let response: KinfolkLinkFetchResponse;
    try {
      response = await fetchPage({
        url: current.url,
        hostname: current.hostname,
        address,
        timeoutMs,
        maxBytes,
      });
    } catch (error) {
      if (error instanceof LinkFetchError) return unavailable(error.reason);
      return unavailable("fetch_failed");
    }

    if (redirectStatus(response.status)) {
      const location = headerValue(response.headers, "location");
      if (!location) return unavailable("invalid_redirect");
      if (redirects === maxRedirects) return unavailable("too_many_redirects");
      try {
        const next = new URL(location, current.url).toString();
        current = parsePublicLink(next);
      } catch {
        current = null;
      }
      if (!current) return rejected("unsafe_url");
      continue;
    }

    if (response.status < 200 || response.status >= 300) return unavailable("http_error");
    const contentType = headerValue(response.headers, "content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("text/html") && !contentType.startsWith("application/xhtml+xml")) {
      return unavailable("unsupported_content_type");
    }
    return fetchedResult(current.url, current.hostname, response.body);
  }

  return unavailable("too_many_redirects");
}

/** A concise alias for server callers that only need a safe link summary. */
export const summarizeKinfolkLink = understandKinfolkLink;

#!/usr/bin/env node
/**
 * Kinfolk Current website and social presence verifier.
 *
 * This utility is deliberately read-only. It accepts a retained Admin export,
 * performs bounded public HTTP checks, and writes immutable local evidence
 * artifacts plus proposed (never applied) cleanup and delete-review manifests.
 *
 * Usage:
 *   node scripts/src/verify-kinfolk-current-online-presence.mjs \
 *     --input /absolute/path/to/kinfolk-current.csv \
 *     --out docs/directory-operations/kinfolk-current-online-presence-2026-10-15
 *
 * Resume a stopped run by invoking the same command with --resume. No database,
 * production API, browser session, or application record is ever changed.
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve, dirname } from "node:path";
import { resolve4, resolve6 } from "node:dns/promises";
import { fileURLToPath } from "node:url";

export const VERIFIER_VERSION = "kinfolk-current-online-presence-v1";
const DEFAULT_INPUT = "/home/ubuntu/Downloads/mwm-production-kinfolk-current-2026-10-09.csv";
const DEFAULT_OUT = "docs/directory-operations/kinfolk-current-online-presence-2026-10-15";
const DEFAULT_PRIOR_CRAWL = "/home/ubuntu/mwm-official-website-enrichment-2026-10-08/official-presence-crawl-repaired.jsonl";
const TRACKING_PARAMETERS = new Set(["fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid"]);
const SOCIAL_PLATFORM_HOSTS = Object.freeze({
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.watch)$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  twitter: /(^|\.)(twitter\.com|x\.com)$/i,
  youtube: /(^|\.)youtube\.com$/i,
  pinterest: /(^|\.)pinterest\.com$/i,
});
const SOCIAL_COLUMNS = Object.freeze({
  Instagram: "instagram",
  Facebook: "facebook",
  TikTok: "tiktok",
  Twitter: "twitter",
  X: "twitter",
  YouTube: "youtube",
  Youtube: "youtube",
  Pinterest: "pinterest",
});
const PRIVATE_HOST_NAMES = new Set(["localhost", "metadata.google.internal", "metadata", "instance-data"]);
const GENERIC_NAME_TOKENS = new Set([
  "the", "and", "for", "with", "of", "at", "in", "by", "a", "an", "llc", "inc", "incorporated", "corp", "corporation", "co", "company", "ltd", "limited", "pllc", "pc", "pa", "group", "services", "service", "shop", "store", "studio", "salon", "restaurant", "cafe", "bar", "grill", "market", "center", "centre", "house", "club", "official",
]);
const KNOWN_DIRECTORY_OR_MARKETPLACE_HOSTS = /(^|\.)(yelp\.com|yellowpages\.com|google\.com|maps\.google\.com|tripadvisor\.com|mapquest\.com|foursquare\.com|doordash\.com|ubereats\.com|grubhub\.com|opentable\.com|etsy\.com|amazon\.com)$/i;
const PARKED_MARKERS = [
  /domain (?:is )?for sale/i,
  /buy this domain/i,
  /this domain is parked/i,
  /parked free/i,
  /domain parking/i,
  /account suspended/i,
  /website (?:has been )?suspended/i,
  /this site can['’]t be reached/i,
  /this site is temporarily unavailable/i,
  /domain expired/i,
  /has expired and is pending renewal/i,
];
const REMOVED_SOCIAL_MARKERS = [
  /sorry, this page (?:isn['’]t|is not) available/i,
  /page (?:isn['’]t|is not) available/i,
  /content isn['’]t available right now/i,
  /this account doesn['’]t exist/i,
  /couldn['’]t find this account/i,
  /user not found/i,
  /profile not found/i,
  /page not found/i,
];
const SOCIAL_LOGIN_MARKERS = [
  /log in to (?:instagram|facebook|tiktok|x|twitter)/i,
  /sign in to continue/i,
  /create an account or log in/i,
  /accounts\/login/i,
];

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function asPositiveInt(value, fallback, maximum) {
  const numeric = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(numeric) && numeric > 0 ? Math.min(numeric, maximum) : fallback;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function canonicalKey(value) {
  return cleanText(value)
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedCompact(value) {
  return canonicalKey(value).replace(/\s+/g, "");
}

function quoteCsvField(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A small RFC 4180-compatible parser for retained Admin CSV exports. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => cleanText(value)));
}

export function parseAdminExport(text) {
  const rows = parseCsv(text);
  const header = (rows.shift() ?? []).map((value) => cleanText(value).replace(/^\uFEFF/, ""));
  const required = ["Business ID", "Name", "City", "State", "Website"];
  for (const field of required) {
    if (!header.includes(field)) throw new Error(`Admin CSV is missing required column: ${field}`);
  }
  const index = new Map(header.map((field, position) => [field, position]));
  const get = (row, name) => cleanText(row[index.get(name)] ?? "");
  const seen = new Set();
  const records = [];
  for (const row of rows) {
    const id = get(row, "Business ID");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const social = {};
    for (const [column, platform] of Object.entries(SOCIAL_COLUMNS)) {
      if (index.has(column) && get(row, column)) social[platform] = get(row, column);
    }
    records.push({
      id,
      name: get(row, "Name"),
      city: get(row, "City"),
      state: get(row, "State"),
      website: get(row, "Website"),
      social,
      snapshot: Object.fromEntries(header.map((field, position) => [field, cleanText(row[position] ?? "")])),
    });
  }
  return records;
}

export function normalizeHttpUrl(value) {
  const raw = cleanText(value);
  if (!raw) return { ok: false, reason: "missing_url", original: raw, normalized: null };
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw.replace(/^\/\//, "")}`;
  try {
    const url = new URL(candidate);
    if (!/^https?:$/i.test(url.protocol) || url.username || url.password || !url.hostname) {
      return { ok: false, reason: "unsupported_or_unsafe_url", original: raw, normalized: null };
    }
    url.hostname = url.hostname.toLocaleLowerCase("en-US").replace(/\.$/, "");
    url.hash = "";
    for (const [key] of [...url.searchParams]) {
      if (TRACKING_PARAMETERS.has(key.toLocaleLowerCase("en-US")) || key.toLocaleLowerCase("en-US").startsWith("utm_")) {
        url.searchParams.delete(key);
      }
    }
    return { ok: true, reason: null, original: raw, normalized: url.toString() };
  } catch {
    return { ok: false, reason: "malformed_url", original: raw, normalized: null };
  }
}

function isPrivateIpv4(address) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return false;
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0)
    || (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51) || (a === 203 && b === 0);
}

function isPrivateIpv6(address) {
  if (!address.includes(":")) return false;
  const normalized = address.toLocaleLowerCase("en-US");
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd")
    || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")
    || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.")
    || normalized.startsWith("::ffff:169.254.");
}

function hostnameIsIntrinsicallyUnsafe(hostname) {
  const normalized = hostname.toLocaleLowerCase("en-US").replace(/\.$/, "");
  return PRIVATE_HOST_NAMES.has(normalized) || normalized.endsWith(".local") || normalized.endsWith(".internal")
    || isPrivateIpv4(normalized) || isPrivateIpv6(normalized);
}

async function resolvePublicHost(hostname, dnsCache) {
  const normalized = hostname.toLocaleLowerCase("en-US").replace(/\.$/, "");
  if (dnsCache.has(normalized)) return dnsCache.get(normalized);
  const task = (async () => {
    if (hostnameIsIntrinsicallyUnsafe(normalized)) return { state: "unsafe_host", hostname: normalized };
    const [ipv4, ipv6] = await Promise.allSettled([resolve4(normalized), resolve6(normalized)]);
    const addresses = [
      ...(ipv4.status === "fulfilled" ? ipv4.value : []),
      ...(ipv6.status === "fulfilled" ? ipv6.value : []),
    ];
    if (addresses.some((address) => isPrivateIpv4(address) || isPrivateIpv6(address))) {
      return { state: "unsafe_resolution", hostname: normalized };
    }
    if (addresses.length) return { state: "public", hostname: normalized };
    const errors = [ipv4, ipv6].filter((result) => result.status === "rejected").map((result) => result.reason?.code ?? result.reason?.name ?? "dns_error");
    const nxdomain = errors.length > 0 && errors.every((code) => code === "ENOTFOUND" || code === "ENODATA" || code === "ENONAME");
    return { state: nxdomain ? "nxdomain" : "dns_error", hostname: normalized, errorCodes: errors };
  })();
  dnsCache.set(normalized, task);
  return task;
}

async function readLimitedText(response, maxBytes = 120_000) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const portion = value.subarray(0, Math.max(0, maxBytes - received));
      chunks.push(portion);
      received += portion.byteLength;
      if (portion.byteLength < value.byteLength) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}

function extractDocumentEvidence(html) {
  const compact = String(html ?? "").replace(/<!--[\s\S]*?-->/g, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
  const title = cleanText((compact.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|nbsp|quot|#39);/gi, " "));
  const ogTitle = cleanText((compact.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)/i)
    ?? compact.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i)
    ?? [])[1]);
  const h1 = cleanText((compact.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? [])[1]?.replace(/<[^>]+>/g, " "));
  const text = cleanText(compact.replace(/<[^>]+>/g, " ").replace(/&(?:amp|nbsp|quot|#39);/gi, " ")).slice(0, 8_000);
  return { title: title.slice(0, 300), ogTitle: ogTitle.slice(0, 300), h1: h1.slice(0, 300), textSample: text.slice(0, 1_400) };
}

function errorKind(error) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/timeout|abort/i.test(text)) return "timeout";
  if (/certificate|tls|ssl|cert_/i.test(text)) return "tls_error";
  if (/enotfound|nxdomain/i.test(text)) return "dns_error";
  if (/econnrefused|econnreset|network|socket|fetch failed/i.test(text)) return "network_error";
  return "request_error";
}

export async function probePublicUrl(normalizedUrl, { dnsCache, timeoutMs }) {
  const redirectChain = [];
  let current = normalizedUrl;
  for (let step = 0; step < 9; step += 1) {
    const parsed = new URL(current);
    const dns = await resolvePublicHost(parsed.hostname, dnsCache);
    if (dns.state === "unsafe_host" || dns.state === "unsafe_resolution") {
      return { state: "unsafe_blocked", requestedUrl: normalizedUrl, finalUrl: null, redirectChain, checkedAt: new Date().toISOString(), dns };
    }
    if (dns.state === "nxdomain") {
      return { state: "unavailable", reason: "dns_nxdomain", requestedUrl: normalizedUrl, finalUrl: null, redirectChain, checkedAt: new Date().toISOString(), dns };
    }
    if (dns.state !== "public") {
      return { state: "transient", reason: "dns_error", requestedUrl: normalizedUrl, finalUrl: null, redirectChain, checkedAt: new Date().toISOString(), dns };
    }
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; MappingWithMelanin-LinkVerification/1.0; +https://www.mappingwithmelanin.com)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "en-US,en;q=0.8",
        },
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400) {
        if (!location) {
          return { state: "transient", reason: "redirect_without_location", requestedUrl: normalizedUrl, finalUrl: current, redirectChain, httpStatus: response.status, checkedAt: new Date().toISOString() };
        }
        let next;
        try {
          next = new URL(location, current);
        } catch {
          return { state: "transient", reason: "invalid_redirect_location", requestedUrl: normalizedUrl, finalUrl: current, redirectChain, httpStatus: response.status, checkedAt: new Date().toISOString() };
        }
        if (!/^https?:$/i.test(next.protocol)) {
          return { state: "unsafe_blocked", reason: "unsupported_redirect_protocol", requestedUrl: normalizedUrl, finalUrl: current, redirectChain, httpStatus: response.status, checkedAt: new Date().toISOString() };
        }
        redirectChain.push({ status: response.status, from: current, to: next.toString() });
        current = next.toString();
        continue;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (response.status === 404 || response.status === 410) {
        return { state: "unavailable", reason: `http_${response.status}`, requestedUrl: normalizedUrl, finalUrl: current, redirectChain, httpStatus: response.status, contentType, checkedAt: new Date().toISOString() };
      }
      if (response.status === 401 || response.status === 403 || response.status === 429 || response.status >= 500) {
        return { state: "transient", reason: `http_${response.status}`, requestedUrl: normalizedUrl, finalUrl: current, redirectChain, httpStatus: response.status, contentType, checkedAt: new Date().toISOString() };
      }
      if (!response.ok) {
        return { state: "transient", reason: `http_${response.status}`, requestedUrl: normalizedUrl, finalUrl: current, redirectChain, httpStatus: response.status, contentType, checkedAt: new Date().toISOString() };
      }
      const html = /(?:text\/html|application\/xhtml\+xml|text\/plain)/i.test(contentType) ? await readLimitedText(response) : "";
      const document = extractDocumentEvidence(html);
      const markers = PARKED_MARKERS.filter((marker) => marker.test(`${document.title} ${document.ogTitle} ${document.h1} ${document.textSample}`)).map(String);
      return {
        state: markers.length ? "unavailable" : "available",
        reason: markers.length ? "parked_or_suspended" : "http_ok",
        requestedUrl: normalizedUrl,
        finalUrl: current,
        redirectChain,
        httpStatus: response.status,
        contentType,
        checkedAt: new Date().toISOString(),
        document,
        contentSignals: markers.length ? ["parked_or_suspended"] : [],
      };
    } catch (error) {
      const kind = errorKind(error);
      return {
        state: kind === "dns_error" ? "unavailable" : "transient",
        reason: kind,
        requestedUrl: normalizedUrl,
        finalUrl: null,
        redirectChain,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 500) : String(error).slice(0, 500),
      };
    }
  }
  return { state: "transient", reason: "redirect_limit", requestedUrl: normalizedUrl, finalUrl: current, redirectChain, checkedAt: new Date().toISOString() };
}

function needsRetry(probe) {
  return probe.state === "transient" && !["unsafe_blocked", "dns_error"].includes(probe.reason);
}

async function pause(milliseconds) {
  await new Promise((resolvePause) => setTimeout(resolvePause, milliseconds));
}

async function probeWithRetry(normalizedUrl, options) {
  const attempts = [];
  const first = await probePublicUrl(normalizedUrl, options);
  attempts.push(first);
  if (!needsRetry(first)) return { ...first, attempts };
  await pause(options.retryDelayMs);
  const second = await probePublicUrl(normalizedUrl, options);
  attempts.push(second);
  return { ...second, attempts };
}

export function assessIdentity({ businessName, finalUrl, document }) {
  const nameKey = canonicalKey(businessName);
  const nameCompact = normalizedCompact(businessName);
  const titleAndText = [document?.title, document?.ogTitle, document?.h1, document?.textSample].filter(Boolean).join(" ");
  const textKey = canonicalKey(titleAndText);
  const textCompact = normalizedCompact(titleAndText);
  const parsed = finalUrl ? new URL(finalUrl) : null;
  const urlText = parsed ? `${parsed.hostname.replace(/^www\./i, "")} ${decodeURIComponent(parsed.pathname)}` : "";
  const urlKey = canonicalKey(urlText);
  const tokens = [...new Set(nameKey.split(" ").filter((token) => (token.length >= 3 || /^\d{2,}$/.test(token)) && !GENERIC_NAME_TOKENS.has(token)))];
  const textMatches = tokens.filter((token) => textKey.split(" ").includes(token));
  const urlMatches = tokens.filter((token) => urlKey.split(" ").includes(token) || urlKey.includes(token));
  const exactName = nameCompact.length >= 5 && (textCompact.includes(nameCompact) || nameCompact.includes(textCompact));
  // A single short descriptive word in both a URL and a title (for example,
  // "Blue Cafe" versus "Blue Design Studio") is not enough to establish a
  // business identity. A complete normalized name, two text tokens, or a
  // single distinctive five-character name token is required instead.
  const strong = exactName || textMatches.length >= 2 || (textMatches.length >= 1 && urlMatches.length >= 1 && tokens.length >= 2)
    || (tokens.length === 1 && tokens[0].length >= 5 && textMatches.length === 1 && urlMatches.length === 1);
  return {
    status: strong ? "matched" : "unclear",
    method: exactName ? "normalized_name_phrase" : strong ? "combined_name_and_url_tokens" : "insufficient_identity_signals",
    nameTokens: tokens,
    titleOrTextTokenMatches: textMatches,
    urlTokenMatches: urlMatches,
  };
}

export function classifyWebsite({ originalUrl, businessName, probe }) {
  const normalized = normalizeHttpUrl(originalUrl);
  if (!normalized.ok && normalized.reason === "missing_url") {
    return { classification: "MISSING", originalUrl: normalized.original, normalizedUrl: null, reason: "No website is stored." };
  }
  if (!normalized.ok) {
    return { classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: null, reason: `Stored website cannot be safely normalized: ${normalized.reason}.` };
  }
  if (probe.state === "unsafe_blocked") {
    return { classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The stored destination is not safe for automated verification.", probe };
  }
  if (probe.state === "unavailable") {
    return {
      classification: "REMOVE_CONFIRMED_INACTIVE",
      originalUrl: normalized.original,
      normalizedUrl: normalized.normalized,
      reason: probe.reason === "parked_or_suspended" ? "The destination displays a parked, expired, or suspended-domain marker." : `The destination is unavailable (${probe.reason}).`,
      probe,
    };
  }
  if (probe.state !== "available") {
    return { classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: `The website could not be conclusively checked (${probe.reason}).`, probe };
  }
  const finalHost = new URL(probe.finalUrl).hostname.replace(/^www\./i, "");
  if (KNOWN_DIRECTORY_OR_MARKETPLACE_HOSTS.test(finalHost)) {
    return { classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The stored website resolves to a directory or marketplace and is not automatically treated as an official business website.", probe };
  }
  const identity = assessIdentity({ businessName, finalUrl: probe.finalUrl, document: probe.document });
  if (identity.status !== "matched") {
    return { classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The website responded but did not provide enough identity evidence for the stored business.", identity, probe };
  }
  return { classification: "KEEP_ACTIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The website is accessible and its page or URL has matching business identity signals.", identity, probe };
}

function expectedSocialPlatform(url, platform) {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return SOCIAL_PLATFORM_HOSTS[platform]?.test(host) ?? false;
  } catch {
    return false;
  }
}

export function classifySocial({ platform, originalUrl, businessName, probe }) {
  const normalized = normalizeHttpUrl(originalUrl);
  if (!normalized.ok && normalized.reason === "missing_url") return { platform, classification: "MISSING", originalUrl: normalized.original, normalizedUrl: null, reason: "No social profile is stored." };
  if (!normalized.ok || !expectedSocialPlatform(normalized.normalized, platform)) {
    return { platform, classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The stored social URL is malformed or does not match the designated platform." };
  }
  // Social links are not fetched when the same record already has a matching,
  // active website. Preserve that distinction rather than fabricating a social
  // availability result or treating a skipped check as a failure.
  if (!probe) return { platform, classification: "NOT_EVALUATED_ACTIVE_WEBSITE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "Not evaluated because a matching active website already retains this record." };
  if (probe.state === "unsafe_blocked") return { platform, classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The stored social destination is unsafe for automated verification.", probe };
  if (probe.state === "unavailable") return { platform, classification: "INACTIVE_OR_REMOVED", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: `The social profile is unavailable (${probe.reason}).`, probe };
  if (probe.state !== "available") return { platform, classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: `The social profile could not be conclusively checked (${probe.reason}).`, probe };
  const evidenceText = `${probe.finalUrl ?? ""} ${probe.document?.title ?? ""} ${probe.document?.ogTitle ?? ""} ${probe.document?.h1 ?? ""} ${probe.document?.textSample ?? ""}`;
  if (REMOVED_SOCIAL_MARKERS.some((marker) => marker.test(evidenceText))) {
    return { platform, classification: "INACTIVE_OR_REMOVED", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The social platform reports that the profile is unavailable or removed.", probe };
  }
  if (SOCIAL_LOGIN_MARKERS.some((marker) => marker.test(evidenceText))) {
    return { platform, classification: "HOLD_INCONCLUSIVE", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The social platform requires sign-in or blocks public inspection, so availability is inconclusive.", probe };
  }
  const identity = assessIdentity({ businessName, finalUrl: probe.finalUrl, document: probe.document });
  if (identity.status !== "matched") {
    return { platform, classification: "ACTIVE_BUT_IDENTITY_UNCLEAR", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The social profile is publicly accessible but cannot yet be reliably matched to the stored business.", identity, probe };
  }
  return { platform, classification: "KEEP_ACTIVE_SOCIAL", originalUrl: normalized.original, normalizedUrl: normalized.normalized, reason: "The social profile is publicly accessible and has matching business identity signals.", identity, probe };
}

export function classifyBusinessDisposition({ website, socials }) {
  const socialResults = Object.values(socials);
  const socialActive = socialResults.some((result) => result.classification === "KEEP_ACTIVE_SOCIAL");
  const socialUncertain = socialResults.some((result) => ["HOLD_INCONCLUSIVE", "ACTIVE_BUT_IDENTITY_UNCLEAR"].includes(result.classification));
  const socialMissingOrInactive = socialResults.every((result) => ["MISSING", "INACTIVE_OR_REMOVED"].includes(result.classification));
  if (website.classification === "KEEP_ACTIVE") return { disposition: "RETAIN", reason: "A matching active website is retained." };
  if (website.classification === "REMOVE_CONFIRMED_INACTIVE" && socialActive) return { disposition: "RETAIN_SOCIAL_ONLY_WEBSITE_REMOVAL_PROPOSAL", reason: "A confirmed inactive website can be cleared only after a fresh record match; matching official social remains." };
  if (website.classification === "MISSING" && socialActive) return { disposition: "RETAIN_SOCIAL_ONLY", reason: "A matching official social account remains available." };
  if (["REMOVE_CONFIRMED_INACTIVE", "MISSING"].includes(website.classification) && socialMissingOrInactive) return { disposition: "DELETE_REVIEW_PROPOSAL", reason: "Both website and listed social channels are missing or confirmed inactive; this is a reversible review proposal only." };
  if (website.classification === "HOLD_INCONCLUSIVE" || socialUncertain) return { disposition: "HOLD_FOR_REVIEW", reason: "At least one online-presence check is inconclusive or identity-unclear." };
  return { disposition: "HOLD_FOR_REVIEW", reason: "No safe automatic disposition applies." };
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

async function readJson(path, fallback) {
  try { return JSON.parse(await fs.readFile(path, "utf8")); } catch { return fallback; }
}

async function writeJsonAtomic(path, value) {
  await fs.mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporary, path);
}

async function loadPriorCrawl(path) {
  const prior = new Map();
  try {
    const text = await fs.readFile(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const entry = JSON.parse(line);
      for (const id of entry.recordIds ?? []) {
        if (typeof id === "string") prior.set(id, { source: path, checkedAt: entry.checkedAt ?? null, pageCount: Array.isArray(entry.pages) ? entry.pages.length : 0 });
      }
    }
  } catch {
    // Historical evidence is optional; lack of it never changes a classification.
  }
  return prior;
}

async function mapWithConcurrency(values, concurrency, worker, onProgress) {
  let cursor = 0;
  let completed = 0;
  async function runWorker() {
    while (true) {
      const current = cursor;
      cursor += 1;
      if (current >= values.length) return;
      await worker(values[current], current);
      completed += 1;
      if (completed % 25 === 0 || completed === values.length) await onProgress?.(completed, values.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => runWorker()));
}

function uniqueNormalizedLinks(records, selector) {
  const result = new Set();
  for (const record of records) {
    for (const value of selector(record)) {
      const normalized = normalizeHttpUrl(value);
      if (normalized.ok) result.add(normalized.normalized);
    }
  }
  return [...result].sort();
}

function linksForRecord(record) {
  return [record.website];
}

function socialLinksForRecord(record) {
  return Object.values(record.social ?? {});
}

function makeProposedRemoval(row) {
  return {
    businessId: row.businessId,
    businessName: row.businessName,
    city: row.city,
    state: row.state,
    originalWebsite: row.originalLinks.website,
    verifiedOfficialSocial: Object.values(row.social).filter((social) => social.classification === "KEEP_ACTIVE_SOCIAL").map((social) => ({ platform: social.platform, url: social.originalUrl })),
    verification: row.website,
    currentSnapshotHash: row.currentSnapshotHash,
    requiredFreshRecordCheck: true,
    proposedChange: { website: null },
    nonChanges: ["business identity", "ownership designations", "listing status", "Kinfolk eligibility", "map eligibility", "coordinates", "social links"],
  };
}

function makeDeleteReviewProposal(row) {
  return {
    businessId: row.businessId,
    businessName: row.businessName,
    city: row.city,
    state: row.state,
    originalLinks: row.originalLinks,
    websiteVerification: row.website,
    socialVerification: row.social,
    originalSnapshot: {
      listingVisibility: row.sourceSnapshot["Listing visibility"] ?? null,
      KinfolkRecommendationContext: row.sourceSnapshot["Kinfolk recommendation context"] ?? null,
      ownershipDesignation: row.sourceSnapshot["Black-Owned designation"] ?? null,
    },
    requiredFreshRecordCheck: true,
    proposedAction: "KINFOLK_CURRENT_DELETE_REVIEW_ONLY",
    prohibitedAutomaticChanges: ["permanent deletion", "publication status", "Kinfolk eligibility", "map eligibility", "coordinates"],
    restoration: "Restore the retained original record and its recorded online-presence evidence from this manifest; no business identity is deleted by this proposal.",
  };
}

function reportMarkdown({ run, results, outputDirectory }) {
  const websiteCounts = countBy(results, (row) => row.website.classification);
  const socialRows = results.flatMap((row) => Object.values(row.social));
  const socialCounts = countBy(socialRows, "classification");
  const dispositionCounts = countBy(results, (row) => row.disposition.disposition);
  return `# Kinfolk Current Website & Social Verification\n\n**Run:** ${run.runStartedAt}\n\n**Scope:** ${results.length.toLocaleString()} records from a retained Kinfolk Current catalog snapshot. This report is verification evidence and proposal material only. It does not write to production.\n\n| Result | Count |\n|---|---:|\n| Records examined | ${results.length.toLocaleString()} |\n| Websites kept active | ${(websiteCounts.KEEP_ACTIVE ?? 0).toLocaleString()} |\n| Websites confirmed inactive | ${(websiteCounts.REMOVE_CONFIRMED_INACTIVE ?? 0).toLocaleString()} |\n| Websites inconclusive | ${(websiteCounts.HOLD_INCONCLUSIVE ?? 0).toLocaleString()} |\n| Websites missing | ${(websiteCounts.MISSING ?? 0).toLocaleString()} |\n| Active, matched social profiles | ${(socialCounts.KEEP_ACTIVE_SOCIAL ?? 0).toLocaleString()} |\n| Inactive or removed social profiles | ${(socialCounts.INACTIVE_OR_REMOVED ?? 0).toLocaleString()} |\n| Social profiles inconclusive | ${((socialCounts.HOLD_INCONCLUSIVE ?? 0) + (socialCounts.ACTIVE_BUT_IDENTITY_UNCLEAR ?? 0)).toLocaleString()} |\n| Retained by active website | ${(dispositionCounts.RETAIN ?? 0).toLocaleString()} |\n| Retained by social-only evidence | ${((dispositionCounts.RETAIN_SOCIAL_ONLY ?? 0) + (dispositionCounts.RETAIN_SOCIAL_ONLY_WEBSITE_REMOVAL_PROPOSAL ?? 0)).toLocaleString()} |\n| Proposed for reversible Delete Review | ${(dispositionCounts.DELETE_REVIEW_PROPOSAL ?? 0).toLocaleString()} |\n| Held for uncertainty | ${(dispositionCounts.HOLD_FOR_REVIEW ?? 0).toLocaleString()} |\n| Website fields proposed for clearing | ${(dispositionCounts.RETAIN_SOCIAL_ONLY_WEBSITE_REMOVAL_PROPOSAL ?? 0).toLocaleString()} |\n\n## Evidence files\n\n- Per-record evidence: \`${outputDirectory}/presence-verification.jsonl\`\n- Reversible website-clear proposals: \`${outputDirectory}/website-removal-proposals.json\`\n- Reversible Delete Review proposals: \`${outputDirectory}/delete-review-proposals.json\`\n- Machine-readable summary: \`${outputDirectory}/summary.json\`\n\nEvery proposed write requires a fresh production read that confirms the business ID and current website value still match the captured record. No proposal changes listing visibility, Kinfolk eligibility, map eligibility, coordinates, ownership, or social links.\n`;
}

async function main() {
  const inputPath = resolve(argValue("--input", DEFAULT_INPUT));
  const outputDirectory = resolve(argValue("--out", DEFAULT_OUT));
  const resume = hasFlag("--resume");
  const planOnly = hasFlag("--plan");
  const maxRecords = asPositiveInt(argValue("--max-records", "0"), 0, 100_000);
  const concurrency = asPositiveInt(argValue("--concurrency", "8"), 8, 12);
  const timeoutMs = asPositiveInt(argValue("--timeout-ms", "9000"), 9_000, 30_000);
  const retryDelayMs = asPositiveInt(argValue("--retry-delay-ms", "700"), 700, 10_000);
  const priorCrawlPath = resolve(argValue("--prior-crawl", DEFAULT_PRIOR_CRAWL));
  const sourceText = await fs.readFile(inputPath, "utf8");
  const sourceHash = createHash("sha256").update(sourceText).digest("hex");
  const allRecords = parseAdminExport(sourceText);
  const records = maxRecords > 0 ? allRecords.slice(0, maxRecords) : allRecords;
  if (!records.length) throw new Error("No Kinfolk Current records were found in the input export.");
  const inputStat = await fs.stat(inputPath);
  const plan = {
    verifierVersion: VERIFIER_VERSION,
    inputPath,
    inputSha256: sourceHash,
    inputModifiedAt: inputStat.mtime.toISOString(),
    records: records.length,
    allInputRecords: allRecords.length,
    uniqueWebsites: uniqueNormalizedLinks(records, linksForRecord).length,
    uniqueSocialUrls: uniqueNormalizedLinks(records, socialLinksForRecord).length,
    concurrency,
    timeoutMs,
    readOnly: true,
  };
  if (planOnly) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return;
  }

  await fs.mkdir(outputDirectory, { recursive: true });
  const checkpointPath = resolve(outputDirectory, "checkpoint.json");
  const cachePath = resolve(outputDirectory, "url-probe-cache.json");
  const resultPath = resolve(outputDirectory, "presence-verification.jsonl");
  const existingCheckpoint = await readJson(checkpointPath, null);
  if (resume && existingCheckpoint?.inputSha256 && existingCheckpoint.inputSha256 !== sourceHash) {
    throw new Error("Refusing to resume against a different input snapshot. Create a new output directory for changed source data.");
  }
  if (!resume) {
    const exists = await fs.stat(resultPath).then(() => true).catch(() => false);
    if (exists) throw new Error(`Output already contains results: ${resultPath}. Use --resume or choose a new --out directory.`);
  }

  const priorEvidence = await loadPriorCrawl(priorCrawlPath);
  const cached = await readJson(cachePath, { websites: {}, socials: {} });
  const websiteCache = new Map(Object.entries(cached.websites ?? {}));
  const socialCache = new Map(Object.entries(cached.socials ?? {}));
  const dnsCache = new Map();
  const options = { dnsCache, timeoutMs, retryDelayMs };
  const runStartedAt = existingCheckpoint?.runStartedAt ?? new Date().toISOString();
  const websiteUrls = uniqueNormalizedLinks(records, linksForRecord);

  async function persistProgress(phase, completed, total) {
    await writeJsonAtomic(cachePath, { verifierVersion: VERIFIER_VERSION, websites: Object.fromEntries(websiteCache), socials: Object.fromEntries(socialCache) });
    await writeJsonAtomic(checkpointPath, { ...plan, runStartedAt, updatedAt: new Date().toISOString(), phase, completed, total, status: "running" });
    process.stdout.write(`${new Date().toISOString()} ${phase} ${completed}/${total}\n`);
  }

  const missingWebsites = websiteUrls.filter((url) => !websiteCache.has(url));
  await mapWithConcurrency(missingWebsites, concurrency, async (url) => {
    websiteCache.set(url, await probeWithRetry(url, options));
  }, (completed, total) => persistProgress("website_screening", completed, total));
  await persistProgress("website_screening_complete", websiteUrls.length, websiteUrls.length);

  const preliminaryWebsites = new Map();
  for (const record of records) {
    const normalized = normalizeHttpUrl(record.website);
    preliminaryWebsites.set(record.id, classifyWebsite({ originalUrl: record.website, businessName: record.name, probe: normalized.ok ? websiteCache.get(normalized.normalized) : null }));
  }
  const socialTargetRecords = records.filter((record) => preliminaryWebsites.get(record.id)?.classification !== "KEEP_ACTIVE");
  const socialUrls = uniqueNormalizedLinks(socialTargetRecords, socialLinksForRecord);
  const missingSocials = socialUrls.filter((url) => !socialCache.has(url));
  await mapWithConcurrency(missingSocials, Math.min(concurrency, 6), async (url) => {
    socialCache.set(url, await probeWithRetry(url, options));
  }, (completed, total) => persistProgress("social_screening", completed, total));
  await persistProgress("social_screening_complete", socialUrls.length, socialUrls.length);

  const results = records.map((record) => {
    const websiteNormalized = normalizeHttpUrl(record.website);
    const website = classifyWebsite({ originalUrl: record.website, businessName: record.name, probe: websiteNormalized.ok ? websiteCache.get(websiteNormalized.normalized) : null });
    const social = Object.fromEntries(Object.entries(record.social).map(([platform, originalUrl]) => {
      const normalized = normalizeHttpUrl(originalUrl);
      return [platform, classifySocial({ platform, originalUrl, businessName: record.name, probe: normalized.ok ? socialCache.get(normalized.normalized) : null })];
    }));
    const disposition = classifyBusinessDisposition({ website, socials: social });
    const currentSnapshotHash = createHash("sha256").update(JSON.stringify(record.snapshot)).digest("hex");
    return {
      schemaVersion: VERIFIER_VERSION,
      businessId: record.id,
      businessName: record.name,
      city: record.city,
      state: record.state,
      originalLinks: { website: record.website || null, social: record.social },
      sourceSnapshot: record.snapshot,
      currentSnapshotHash,
      priorEvidence: priorEvidence.get(record.id) ?? null,
      website,
      social,
      disposition,
      checkedAt: new Date().toISOString(),
      execution: "read_only_verification_proposal",
    };
  });
  await fs.writeFile(resultPath, `${results.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  const removalProposals = results.filter((row) => row.disposition.disposition === "RETAIN_SOCIAL_ONLY_WEBSITE_REMOVAL_PROPOSAL").map(makeProposedRemoval);
  const deleteReviewProposals = results.filter((row) => row.disposition.disposition === "DELETE_REVIEW_PROPOSAL").map(makeDeleteReviewProposal);
  const websiteCounts = countBy(results, (row) => row.website.classification);
  const socialCounts = countBy(results.flatMap((row) => Object.values(row.social)), "classification");
  const dispositionCounts = countBy(results, (row) => row.disposition.disposition);
  const summary = {
    ...plan,
    runStartedAt,
    completedAt: new Date().toISOString(),
    priorEvidenceRecordsMatched: results.filter((row) => row.priorEvidence).length,
    websiteCounts,
    socialCounts,
    dispositionCounts,
    websiteRemovalProposals: removalProposals.length,
    deleteReviewProposals: deleteReviewProposals.length,
    execution: "READ_ONLY; no production records, eligibility, visibility, map pins, ownership labels, or credentials were changed.",
  };
  await writeJsonAtomic(resolve(outputDirectory, "website-removal-proposals.json"), removalProposals);
  await writeJsonAtomic(resolve(outputDirectory, "delete-review-proposals.json"), deleteReviewProposals);
  await writeJsonAtomic(resolve(outputDirectory, "summary.json"), summary);
  await fs.writeFile(resolve(outputDirectory, "REPORT.md"), reportMarkdown({ run: summary, results, outputDirectory }), "utf8");
  await writeJsonAtomic(checkpointPath, { ...summary, phase: "complete", status: "complete" });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  });
}

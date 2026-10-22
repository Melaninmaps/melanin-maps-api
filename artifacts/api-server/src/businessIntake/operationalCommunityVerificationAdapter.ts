import { createHash } from "node:crypto";
import { lookup as systemDnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import {
  getPlaceDetails,
  searchPlaces,
  type PlaceDetails,
  type PlaceSearchResult,
} from "../lib/googlePlacesEnrichment";
import {
  sourceOnlyCommunityVerificationEvidence,
  type CommunityVerificationEvidence,
  type CommunityVerificationEvidenceResolver,
  type CommunityVerificationSubject,
  type RetainedVerificationSourceReference,
} from "./communityVerificationDecision";

/**
 * Operational evidence is intentionally narrow. Google Places establishes the
 * independently observed business record and canonical website; the server then
 * observes only that canonical HTTPS website for an explicit ownership statement.
 * A member-provided website or supporting URL is never fetched here or treated as
 * proof. Missing credentials, ambiguous results, redirects, stale results, and
 * unsafe destinations fail closed into the private verification queue.
 */
export const OPERATIONAL_COMMUNITY_EVIDENCE_POLICY_VERSION =
  "community-business-operational-evidence-v1" as const;
export const OPERATIONAL_EVIDENCE_REVALIDATION_DAYS = 30;

const MAX_OFFICIAL_PAGE_BYTES = 256 * 1024;
const PRIVATE_HOST_SUFFIXES = [
  ".localhost", ".local", ".internal", ".home", ".lan", ".corp",
  ".invalid", ".test", ".example", ".onion",
] as const;
const BUSINESS_NAME_NEUTRAL_TOKENS = new Set([
  "a", "an", "the", "llc", "inc", "incorporated", "ltd", "limited",
  "corp", "corporation", "co", "company", "pllc", "llp", "lp",
]);

const OWNERSHIP_PHRASES: Readonly<Record<string, readonly string[]>> = {
  "Black / African American-Owned": ["black owned", "black-owned", "african american owned", "african-american owned"],
  "Latino / Hispanic-Owned": ["latino owned", "latino-owned", "latina owned", "latina-owned", "latinx owned", "latinx-owned", "hispanic owned", "hispanic-owned"],
  "Ethiopian-Owned": ["ethiopian owned", "ethiopian-owned"],
  "Caribbean / West Indian-Owned": ["caribbean owned", "caribbean-owned", "west indian owned", "west-indian owned"],
  "Brazilian-Owned": ["brazilian owned", "brazilian-owned"],
  "Woman-Owned": ["woman owned", "woman-owned", "women owned", "women-owned"],
  "LGBTQIA+-Owned": ["lgbtq owned", "lgbtq-owned", "lgbtqia owned", "lgbtqia-owned", "queer owned", "queer-owned"],
  "Minority-Owned (general / legacy)": ["minority owned", "minority-owned"],
  "Indigenous / Native-Owned": ["indigenous owned", "indigenous-owned", "native owned", "native-owned"],
  "Asian American-Owned": ["asian owned", "asian-owned", "asian american owned", "asian-american owned"],
  "African-Owned": ["african owned", "african-owned"],
  "Immigrant-Owned": ["immigrant owned", "immigrant-owned"],
  "Veteran-Owned": ["veteran owned", "veteran-owned"],
  "Family-Owned": ["family owned", "family-owned"],
};

export interface OfficialWebsiteObservation {
  sourceUrl: string;
  observedAt: string;
  sourceSnapshotSha256: string;
  ownershipDesignations: readonly string[];
}

export interface PublicDnsAddress {
  address: string;
  family: 4 | 6;
}

export type PublicDnsLookup = (hostname: string) => Promise<readonly PublicDnsAddress[]>;

export interface OperationalCommunityVerificationAdapterOptions {
  places?: Readonly<{
    search(query: string): Promise<PlaceSearchResult | null>;
    details(placeId: string): Promise<PlaceDetails | null>;
  }>;
  observeOfficialWebsite?: (
    sourceUrl: string,
    expectedBusinessName: string,
  ) => Promise<OfficialWebsiteObservation | null>;
  now?: () => Date;
}

function normalized(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hostnameFromUrl(value: string): string | null {
  try {
    return new URL(value).hostname.toLocaleLowerCase("en-US").replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return null;
  }
}

function safeCanonicalWebsiteUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLocaleLowerCase("en-US").replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    url.protocol !== "https:"
    || (url.port && url.port !== "443")
    || url.username
    || url.password
    || !host.includes(".")
    || host === "localhost"
    || PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
    || isIP(host) !== 0
  ) return null;
  url.hash = "";
  return url.toString();
}

/** Returns false for loopback, private, link-local, CGNAT, test, multicast, and reserved addresses. */
export function isPublicInternetAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0
      || a === 10
      || a === 127
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 0 || b === 168))
      || (a === 198 && (b === 18 || b === 19 || b === 51))
      || (a === 203 && b === 0 && c === 113)
      || a >= 224
    );
  }
  if (family === 6) {
    const normalizedAddress = address.toLocaleLowerCase("en-US");
    return !(
      normalizedAddress === "::"
      || normalizedAddress === "::1"
      || normalizedAddress.startsWith("::ffff:")
      || normalizedAddress.startsWith("fc")
      || normalizedAddress.startsWith("fd")
      || /^fe[89ab]/.test(normalizedAddress)
      || normalizedAddress.startsWith("ff")
      || normalizedAddress.startsWith("2001:db8:")
    );
  }
  return false;
}

async function defaultPublicDnsLookup(hostname: string): Promise<readonly PublicDnsAddress[]> {
  const records = await systemDnsLookup(hostname, { all: true, verbatim: true });
  return records.map((record) => ({
    address: record.address,
    family: record.family === 6 ? 6 : 4,
  }));
}

/**
 * Resolve every DNS answer before a request and reject the whole host if any
 * answer is unsafe. The selected address is later pinned into https.request's
 * lookup callback, preventing a subsequent DNS-rebinding lookup on connection.
 */
export async function resolvePinnedPublicHttpsAddress(
  hostname: string,
  lookup: PublicDnsLookup = defaultPublicDnsLookup,
): Promise<PublicDnsAddress | null> {
  try {
    const records = await lookup(hostname);
    if (!records.length || records.some((record) => !isPublicInternetAddress(record.address))) return null;
    return records[0] ?? null;
  } catch {
    return null;
  }
}

function businessNameTokens(value: string): string[] {
  return normalized(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !BUSINESS_NAME_NEUTRAL_TOKENS.has(token));
}

function strongNameMatch(expected: string, observed: string): boolean {
  const left = businessNameTokens(expected);
  const right = businessNameTokens(observed);
  return left.length >= 2
    && right.length >= 2
    && left.length === right.length
    && left.every((token, index) => token === right[index]);
}

function textMentionsBusinessName(expected: string, text: string): boolean {
  const expectedName = normalized(expected);
  return expectedName.length >= 4 && normalized(text).includes(expectedName);
}

function addressMatchesSubject(subject: CommunityVerificationSubject, formattedAddress: string): boolean {
  const address = normalized(formattedAddress);
  const city = normalized(subject.city);
  const submittedStreet = normalized(subject.address).split(" ").filter(Boolean);
  const streetNumber = submittedStreet.find((token) => /^\d+[a-z]*$/.test(token));
  const streetTerms = submittedStreet.filter((token) => token.length >= 3 && token !== streetNumber);
  return Boolean(
    address
    && city
    && address.includes(city)
    && streetNumber
    && address.includes(streetNumber)
    && streetTerms.length > 0
    && streetTerms.every((token) => address.includes(token)),
  );
}

function publicGooglePlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

function hashSnapshot(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function afterRevalidationWindow(observedAt: string): string {
  const date = new Date(observedAt);
  date.setUTCDate(date.getUTCDate() + OPERATIONAL_EVIDENCE_REVALIDATION_DAYS);
  return date.toISOString();
}

function sourceReference(
  check: RetainedVerificationSourceReference["check"],
  sourceUrl: string,
  sourceLabel: string,
  observedAt: string,
  sourceSnapshotSha256: string,
): RetainedVerificationSourceReference {
  return {
    check,
    sourceUrl,
    sourceLabel,
    observedAt,
    sourceSnapshotSha256,
    revalidateAfter: afterRevalidationWindow(observedAt),
  };
}

function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|#39);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function boundedPageText(response: Response): Promise<string | null> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_OFFICIAL_PAGE_BYTES) return null;
  if (!response.body) {
    const text = await response.text();
    return Buffer.byteLength(text, "utf8") <= MAX_OFFICIAL_PAGE_BYTES ? text : null;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_OFFICIAL_PAGE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function pageTextViaFetchForTestOnly(safeUrl: string, fetchImpl: typeof fetch): Promise<string | null> {
  const response = await fetchImpl(safeUrl, {
    method: "GET",
    redirect: "manual",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "MappingWithMelaninVerification/1.0",
    },
    signal: AbortSignal.timeout(6_000),
  });
  const contentType = response.headers.get("content-type")?.toLocaleLowerCase("en-US") ?? "";
  if (!response.ok || response.status >= 300 || !contentType.includes("text/html")) return null;
  return boundedPageText(response);
}

async function pageTextViaPinnedHttps(
  safeUrl: string,
  lookup: PublicDnsLookup,
): Promise<string | null> {
  const url = new URL(safeUrl);
  const pinnedAddress = await resolvePinnedPublicHttpsAddress(url.hostname, lookup);
  if (!pinnedAddress) return null;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const request = httpsRequest(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "MappingWithMelaninVerification/1.0",
      },
      lookup: (_hostname, _options, callback) => callback(null, pinnedAddress.address, pinnedAddress.family),
    }, (response) => {
      const contentType = String(response.headers["content-type"] ?? "").toLocaleLowerCase("en-US");
      const declaredLength = Number(response.headers["content-length"]);
      if (
        response.statusCode !== 200
        || !contentType.includes("text/html")
        || (Number.isFinite(declaredLength) && declaredLength > MAX_OFFICIAL_PAGE_BYTES)
      ) {
        response.resume();
        finish(null);
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.byteLength;
        if (size > MAX_OFFICIAL_PAGE_BYTES) {
          response.destroy();
          finish(null);
          return;
        }
        chunks.push(chunk);
      });
      response.once("end", () => finish(Buffer.concat(chunks).toString("utf8")));
      response.once("error", () => finish(null));
    });
    request.once("error", () => finish(null));
    request.setTimeout(6_000, () => request.destroy(new Error("official website request timed out")));
    request.end();
  });
}

function detectedOwnershipDesignations(text: string): string[] {
  const haystack = normalized(text);
  return Object.entries(OWNERSHIP_PHRASES)
    .filter(([, phrases]) => phrases.some((phrase) => haystack.includes(normalized(phrase))))
    .map(([designation]) => designation);
}

/**
 * Performs a bounded observation of a canonical official site returned by
 * Google Places. Production requests use a DNS-pinned HTTPS connection: every
 * DNS answer must be public, the resolved address is passed directly into the
 * connection lookup, redirects are refused, and no HTML is retained. The test
 * fetch hook exists only for deterministic transport tests; routes never pass it.
 */
export async function observeGoogleCanonicalWebsite(
  sourceUrl: string,
  expectedBusinessName: string,
  options: Readonly<{
    fetchForTestOnly?: typeof fetch;
    lookupForTestOnly?: PublicDnsLookup;
    now?: () => Date;
  }> = {},
): Promise<OfficialWebsiteObservation | null> {
  const safeUrl = safeCanonicalWebsiteUrl(sourceUrl);
  if (!safeUrl) return null;
  try {
    const html = options.fetchForTestOnly
      ? await pageTextViaFetchForTestOnly(safeUrl, options.fetchForTestOnly)
      : await pageTextViaPinnedHttps(safeUrl, options.lookupForTestOnly ?? defaultPublicDnsLookup);
    if (!html || !textMentionsBusinessName(expectedBusinessName, html)) return null;
    const observedAt = (options.now ?? (() => new Date()))().toISOString();
    return {
      sourceUrl: safeUrl,
      observedAt,
      sourceSnapshotSha256: hashSnapshot(visibleText(html)),
      ownershipDesignations: detectedOwnershipDesignations(html),
    };
  } catch {
    return null;
  }
}

function websiteHostsMatch(submitted: string | null | undefined, canonical: string): boolean {
  if (!submitted?.trim()) return true;
  const submittedHost = hostnameFromUrl(submitted);
  const canonicalHost = hostnameFromUrl(canonical);
  return Boolean(submittedHost && canonicalHost && submittedHost === canonicalHost);
}

function canonicalObservationIsBound(
  observation: OfficialWebsiteObservation,
  canonicalWebsite: string,
): boolean {
  const observedHost = hostnameFromUrl(observation.sourceUrl);
  const canonicalHost = hostnameFromUrl(canonicalWebsite);
  return Boolean(observedHost && canonicalHost && observedHost === canonicalHost);
}

function buildQuery(subject: CommunityVerificationSubject): string {
  return [subject.name, subject.address, subject.city, subject.state, subject.country]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(", ");
}

/**
 * Resolves current operational evidence at the point of publication. Every new
 * publication, correction, and founder publication attempt invokes this resolver
 * afresh; its retained references request revalidation after 30 days. No raw
 * page body, submitted member URL, account data, or provider credential is kept.
 */
export function createOperationalCommunityVerificationEvidenceResolver(
  options: OperationalCommunityVerificationAdapterOptions = {},
): CommunityVerificationEvidenceResolver {
  const places = options.places ?? { search: searchPlaces, details: getPlaceDetails };
  const now = options.now ?? (() => new Date());
  const observeOfficialWebsite = options.observeOfficialWebsite
    ?? ((sourceUrl: string, expectedBusinessName: string) => observeGoogleCanonicalWebsite(sourceUrl, expectedBusinessName, { now }));

  return async (subject): Promise<CommunityVerificationEvidence> => {
    const base = sourceOnlyCommunityVerificationEvidence();
    // Duplicate detection has already run immediately before this resolver in all
    // submission paths. Treat it as a satisfied server check, never a member claim.
    const evidence: CommunityVerificationEvidence = {
      ...base,
      duplicateRisk: "verified",
    };

    let search: PlaceSearchResult | null;
    try {
      search = await places.search(buildQuery(subject));
    } catch {
      return evidence;
    }
    if (
      !search
      || search.candidateCount !== 1
      || !strongNameMatch(subject.name, search.name)
      || !addressMatchesSubject(subject, search.formattedAddress)
    ) {
      return search ? { ...evidence, businessExistence: "failed", officialIdentity: "failed", crossFieldConsistency: "failed" } : evidence;
    }

    let details: PlaceDetails | null;
    try {
      details = await places.details(search.placeId);
    } catch {
      return evidence;
    }
    if (!details || !strongNameMatch(subject.name, details.name) || !addressMatchesSubject(subject, details.formattedAddress)) {
      return { ...evidence, businessExistence: "failed", officialIdentity: "failed", crossFieldConsistency: "failed" };
    }

    const observedAt = now().toISOString();
    const placeSource = publicGooglePlaceUrl(search.placeId);
    const placeSnapshot = hashSnapshot({
      placeId: search.placeId,
      name: details.name,
      formattedAddress: details.formattedAddress,
      businessStatus: details.businessStatus,
      website: details.website ?? null,
      lat: details.lat,
      lng: details.lng,
    });
    const sourceReferences: RetainedVerificationSourceReference[] = [
      sourceReference("business_existence", placeSource, "Google Places operational record", observedAt, placeSnapshot),
      sourceReference("operating_status", placeSource, "Google Places operational record", observedAt, placeSnapshot),
    ];
    evidence.businessExistence = "verified";
    evidence.operatingStatus = details.businessStatus === "OPERATIONAL"
      ? "verified"
      : ["CLOSED_PERMANENTLY", "CLOSED_TEMPORARILY"].includes(details.businessStatus)
        ? "failed"
        : "missing";

    const canonicalWebsite = safeCanonicalWebsiteUrl(details.website);
    if (!canonicalWebsite) return { ...evidence, sourceReferences };
    const websiteObservation = await observeOfficialWebsite(canonicalWebsite, subject.name);
    if (!websiteObservation || !canonicalObservationIsBound(websiteObservation, canonicalWebsite)) {
      return { ...evidence, sourceReferences };
    }

    sourceReferences.push(
      sourceReference(
        "official_identity",
        websiteObservation.sourceUrl,
        "Google-canonical official website observed by MWM",
        websiteObservation.observedAt,
        websiteObservation.sourceSnapshotSha256,
      ),
    );
    evidence.officialIdentity = "verified";
    evidence.crossFieldConsistency = websiteHostsMatch(subject.website, canonicalWebsite) ? "verified" : "failed";

    const submittedDesignations = new Set(subject.ownershipDesignations);
    const alignedOwnership = websiteObservation.ownershipDesignations
      .filter((designation) => submittedDesignations.has(designation));
    if (subject.communityReportedOwnership !== "minority_owned") {
      evidence.minorityOwnership = "failed";
    } else if (alignedOwnership.length > 0) {
      evidence.minorityOwnership = "verified";
      sourceReferences.push(
        sourceReference(
          "minority_ownership",
          websiteObservation.sourceUrl,
          "Explicit ownership statement on Google-canonical official website",
          websiteObservation.observedAt,
          websiteObservation.sourceSnapshotSha256,
        ),
      );
    }

    return { ...evidence, sourceReferences };
  };
}

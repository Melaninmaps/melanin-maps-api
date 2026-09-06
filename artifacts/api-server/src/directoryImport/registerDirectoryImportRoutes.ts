import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { Express, Request, Response } from "express";
import { getBusinessExperiencePolicy } from "@workspace/constants";
import { isBlackOwned as hasBlackOwnedDesignation, pool } from "@workspace/db";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { dedupeKey, normalizeText } from "../lib/business-dedup";
import { isAdmin } from "../lib/adminAuth";

type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
};

interface TransactionPool extends Queryable {
  connect(): Promise<PoolClient>;
}

export interface DirectoryImportRouteDependencies {
  transactionPool?: TransactionPool;
  geocode?: typeof geocodeDirectoryCandidate;
  locationSigningSecret?: string;
  validateEvidenceUrl?: typeof validateDirectoryEvidenceUrl;
}

type CandidateStatus = "pending_review" | "needs_research" | "declined" | "approved" | "published";
type CandidateTargetKind = "business" | "community_resource" | "regulated_review" | "manual_review" | "internal_only";
type DecisionAction = "publish" | "link_existing" | "needs_research" | "decline";
type PublishedRecordType = "business" | "resource";
type ResourceCategory = "essential_support" | "education" | "jobs" | "business" | "housing" | "safety_rights";
type ResourceSourceTier = "official" | "verified_org" | "community_confirmed" | "community_shared";

type JsonObject = Record<string, unknown>;

export interface DirectoryImportCandidate {
  id: string;
  batch_id: string;
  source_row: number;
  target_kind: CandidateTargetKind;
  status: CandidateStatus;
  dedupe_key: string;
  name: string;
  city: string;
  state: string;
  category: string;
  subcategory: string | null;
  cultural_specialty: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  source_url: string | null;
  source_name: string | null;
  source_status: string | null;
  ownership_designations: string[];
  ownership_evidence: string | null;
  regulated_profession: boolean;
  public_display_recommendation: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  social_source_url: string | null;
  price_range: string | null;
  price_basis: string | null;
  suggested_experience_keys: JsonObject;
  link_validation: JsonObject;
  notes: string | null;
  raw_record: JsonObject;
  matched_business_id: string | null;
  published_record_type: PublishedRecordType | null;
  published_record_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  review_evidence: JsonObject;
  review_revision: number;
  created_at: string;
  updated_at: string;
}

interface RegulatedEvidence {
  authority: string;
  licenseNumber: string;
  licenseStatus: "active";
  sourceUrl: string;
  checkedAt: string;
  validationToken: string;
}

interface ResourceEvidence {
  sourceUrl: string;
  organization?: string;
  checkedAt: string;
  validationToken: string;
}

interface DecisionBody {
  action?: DecisionAction;
  reviewNote?: unknown;
  expectedRevision?: unknown;
  existingRecordId?: unknown;
  regulatedEvidence?: unknown;
  locationEvidence?: unknown;
  resourceEvidence?: unknown;
  resourceCategory?: unknown;
  resourceSourceTier?: unknown;
  memberFacingUrl?: unknown;
  ownershipEvidenceConfirmed?: unknown;
  omitOwnershipDesignations?: unknown;
  linkEvidenceConfirmed?: unknown;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  source: string;
  sourceUrl: string;
  checkedAt: string;
  displayName?: string;
  resolvedCity?: string;
  resolvedState?: string;
}

interface LocationSuggestionPayload extends Coordinates {
  candidateId: string;
  candidateFingerprint: string;
  expiresAt: string;
}

interface UrlValidationPayload {
  candidateId: string;
  purpose: "regulated" | "resource";
  url: string;
  finalHost: string;
  status: number;
  result: "working" | "reachable_restricted";
  checkedAt: string;
  expiresAt: string;
}

class RouteError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const CANDIDATE_COLUMNS = `
  id, batch_id, source_row, target_kind, status, dedupe_key, name, city, state,
  category, subcategory, cultural_specialty, address, phone, website, source_url,
  source_name, source_status, ownership_designations, ownership_evidence,
  regulated_profession, public_display_recommendation, instagram_url, facebook_url,
  tiktok_url, social_source_url, price_range, price_basis, suggested_experience_keys,
  link_validation, notes, raw_record, matched_business_id, published_record_type,
  published_record_id, reviewed_by, reviewed_at, review_note, review_evidence,
  review_revision, created_at, updated_at
`;

const VALID_STATUSES = new Set<CandidateStatus>([
  "pending_review", "needs_research", "declined", "approved", "published",
]);
const VALID_TARGET_KINDS = new Set<CandidateTargetKind>([
  "business", "community_resource", "regulated_review", "manual_review", "internal_only",
]);
const VALID_RESOURCE_CATEGORIES = new Set<ResourceCategory>([
  "essential_support", "education", "jobs", "business", "housing", "safety_rights",
]);
const VALID_RESOURCE_TIERS = new Set<ResourceSourceTier>([
  "official", "verified_org", "community_confirmed", "community_shared",
]);
const ACCEPTED_LINK_RESULTS = new Set(["working", "reachable_restricted"]);
const LINK_FIELDS = ["website", "source", "instagram", "facebook", "tiktok", "socialSource"] as const;
const EVIDENCE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;

function freshCheckedAt(value: unknown): string | null {
  const checkedAt = asTrimmedString(value, 80);
  if (!checkedAt) return null;
  const checkedDate = new Date(checkedAt);
  const now = Date.now();
  if (Number.isNaN(checkedDate.getTime())) return null;
  if (checkedDate.getTime() > now + 5 * 60 * 1_000) return null;
  if (checkedDate.getTime() < now - EVIDENCE_MAX_AGE_MS) return null;
  return checkedDate.toISOString();
}

function isGovernmentUrl(value: string): boolean {
  const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  return host.endsWith(".gov") || host === "gov";
}

function isOfficialAuthorityUrl(value: string): boolean {
  if (isGovernmentUrl(value)) return true;
  const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  const configuredHosts = (process.env.DIRECTORY_OFFICIAL_SOURCE_HOSTS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/^www\./, ""))
    .filter(Boolean);
  return configuredHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function requestUser(req: Request): { id: string; role?: string; email?: string } | null {
  const user = req.user as { id?: string; role?: string; email?: string } | undefined;
  return user?.id ? { id: user.id, role: user.role, email: user.email } : null;
}

function requireFounder(req: Request, res: Response): { id: string } | null {
  const user = requestUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Founder/admin access required", code: "ADMIN_REQUIRED" });
    return null;
  }
  return { id: user.id };
}

function asTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result ? result.slice(0, maxLength) : null;
}

// IANA IPv4/IPv6 Special-Purpose registries, last updated 2025-10-09.
// Default-deny special/N/A ranges; explicitly allow only registry entries
// marked globally reachable that sit inside a broader denied parent.
const NON_GLOBAL_IPV4 = new BlockList();
const NON_GLOBAL_IPV6 = new BlockList();
const GLOBAL_SPECIAL_IPV4 = new BlockList();
const GLOBAL_SPECIAL_IPV6 = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) NON_GLOBAL_IPV4.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 96], ["::ffff:0:0", 96], ["64:ff9b:1::", 48], ["100::", 64],
  ["100:0:0:1::", 64], ["2001::", 23], ["2001:db8::", 32], ["2002::", 16],
  ["3fff::", 20], ["5f00::", 16], ["fc00::", 7], ["fec0::", 10], ["fe80::", 10], ["ff00::", 8],
] as const) NON_GLOBAL_IPV6.addSubnet(network, prefix, "ipv6");
for (const address of ["192.0.0.9", "192.0.0.10"]) GLOBAL_SPECIAL_IPV4.addAddress(address, "ipv4");
for (const [network, prefix] of [
  ["2001:1::1", 128], ["2001:1::2", 128], ["2001:1::3", 128],
  ["2001:3::", 32], ["2001:4:112::", 48], ["2001:20::", 28], ["2001:30::", 28],
] as const) GLOBAL_SPECIAL_IPV6.addSubnet(network, prefix, "ipv6");

function safeHttpUrl(value: unknown): string | null {
  const raw = asTrimmedString(value, 2_000);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (host === "localhost" || host.endsWith(".localhost")) return null;
    if (isIP(host) && !isDirectoryEvidencePublicIp(host)) return null;
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isDirectoryEvidencePublicIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return GLOBAL_SPECIAL_IPV4.check(address, "ipv4") || !NON_GLOBAL_IPV4.check(address, "ipv4");
  if (family === 6) return GLOBAL_SPECIAL_IPV6.check(address, "ipv6") || !NON_GLOBAL_IPV6.check(address, "ipv6");
  return false;
}

export function areDirectoryEvidenceAddressesPublic(addresses: string[]): boolean {
  return addresses.length > 0 && addresses.every((address) => isDirectoryEvidencePublicIp(address));
}

export interface DirectoryEvidenceNetwork {
  resolveAddresses: (url: URL) => Promise<string[] | null>;
  request: (url: URL, address: string, method: "HEAD" | "GET") => Promise<{ status: number; location: string | null } | null>;
}

async function resolvePublicAddresses(url: URL): Promise<string[] | null> {
  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (!areDirectoryEvidenceAddressesPublic(addresses.map((item) => item.address))) return null;
    return [...new Set(addresses.map((item) => item.address))];
  } catch {
    return null;
  }
}

async function requestPinned(
  url: URL,
  address: string,
  method: "HEAD" | "GET",
): Promise<{ status: number; location: string | null } | null> {
  return await new Promise((resolve) => {
    const secure = url.protocol === "https:";
    const request = (secure ? httpsRequest : httpRequest)({
      protocol: url.protocol,
      hostname: address,
      port: url.port || (secure ? 443 : 80),
      method,
      path: `${url.pathname}${url.search}`,
      servername: secure ? url.hostname : undefined,
      rejectUnauthorized: true,
      headers: {
        Host: url.host,
        "User-Agent": "MappingWithMelanin-StagingDirectoryReview/1.0 (https://mappingwithmelanin.com)",
        ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
      },
      timeout: 8_000,
    }, (response) => {
      const result = {
        status: response.statusCode ?? 0,
        location: typeof response.headers.location === "string" ? response.headers.location : null,
      };
      response.destroy();
      resolve(result);
    });
    request.once("timeout", () => { request.destroy(); resolve(null); });
    request.once("error", () => resolve(null));
    request.end();
  });
}

export async function validateDirectoryEvidenceUrl(
  value: string,
  networking: Partial<DirectoryEvidenceNetwork> = {},
): Promise<{
  url: string;
  finalHost: string;
  status: number;
  result: "working" | "reachable_restricted";
  checkedAt: string;
} | null> {
  const initial = safeHttpUrl(value);
  if (!initial) return null;
  const resolveAddresses = networking.resolveAddresses ?? resolvePublicAddresses;
  const request = networking.request ?? requestPinned;
  let current = new URL(initial);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const addresses = await resolveAddresses(current);
    if (!addresses || !areDirectoryEvidenceAddressesPublic(addresses)) return null;
    let response = await request(current, addresses[0]!, "HEAD");
    if (response?.status === 405) response = await request(current, addresses[0]!, "GET");
    if (!response) return null;
    if (response.status >= 300 && response.status < 400) {
      const location = response.location;
      if (!location || redirect === 3) return null;
      const next = safeHttpUrl(new URL(location, current).toString());
      if (!next) return null;
      current = new URL(next);
      continue;
    }
    const accepted = (response.status >= 200 && response.status < 300) || response.status === 401 || response.status === 403;
    if (!accepted) return null;
    return {
      url: current.toString(),
      finalHost: current.hostname.toLowerCase().replace(/^www\./, ""),
      status: response.status,
      result: response.status === 401 || response.status === 403 ? "reachable_restricted" : "working",
      checkedAt: new Date().toISOString(),
    };
  }
  return null;
}

function signUrlValidation(payload: UrlValidationPayload, secret: string): string {
  if (secret.length < 32) throw new Error("Directory review signing secret must contain at least 32 characters.");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function signDirectoryUrlValidation(
  candidateId: string,
  purpose: UrlValidationPayload["purpose"],
  validation: Pick<UrlValidationPayload, "url" | "finalHost" | "status" | "result" | "checkedAt">,
  secret: string,
): string {
  return signUrlValidation({
    candidateId,
    purpose,
    ...validation,
    expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
  }, secret);
}

function verifyUrlValidation(
  token: unknown,
  candidateId: string,
  purpose: UrlValidationPayload["purpose"],
  sourceUrl: string,
  secret: string,
): UrlValidationPayload | null {
  const normalizedToken = asTrimmedString(token, 5_000);
  if (!normalizedToken || secret.length < 32) return null;
  const [encoded, providedSignature, ...extra] = normalizedToken.split(".");
  if (!encoded || !providedSignature || extra.length > 0) return null;
  const expectedSignature = createHmac("sha256", secret).update(encoded).digest("base64url");
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as UrlValidationPayload;
    const expiresAt = new Date(payload.expiresAt).getTime();
    const canonicalSource = safeHttpUrl(sourceUrl);
    if (
      payload.candidateId !== candidateId
      || payload.purpose !== purpose
      || !Number.isFinite(expiresAt)
      || expiresAt < Date.now()
      || !freshCheckedAt(payload.checkedAt)
      || !canonicalSource
      || canonicalSource !== safeHttpUrl(payload.url)
      || new URL(canonicalSource).hostname.toLowerCase().replace(/^www\./, "") !== payload.finalHost
      || !ACCEPTED_LINK_RESULTS.has(payload.result)
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

function validatedSocialUrl(platform: "instagram" | "facebook" | "tiktok", value: string | null): string | null {
  const safe = safeHttpUrl(value);
  if (!safe) return null;
  const host = new URL(safe).hostname.toLowerCase().replace(/^www\./, "");
  const allowed = platform === "instagram"
    ? host === "instagram.com" || host.endsWith(".instagram.com")
    : platform === "facebook"
      ? host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com"
      : host === "tiktok.com" || host.endsWith(".tiktok.com");
  return allowed ? safe : null;
}

function websiteHost(website: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

const NON_FACTUAL_PUBLIC_TAG = /\b(?:black|african[ -]?american|minority|women?|female|male|lgbtq\+?|queer|trans(?:gender)?|veteran|disabled|disability|children?|kids?|teens?|youth|under[ -]?13|adult(?:s)?[ -]?only|21\+|safe(?:ty)?|verified|trusted|approved|best|excellent|affordable|budget|luxury|free|pricing|price)\b/i;

export function sourceBackedPublicSearchTags(candidate: Pick<DirectoryImportCandidate, "raw_record">): string[] {
  if (candidate.raw_record.publicSearchTagEvidence !== "workbook_category_services_and_reviewed_offerings_only") return [];
  const rawTags = candidate.raw_record.searchTags;
  if (!Array.isArray(rawTags)) return [];
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const rawTag of rawTags) {
    if (typeof rawTag !== "string") continue;
    const tag = rawTag.replace(/\s+/g, " ").trim();
    if (tag.length < 2 || tag.length > 90 || NON_FACTUAL_PUBLIC_TAG.test(tag)) continue;
    const key = tag.normalize("NFKD").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 24) break;
  }
  return tags;
}

function decisionPayloadHash(body: DecisionBody): string {
  return createHash("sha256").update(JSON.stringify(stableValue(body))).digest("hex");
}

function reviewGates(candidate: DirectoryImportCandidate): string[] {
  const gates = candidate.link_validation?.reviewGates;
  return Array.isArray(gates) ? gates.filter((gate): gate is string => typeof gate === "string") : [];
}

function linkResult(candidate: DirectoryImportCandidate, field: typeof LINK_FIELDS[number]): string | null {
  const raw = candidate.link_validation?.[field];
  if (!raw || typeof raw !== "object") return null;
  const result = (raw as Record<string, unknown>).result;
  return typeof result === "string" ? result : null;
}

function freshAcceptedLink(candidate: DirectoryImportCandidate, field: typeof LINK_FIELDS[number]): string | null {
  const raw = candidate.link_validation?.[field];
  if (!raw || typeof raw !== "object") return null;
  const evidence = raw as Record<string, unknown>;
  if (!ACCEPTED_LINK_RESULTS.has(typeof evidence.result === "string" ? evidence.result : "")) return null;
  if (!freshCheckedAt(evidence.checkedAt)) return null;
  const finalUrl = safeHttpUrl(evidence.finalUrl) ?? safeHttpUrl(evidence.url);
  const finalHost = asTrimmedString(evidence.finalHost, 300)?.toLowerCase().replace(/^www\./, "") ?? null;
  if (!finalUrl || !finalHost || new URL(finalUrl).hostname.toLowerCase().replace(/^www\./, "") !== finalHost) return null;
  return finalUrl;
}

function hasUnresolvedLink(candidate: DirectoryImportCandidate): boolean {
  return LINK_FIELDS.some((field) => {
    const result = linkResult(candidate, field);
    return result !== null && !freshAcceptedLink(candidate, field);
  });
}

function parseRegulatedEvidence(value: unknown, candidateId: string, secret: string): RegulatedEvidence | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const authority = asTrimmedString(input.authority, 200);
  const licenseNumber = asTrimmedString(input.licenseNumber, 120);
  const sourceUrl = safeHttpUrl(input.sourceUrl);
  const validation = sourceUrl ? verifyUrlValidation(input.validationToken, candidateId, "regulated", sourceUrl, secret) : null;
  if (!authority || !licenseNumber || input.licenseStatus !== "active" || !sourceUrl || !validation || !isOfficialAuthorityUrl(validation.url)) {
    return null;
  }
  return {
    authority,
    licenseNumber,
    licenseStatus: "active",
    sourceUrl: validation.url,
    checkedAt: validation.checkedAt,
    validationToken: String(input.validationToken),
  };
}

function locationCandidateFingerprint(candidate: Pick<DirectoryImportCandidate, "id" | "name" | "address" | "city" | "state">): string {
  return createHash("sha256").update([
    candidate.id,
    normalizeText(candidate.name),
    normalizeText(candidate.address ?? ""),
    normalizeText(candidate.city),
    normalizeText(candidate.state),
  ].join("|")).digest("hex");
}

export function signDirectoryLocationSuggestion(
  candidate: Pick<DirectoryImportCandidate, "id" | "name" | "address" | "city" | "state">,
  coordinates: Coordinates,
  secret: string,
): string {
  if (secret.length < 32) throw new Error("Directory location signing secret must contain at least 32 characters.");
  const payload: LocationSuggestionPayload = {
    ...coordinates,
    candidateId: candidate.id,
    candidateFingerprint: locationCandidateFingerprint(candidate),
    expiresAt: new Date(Date.now() + 30 * 60 * 1_000).toISOString(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function parseLocationEvidence(
  value: unknown,
  candidate: Pick<DirectoryImportCandidate, "id" | "name" | "address" | "city" | "state">,
  secret: string,
): Coordinates | null {
  if (!value || typeof value !== "object" || secret.length < 32) return null;
  const input = value as Record<string, unknown>;
  const token = asTrimmedString(input.suggestionToken, 5_000);
  if (!token || input.confirmedByReviewer !== true) return null;
  const [encoded, providedSignature, ...extra] = token.split(".");
  if (!encoded || !providedSignature || extra.length > 0) return null;
  const expectedSignature = createHmac("sha256", secret).update(encoded).digest("base64url");
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as LocationSuggestionPayload;
    const expiresAt = new Date(payload.expiresAt).getTime();
    if (
      payload.candidateId !== candidate.id
      || payload.candidateFingerprint !== locationCandidateFingerprint(candidate)
      || !Number.isFinite(expiresAt)
      || expiresAt < Date.now()
      || !freshCheckedAt(payload.checkedAt)
      || !safeHttpUrl(payload.sourceUrl)
      || !Number.isFinite(payload.latitude)
      || !Number.isFinite(payload.longitude)
      || payload.latitude < -90 || payload.latitude > 90
      || payload.longitude < -180 || payload.longitude > 180
      || (payload.latitude === 0 && payload.longitude === 0)
    ) return null;
    return {
      latitude: payload.latitude,
      longitude: payload.longitude,
      source: payload.source,
      sourceUrl: payload.sourceUrl,
      checkedAt: payload.checkedAt,
      displayName: payload.displayName,
      resolvedCity: payload.resolvedCity,
      resolvedState: payload.resolvedState,
    };
  } catch {
    return null;
  }
}

function parseResourceEvidence(value: unknown, candidateId: string, secret: string): ResourceEvidence | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const sourceUrl = safeHttpUrl(input.sourceUrl);
  const organization = asTrimmedString(input.organization, 200) ?? undefined;
  const validation = sourceUrl ? verifyUrlValidation(input.validationToken, candidateId, "resource", sourceUrl, secret) : null;
  if (!sourceUrl || !validation) return null;
  return {
    sourceUrl: validation.url,
    organization,
    checkedAt: validation.checkedAt,
    validationToken: String(input.validationToken),
  };
}

function foldLocation(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    : "";
}

function parseCoordinatesFromGeocoder(
  hit: unknown,
  candidate: Pick<DirectoryImportCandidate, "address" | "city" | "state">,
): Coordinates | null {
  if (!hit || typeof hit !== "object") return null;
  const row = hit as Record<string, unknown>;
  const latitude = Number(row.lat);
  const longitude = Number(row.lon);
  const address = row.address && typeof row.address === "object"
    ? row.address as Record<string, unknown>
    : {};
  const resolvedCity = [address.city, address.town, address.village, address.municipality]
    .map(foldLocation)
    .find(Boolean) ?? "";
  const resolvedState = foldLocation(address.state);
  const resolvedStateCode = Object.entries(address)
    .find(([key]) => key.toLowerCase().startsWith("iso3166-2"))?.[1];
  const expectedCity = foldLocation(candidate.city);
  const expectedState = foldLocation(candidate.state);
  const stateCode = foldLocation(resolvedStateCode).replace(/^us /, "");
  const expectedStreet = foldLocation(candidate.address?.split(",")[0]);
  const returnedStreet = foldLocation(address.road ?? address.pedestrian ?? address.residential);
  const expectedHouse = expectedStreet.match(/^\d+[a-z]?/)?.[0] ?? "";
  const returnedHouse = foldLocation(address.house_number);
  const streetTokens = expectedStreet
    .split(" ")
    .filter((token) => token.length >= 4 && !["street", "road", "avenue", "drive", "lane", "boulevard", "highway", "suite"].includes(token));
  const cityMatches = Boolean(expectedCity && resolvedCity && (resolvedCity === expectedCity || resolvedCity.includes(expectedCity) || expectedCity.includes(resolvedCity)));
  const stateMatches = Boolean(expectedState && (stateCode === expectedState || resolvedState === expectedState));
  const houseMatches = Boolean(expectedHouse && returnedHouse && expectedHouse === returnedHouse);
  const streetMatches = streetTokens.length > 0 && streetTokens.some((token) => returnedStreet.includes(token));
  const osmId = typeof row.osm_id === "number" || typeof row.osm_id === "string" ? String(row.osm_id) : null;
  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    || (latitude === 0 && longitude === 0)
    || !osmId || !cityMatches || !stateMatches || !houseMatches || !streetMatches
  ) return null;
  return {
    latitude,
    longitude,
    source: "OpenStreetMap Nominatim address result",
    sourceUrl: `https://www.openstreetmap.org/${String(row.osm_type ?? "node")}/${osmId}`,
    checkedAt: new Date().toISOString(),
    displayName: asTrimmedString(row.display_name, 500) ?? undefined,
    resolvedCity: asTrimmedString(address.city ?? address.town ?? address.village ?? address.municipality, 100) ?? undefined,
    resolvedState: asTrimmedString(address.state, 80) ?? undefined,
  };
}

export async function geocodeDirectoryCandidate(
  candidate: Pick<DirectoryImportCandidate, "address" | "city" | "state">,
): Promise<Coordinates | null> {
  if (!candidate.address?.trim()) return null;
  const query = [candidate.address, candidate.city, candidate.state, "USA"].filter(Boolean).join(", ");
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1", countrycodes: "us", addressdetails: "1" });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MappingWithMelanin-StagingDirectoryReview/1.0 (https://mappingwithmelanin.com)",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const rows = await response.json() as unknown[];
    return parseCoordinatesFromGeocoder(rows[0], candidate);
  } catch {
    return null;
  }
}

function memberFacingLink(candidate: DirectoryImportCandidate, body: DecisionBody): string | null {
  const override = safeHttpUrl(body.memberFacingUrl);
  const acceptedWebsite = freshAcceptedLink(candidate, "website");
  if (override && override === acceptedWebsite) return override;
  return acceptedWebsite;
}

function buildReviewEvidence(
  candidate: DirectoryImportCandidate,
  body: DecisionBody,
  coordinates: Coordinates | null,
  signingSecret: string,
): JsonObject {
  const regulated = parseRegulatedEvidence(body.regulatedEvidence, candidate.id, signingSecret);
  const resource = parseResourceEvidence(body.resourceEvidence, candidate.id, signingSecret);
  return {
    sourceBundleCandidateId: candidate.id,
    batchId: candidate.batch_id,
    sourceRow: candidate.source_row,
    linkEvidenceConfirmed: body.linkEvidenceConfirmed === true,
    ownershipEvidenceConfirmed: body.ownershipEvidenceConfirmed === true,
    ownershipDesignationsOmitted: body.omitOwnershipDesignations === true,
    regulatedEvidence: regulated,
    resourceEvidence: resource,
    locationEvidence: coordinates,
    memberFacingUrl: safeHttpUrl(body.memberFacingUrl),
    resourceSourceTier: VALID_RESOURCE_TIERS.has(body.resourceSourceTier as ResourceSourceTier)
      ? body.resourceSourceTier
      : null,
    reviewedAt: new Date().toISOString(),
  };
}

export function evaluatePublicationHolds(
  candidate: DirectoryImportCandidate,
  body: DecisionBody,
  signingSecret = process.env.DIRECTORY_REVIEW_SIGNING_SECRET ?? "",
): string[] {
  const holds: string[] = [];
  const rawMemberFacingUrl = asTrimmedString(body.memberFacingUrl, 2_000);
  const overrideUrl = safeHttpUrl(body.memberFacingUrl);
  const acceptedCandidateWebsite = freshAcceptedLink(candidate, "website");
  const resourceEvidence = parseResourceEvidence(body.resourceEvidence, candidate.id, signingSecret);
  if (candidate.target_kind === "internal_only") holds.push("Internal-only candidates cannot be published.");
  if (candidate.target_kind === "manual_review") holds.push("Destination must be resolved before this candidate can be published.");
  if (candidate.matched_business_id && body.action !== "link_existing") {
    holds.push("A canonical business match exists; use link_existing rather than creating a duplicate.");
  }
  if (reviewGates(candidate).includes("duplicate_within_batch") && body.action !== "link_existing") {
    holds.push("An in-batch duplicate must link to the canonical record after reconciliation.");
  }
  if (body.action !== "link_existing" && hasUnresolvedLink(candidate) && body.linkEvidenceConfirmed !== true) {
    holds.push("Unresolved link evidence must be reviewed and confirmed.");
  }
  if (rawMemberFacingUrl && !overrideUrl) {
    holds.push("The member-facing link must be a valid public HTTP(S) URL.");
  } else if (
    body.action !== "link_existing"
    && overrideUrl
    && (
      candidate.target_kind === "community_resource"
        ? overrideUrl !== resourceEvidence?.sourceUrl
        : overrideUrl !== acceptedCandidateWebsite
    )
  ) {
    holds.push("A member-facing link must match fresh successful link evidence (or the reviewed current resource source).");
  }
  if (body.action !== "link_existing"
    && (candidate.ownership_designations ?? []).length > 0
    && body.ownershipEvidenceConfirmed !== true
    && body.omitOwnershipDesignations !== true) {
    holds.push("Ownership evidence must be confirmed or the public ownership designations must be omitted.");
  }
  if (body.action !== "link_existing"
    && (candidate.regulated_profession || candidate.target_kind === "regulated_review")
    && !parseRegulatedEvidence(body.regulatedEvidence, candidate.id, signingSecret)) {
    holds.push("Current regulated-profession evidence is required.");
  }
  if (candidate.target_kind === "community_resource") {
    if (!VALID_RESOURCE_CATEGORIES.has(body.resourceCategory as ResourceCategory)) {
      holds.push("A reviewed Resources category is required.");
    }
    if (!resourceEvidence) {
      holds.push("Current source evidence is required for a community resource.");
    }
    const requestedTier = body.resourceSourceTier as ResourceSourceTier;
    if (requestedTier === "official" && resourceEvidence && !isGovernmentUrl(resourceEvidence.sourceUrl)) {
      holds.push("Official resource tier requires a current government source URL.");
    }
  }
  return holds;
}

function isBusinessTarget(candidate: DirectoryImportCandidate): boolean {
  return candidate.target_kind === "business" || candidate.target_kind === "regulated_review";
}

function resourceCanonicalKey(candidate: DirectoryImportCandidate): string {
  return createHash("sha256")
    .update([normalizeText(candidate.name), normalizeText(candidate.city), normalizeText(candidate.state), normalizeText(candidate.address ?? "")].join("|"))
    .digest("hex");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function loadCandidateForUpdate(id: string, client: Queryable): Promise<DirectoryImportCandidate | null> {
  const result = await client.query<DirectoryImportCandidate>(
    `SELECT ${CANDIDATE_COLUMNS}
       FROM directory_import_candidates
      WHERE id = $1
      FOR UPDATE`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function loadCandidate(id: string, database: Queryable): Promise<DirectoryImportCandidate | null> {
  const result = await database.query<DirectoryImportCandidate>(
    `SELECT ${CANDIDATE_COLUMNS}
       FROM directory_import_candidates
      WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function updateBatchStatus(batchId: string, client: Queryable): Promise<void> {
  await client.query(
    `UPDATE directory_import_batches b
        SET status = CASE
          WHEN EXISTS (
            SELECT 1 FROM directory_import_candidates c
             WHERE c.batch_id = b.id AND c.status IN ('pending_review','needs_research','approved')
          ) THEN 'in_review'
          ELSE 'completed'
        END,
        updated_at = NOW()
      WHERE b.id = $1 AND b.status <> 'cancelled'`,
    [batchId],
  );
}

async function appendDecisionEvent(
  client: Queryable,
  input: {
    candidateId: string;
    batchId: string;
    actorId: string;
    action: DecisionAction;
    previousStatus: CandidateStatus;
    newStatus: CandidateStatus;
    reviewNote: string | null;
    reviewEvidence: JsonObject;
    idempotencyKey: string;
    payloadHash: string;
    publishedRecordType?: PublishedRecordType | null;
    publishedRecordId?: string | null;
  },
): Promise<void> {
  await client.query(
    `INSERT INTO directory_import_decision_events
       (candidate_id, batch_id, actor_id, action, previous_status, new_status,
        review_note, review_evidence, idempotency_key, payload_hash,
        published_record_type, published_record_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,NOW())`,
    [
      input.candidateId, input.batchId, input.actorId, input.action,
      input.previousStatus, input.newStatus, input.reviewNote,
      JSON.stringify(input.reviewEvidence), input.idempotencyKey, input.payloadHash,
      input.publishedRecordType ?? null, input.publishedRecordId ?? null,
    ],
  );
}

async function publishBusiness(
  candidate: DirectoryImportCandidate,
  reviewerId: string,
  body: DecisionBody,
  coordinates: Coordinates | null,
  idempotencyKey: string,
  payloadHash: string,
  signingSecret: string,
  client: PoolClient,
): Promise<{ recordType: "business"; recordId: string; action: "create" | "link_existing" }> {
  const canonicalCategory = getBusinessExperiencePolicy(candidate.category, candidate.subcategory).category;
  const canonicalDedupeKey = dedupeKey({
    name: candidate.name,
    city: candidate.city,
    state: candidate.state,
    address: candidate.address,
    latitude: coordinates ? String(coordinates.latitude) : undefined,
    longitude: coordinates ? String(coordinates.longitude) : undefined,
  });
  const publicationLockKey = dedupeKey({
    name: candidate.name,
    city: candidate.city,
    state: candidate.state,
    address: candidate.address,
  });
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [publicationLockKey]);

  const requestedExistingId = asTrimmedString(body.existingRecordId, 100) ?? candidate.matched_business_id;
  const duplicate = await client.query<{ id: string; name: string }>(
    `SELECT id, name
       FROM businesses
      WHERE COALESCE(is_duplicate, false) = false
        AND COALESCE(status, 'active') NOT IN ('duplicate','permanently_hidden','removed','deleted')
        AND (
          dedupe_key IN ($1, $2)
          OR (
            lower(trim(name)) = lower(trim($3))
            AND lower(trim(city)) = lower(trim($4))
            AND lower(trim(COALESCE(state, ''))) = lower(trim(COALESCE($5, '')))
            AND (
              NULLIF(trim($6), '') IS NULL
              OR NULLIF(trim(address), '') IS NULL
              OR lower(trim(address)) = lower(trim($6))
            )
          )
          OR id = (
            SELECT business_id FROM business_publication_identities WHERE identity_key = $7
          )
        )
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE`,
    [candidate.dedupe_key, canonicalDedupeKey, candidate.name, candidate.city, candidate.state, candidate.address, publicationLockKey],
  );

  if (body.action === "link_existing") {
    const existing = duplicate.rows[0];
    if (!requestedExistingId || !existing || existing.id !== requestedExistingId) {
      throw new RouteError(409, "CANONICAL_MATCH_NOT_FOUND", "The selected canonical business was not found.");
    }
    const identityWinner = await client.query<{ business_id: string }>(
      `INSERT INTO business_publication_identities (identity_key, business_id, created_at)
       VALUES ($1,$2,NOW())
       ON CONFLICT (identity_key) DO UPDATE
         SET business_id = business_publication_identities.business_id
       RETURNING business_id`,
      [publicationLockKey, existing.id],
    );
    if (identityWinner.rows[0]?.business_id !== existing.id) {
      throw new RouteError(
        409,
        "BUSINESS_IDENTITY_CONFLICT",
        "This identity is already mapped to a different canonical business. Reconcile to that winner.",
        { businessId: identityWinner.rows[0]?.business_id },
      );
    }
    await client.query(
      `INSERT INTO directory_import_publications
         (candidate_id, batch_id, record_type, record_id, publication_action,
          actor_id, idempotency_key, payload_hash, created_at)
       VALUES ($1,$2,'business',$3,'link_existing',$4,$5,$6,NOW())`,
      [candidate.id, candidate.batch_id, existing.id, reviewerId, idempotencyKey, payloadHash],
    );
    return { recordType: "business", recordId: existing.id, action: "link_existing" };
  }

  if (duplicate.rows[0]) {
    throw new RouteError(
      409,
      "BUSINESS_ALREADY_LISTED",
      "A matching business already exists. Review and link the candidate instead of creating a duplicate.",
      { businessId: duplicate.rows[0].id },
    );
  }

  if (!coordinates) {
    throw new RouteError(409, "LOCATION_EVIDENCE_REQUIRED", "A reviewed non-zero location is required before this business can be published.");
  }

  const businessId = randomUUID();
  const identityClaim = await client.query<{ business_id: string }>(
    `INSERT INTO business_publication_identities (identity_key, business_id, created_at)
     VALUES ($1,$2,NOW())
     ON CONFLICT (identity_key) DO NOTHING
     RETURNING business_id`,
    [publicationLockKey, businessId],
  );
  if (!identityClaim.rows[0]) {
    const winner = await client.query<{ business_id: string }>(
      `SELECT business_id FROM business_publication_identities WHERE identity_key = $1`,
      [publicationLockKey],
    );
    throw new RouteError(
      409,
      "BUSINESS_IDENTITY_ALREADY_PUBLISHED",
      "A matching business identity was published concurrently. Review and link the canonical record.",
      { businessId: winner.rows[0]?.business_id },
    );
  }
  const website = memberFacingLink(candidate, body);
  const instagram = validatedSocialUrl("instagram", freshAcceptedLink(candidate, "instagram"));
  const facebook = validatedSocialUrl("facebook", freshAcceptedLink(candidate, "facebook"));
  const tiktok = validatedSocialUrl("tiktok", freshAcceptedLink(candidate, "tiktok"));
  const socialProfiles = [
    ["instagram", instagram], ["facebook", facebook], ["tiktok", tiktok],
  ].flatMap(([platform, url]) => url ? [{ platform, url, handle: null, suppliedByUser: false }] : []);
  const ownershipDesignations = body.ownershipEvidenceConfirmed === true && body.omitOwnershipDesignations !== true
    ? candidate.ownership_designations ?? []
    : [];
  const regulatedEvidence = parseRegulatedEvidence(body.regulatedEvidence, candidate.id, signingSecret);
  const publicSearchTags = sourceBackedPublicSearchTags(candidate);
  const sourceEvidence = [{
    sourceType: "founder_directory_import",
    sourceName: candidate.source_name,
    sourceUrl: candidate.source_url,
    sourceStatus: candidate.source_status,
    field: "identity_and_listing",
    supports: true,
    candidateId: candidate.id,
    batchId: candidate.batch_id,
    sourceRow: candidate.source_row,
    linkValidation: candidate.link_validation,
    ownershipEvidence: body.ownershipEvidenceConfirmed === true ? candidate.ownership_evidence : null,
    regulatedEvidence,
    publicSearchTags,
    excerpt: "Founder-curated external source reviewed for an unclaimed directory listing; this is not Mapping With Melanin ownership or business verification.",
  }];
  const description = `Founder-curated, unclaimed ${candidate.subcategory ?? canonicalCategory} listing in ${candidate.city}. Not verified by Mapping With Melanin.`;

  await client.query(
    `INSERT INTO businesses
       (id, name, category, subcategory, description, address, city, state, country,
        postal_code, latitude, longitude, phone, website, website_domain, hours,
        price_range, tags, image_url, photos, pending_photos, videos,
        instagram, tiktok, facebook, youtube, social_profiles, source_evidence,
        ownership_designations, verified_designations, black_owned, verified,
        featured, promotion_eligible, feedback_opt_in, status, listing_status,
        business_status, profile_status, owner_claim_status, submitted_by_id,
        added_by_member_id, added_via, data_source, provider_place_id,
        normalized_name, dedupe_key, source_provider, source_record_id, published_at,
        created_at, updated_at)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,'USA',
        NULL,$9,$10,$11,$12,$13,NULL,
        $14,$15::jsonb,NULL,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
        $16,$17,$18,NULL,$19::jsonb,$20::jsonb,
        $21::jsonb,'[]'::jsonb,$22,false,
        false,false,false,'active','live_unclaimed',
        'community','community_listed','unclaimed',NULL,
        $23,'founder_directory_import','founder_directory_import',NULL,
        $24,$25,'founder_directory_import',$26,NOW(),
        NOW(),NOW())`,
    [
      businessId, candidate.name, canonicalCategory, candidate.subcategory ?? canonicalCategory,
      description, candidate.address ?? candidate.city, candidate.city, candidate.state,
      String(coordinates.latitude), String(coordinates.longitude), candidate.phone,
      website, websiteHost(website), candidate.price_basis ? candidate.price_range : null,
      JSON.stringify(publicSearchTags), instagram, tiktok, facebook, JSON.stringify(socialProfiles), JSON.stringify(sourceEvidence),
      JSON.stringify(ownershipDesignations), hasBlackOwnedDesignation(ownershipDesignations),
      reviewerId, normalizeText(candidate.name), canonicalDedupeKey, candidate.id,
    ],
  );

  await client.query(
    `INSERT INTO canonical_record_locations
       (record_type, record_id, city_name, state_code, neighborhood_name,
        latitude, longitude, is_primary, verified_at, created_at, updated_at)
     VALUES ('business',$1,$2,$3,NULL,$4,$5,TRUE,NULL,NOW(),NOW())
     ON CONFLICT (record_type, record_id, city_name, COALESCE(state_code, ''), COALESCE(neighborhood_name, ''))
     DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                   is_primary = TRUE, updated_at = NOW()`,
    [businessId, candidate.city.trim().toLowerCase(), candidate.state.trim().toUpperCase(), coordinates.latitude, coordinates.longitude],
  );

  await client.query(
    `INSERT INTO business_review_items
       (review_type, status, candidate_name, candidate_address, candidate_city,
        candidate_state, candidate_website, candidate_latitude, candidate_longitude,
        candidate_category, candidate_source_provider, matched_business_id, reason)
     VALUES ('founder_directory_import','approved',$1,$2,$3,$4,$5,$6,$7,$8,'founder_directory_import',$9,$10)`,
    [
      candidate.name, candidate.address ?? candidate.city, candidate.city, candidate.state,
      website, coordinates.latitude, coordinates.longitude, canonicalCategory, businessId,
      `Published from founder directory candidate ${candidate.id} by admin ${reviewerId}; unclaimed and not verified.`,
    ],
  );

  await client.query(
    `INSERT INTO directory_import_publications
       (candidate_id, batch_id, record_type, record_id, publication_action,
        actor_id, idempotency_key, payload_hash, created_at)
     VALUES ($1,$2,'business',$3,'create',$4,$5,$6,NOW())`,
    [candidate.id, candidate.batch_id, businessId, reviewerId, idempotencyKey, payloadHash],
  );
  return { recordType: "business", recordId: businessId, action: "create" };
}

async function publishResource(
  candidate: DirectoryImportCandidate,
  reviewerId: string,
  body: DecisionBody,
  coordinates: Coordinates | null,
  idempotencyKey: string,
  payloadHash: string,
  signingSecret: string,
  client: PoolClient,
): Promise<{ recordType: "resource"; recordId: string; action: "create" | "link_existing" }> {
  const category = body.resourceCategory as ResourceCategory;
  const requestedTier = body.resourceSourceTier as ResourceSourceTier;
  const resourceEvidence = parseResourceEvidence(body.resourceEvidence, candidate.id, signingSecret)!;
  const tier = VALID_RESOURCE_TIERS.has(requestedTier) ? requestedTier : "community_shared";
  if ((tier === "official" || tier === "verified_org") && !resourceEvidence.sourceUrl) {
    throw new RouteError(400, "RESOURCE_SOURCE_REQUIRED", "Official and verified organization tiers require current source evidence.");
  }
  const canonicalKey = resourceCanonicalKey(candidate);
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`resource:${canonicalKey}`]);

  const requestedExistingId = asTrimmedString(body.existingRecordId, 100);
  if (requestedExistingId && !isUuid(requestedExistingId)) {
    throw new RouteError(400, "INVALID_RESOURCE_ID", "The selected resource ID is invalid.");
  }
  const existing = await client.query<{ id: string; title: string }>(
    `SELECT id, title
       FROM resources
      WHERE canonical_key = $1
         OR (
           lower(trim(title)) = lower(trim($2))
           AND lower(trim(COALESCE(city, ''))) = lower(trim(COALESCE($3, '')))
           AND lower(trim(COALESCE(state, ''))) = lower(trim(COALESCE($4, '')))
         )
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE`,
    [canonicalKey, candidate.name, candidate.city, candidate.state],
  );

  if (body.action === "link_existing") {
    const linked = existing.rows[0];
    if (!requestedExistingId || !linked || linked.id !== requestedExistingId) {
      throw new RouteError(409, "RESOURCE_MATCH_NOT_FOUND", "The selected resource does not match this candidate's reviewed canonical identity.");
    }
    await client.query(
      `INSERT INTO directory_import_publications
         (candidate_id, batch_id, record_type, record_id, publication_action,
          actor_id, idempotency_key, payload_hash, created_at)
       VALUES ($1,$2,'resource',$3,'link_existing',$4,$5,$6,NOW())`,
      [candidate.id, candidate.batch_id, linked.id, reviewerId, idempotencyKey, payloadHash],
    );
    return { recordType: "resource", recordId: linked.id, action: "link_existing" };
  }

  if (existing.rows[0]) {
    throw new RouteError(
      409,
      "RESOURCE_ALREADY_LISTED",
      "A matching resource already exists. Review and link the candidate instead of creating a duplicate.",
      { resourceId: existing.rows[0].id },
    );
  }

  const resourceId = randomUUID();
  const memberUrl = safeHttpUrl(body.memberFacingUrl) ?? resourceEvidence.sourceUrl;
  const keywords = [...new Set([
    candidate.name, candidate.category, candidate.subcategory, candidate.cultural_specialty,
    "community resource",
  ].filter((item): item is string => Boolean(item?.trim())).map((item) => item.trim()))];
  const organization = resourceEvidence.organization ?? candidate.source_name ?? candidate.name;
  const description = `Founder-curated ${candidate.subcategory ?? candidate.category} resource for ${candidate.city}. Confirm current details with ${organization}.`;

  await client.query(
    `INSERT INTO resources
       (id, title, description, category, subcategory, source_tier, organization,
        url, phone, email, city, state, zip_code, is_national, keywords,
        application_deadline, expires_at, last_confirmed_at, is_active, report_count,
        canonical_key, normalized_title, source_category, source_subcategory,
        source_address, published_by, published_at, created_at, updated_at)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,$11,NULL,FALSE,$12,
        NULL,NULL,$13,TRUE,0,$14,$15,$16,$17,$18,$19,NOW(),NOW(),NOW())`,
    [
      resourceId, candidate.name, description, category, candidate.subcategory,
      tier, organization, memberUrl, candidate.phone, candidate.city, candidate.state,
      keywords, new Date(resourceEvidence.checkedAt), canonicalKey, normalizeText(candidate.name),
      candidate.category, candidate.subcategory, candidate.address, reviewerId,
    ],
  );

  await client.query(
    `INSERT INTO canonical_record_locations
       (record_type, record_id, city_name, state_code, neighborhood_name,
        latitude, longitude, is_primary, verified_at, created_at, updated_at)
     VALUES ('resource',$1,$2,$3,NULL,$4,$5,TRUE,NULL,NOW(),NOW())
     ON CONFLICT (record_type, record_id, city_name, COALESCE(state_code, ''), COALESCE(neighborhood_name, ''))
     DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                   is_primary = TRUE, updated_at = NOW()`,
    [resourceId, candidate.city.trim().toLowerCase(), candidate.state.trim().toUpperCase(), coordinates?.latitude ?? null, coordinates?.longitude ?? null],
  );

  await client.query(
    `INSERT INTO directory_import_resource_provenance
       (candidate_id, resource_id, batch_id, source_name, source_url, source_status,
        source_row, source_category, source_subcategory, raw_evidence, link_validation,
        reviewed_by, reviewed_at, review_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,NOW(),$13)`,
    [
      candidate.id, resourceId, candidate.batch_id, candidate.source_name,
      resourceEvidence.sourceUrl, candidate.source_status, candidate.source_row,
      candidate.category, candidate.subcategory, JSON.stringify(candidate.raw_record),
      JSON.stringify(candidate.link_validation), reviewerId,
      asTrimmedString(body.reviewNote, 2_000),
    ],
  );

  await client.query(
    `INSERT INTO directory_import_publications
       (candidate_id, batch_id, record_type, record_id, publication_action,
        actor_id, idempotency_key, payload_hash, created_at)
     VALUES ($1,$2,'resource',$3,'create',$4,$5,$6,NOW())`,
    [candidate.id, candidate.batch_id, resourceId, reviewerId, idempotencyKey, payloadHash],
  );
  return { recordType: "resource", recordId: resourceId, action: "create" };
}

async function replayedDecision(
  database: Queryable,
  idempotencyKey: string,
  payloadHash: string,
): Promise<{ candidate_id: string; payload_hash: string; published_record_type: PublishedRecordType | null; published_record_id: string | null } | null> {
  const result = await database.query<{
    candidate_id: string;
    payload_hash: string;
    published_record_type: PublishedRecordType | null;
    published_record_id: string | null;
  }>(
    `SELECT candidate_id, payload_hash, published_record_type, published_record_id
       FROM directory_import_decision_events
      WHERE idempotency_key = $1
      LIMIT 1`,
    [idempotencyKey],
  );
  const event = result.rows[0] ?? null;
  if (event && event.payload_hash !== payloadHash) {
    throw new RouteError(409, "IDEMPOTENCY_PAYLOAD_MISMATCH", "This idempotency key was already used for a different decision.");
  }
  return event;
}

export function registerDirectoryImportRoutes(
  app: Express,
  dependencies: DirectoryImportRouteDependencies = {},
): void {
  const transactionPool = dependencies.transactionPool ?? pool;
  const geocode = dependencies.geocode ?? geocodeDirectoryCandidate;
  const locationSigningSecret = dependencies.locationSigningSecret ?? process.env.DIRECTORY_REVIEW_SIGNING_SECRET ?? "";
  const validateEvidenceUrl = dependencies.validateEvidenceUrl ?? validateDirectoryEvidenceUrl;

  app.get("/api/founder/directory-import-batches", async (req: Request, res: Response) => {
    if (!requireFounder(req, res)) return;
    try {
      const result = await transactionPool.query(
        `SELECT b.id, b.source_name, b.source_sha256, b.source_row_count, b.status,
                b.created_by, b.created_at, b.updated_at,
                COUNT(c.id)::int AS candidate_count,
                COUNT(*) FILTER (WHERE c.status = 'pending_review')::int AS pending_review_count,
                COUNT(*) FILTER (WHERE c.status = 'needs_research')::int AS needs_research_count,
                COUNT(*) FILTER (WHERE c.status = 'published')::int AS published_count,
                COUNT(*) FILTER (WHERE c.status = 'declined')::int AS declined_count,
                COUNT(*) FILTER (WHERE c.target_kind = 'business')::int AS business_count,
                COUNT(*) FILTER (WHERE c.target_kind = 'community_resource')::int AS resource_count,
                COUNT(*) FILTER (WHERE c.target_kind = 'regulated_review')::int AS regulated_count
           FROM directory_import_batches b
           LEFT JOIN directory_import_candidates c ON c.batch_id = b.id
          GROUP BY b.id
          ORDER BY b.created_at DESC`,
      );
      res.json({ batches: result.rows });
    } catch (error: unknown) {
      req.log?.error({ err: error }, "Failed to list directory import batches");
      res.status(500).json({ error: "Failed to load directory import batches." });
    }
  });

  app.get("/api/founder/directory-import-batches/:batchId", async (req: Request, res: Response) => {
    if (!requireFounder(req, res)) return;
    try {
      const result = await transactionPool.query(
        `SELECT b.id, b.source_name, b.source_sha256, b.source_row_count, b.status,
                b.created_by, b.created_at, b.updated_at,
                COALESCE(jsonb_object_agg(summary.key, summary.value) FILTER (WHERE summary.key IS NOT NULL), '{}'::jsonb) AS counts
           FROM directory_import_batches b
           LEFT JOIN LATERAL (
             SELECT status || ':' || target_kind AS key, COUNT(*)::int AS value
               FROM directory_import_candidates
              WHERE batch_id = b.id
              GROUP BY status, target_kind
           ) summary ON TRUE
          WHERE b.id = $1
          GROUP BY b.id`,
        [String(req.params.batchId)],
      );
      if (!result.rows[0]) {
        res.status(404).json({ error: "Directory import batch not found." });
        return;
      }
      res.json({ batch: result.rows[0] });
    } catch (error: unknown) {
      req.log?.error({ err: error }, "Failed to load directory import batch");
      res.status(500).json({ error: "Failed to load directory import batch." });
    }
  });

  app.get("/api/founder/directory-import-candidates", async (req: Request, res: Response) => {
    if (!requireFounder(req, res)) return;
    const values: unknown[] = [];
    const conditions: string[] = [];
    const add = (clause: string, value: unknown) => {
      values.push(value);
      conditions.push(clause.replace("?", `$${values.length}`));
    };
    const status = asTrimmedString(req.query.status, 40);
    const targetKind = asTrimmedString(req.query.targetKind ?? req.query.target_kind, 50);
    if (status && status !== "all") {
      if (!VALID_STATUSES.has(status as CandidateStatus)) {
        res.status(400).json({ error: "Invalid candidate status." });
        return;
      }
      add("c.status = ?", status);
    }
    if (targetKind && targetKind !== "all") {
      if (!VALID_TARGET_KINDS.has(targetKind as CandidateTargetKind)) {
        res.status(400).json({ error: "Invalid target kind." });
        return;
      }
      add("c.target_kind = ?", targetKind);
    }
    for (const [queryName, column, max] of [
      ["batchId", "c.batch_id", 80], ["city", "c.city", 100], ["state", "c.state", 50], ["category", "c.category", 120],
    ] as const) {
      const value = asTrimmedString(req.query[queryName], max);
      if (value) add(`${column}::text ILIKE ?`, `%${value}%`);
    }
    const q = asTrimmedString(req.query.q, 200);
    if (q) {
      values.push(`%${q}%`);
      const placeholder = `$${values.length}`;
      conditions.push(`(c.name ILIKE ${placeholder} OR c.subcategory ILIKE ${placeholder} OR c.address ILIKE ${placeholder} OR c.source_name ILIKE ${placeholder})`);
    }
    const regulated = asTrimmedString(req.query.regulated, 10);
    if (regulated === "true" || regulated === "false") add("c.regulated_profession = ?", regulated === "true");
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    try {
      const [rows, count] = await Promise.all([
        transactionPool.query<DirectoryImportCandidate>(
          `SELECT ${CANDIDATE_COLUMNS}
             FROM directory_import_candidates c
             ${where}
            ORDER BY CASE c.status WHEN 'needs_research' THEN 0 WHEN 'pending_review' THEN 1 ELSE 2 END,
                     c.city, c.name, c.source_row
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
          [...values, limit, offset],
        ),
        transactionPool.query<{ total: string }>(
          `SELECT COUNT(*)::text AS total FROM directory_import_candidates c ${where}`,
          values,
        ),
      ]);
      res.json({ candidates: rows.rows, total: Number(count.rows[0]?.total ?? 0), limit, offset });
    } catch (error: unknown) {
      req.log?.error({ err: error }, "Failed to list directory import candidates");
      res.status(500).json({ error: "Failed to load directory import candidates." });
    }
  });

  app.get("/api/founder/directory-import-candidates/:id", async (req: Request, res: Response) => {
    if (!requireFounder(req, res)) return;
    try {
      const candidate = await loadCandidate(String(req.params.id), transactionPool);
      if (!candidate) {
        res.status(404).json({ error: "Directory import candidate not found." });
        return;
      }
      const events = await transactionPool.query(
        `SELECT id, actor_id, action, previous_status, new_status, review_note,
                review_evidence, published_record_type, published_record_id, created_at
           FROM directory_import_decision_events
          WHERE candidate_id = $1
          ORDER BY created_at DESC`,
        [candidate.id],
      );
      res.json({ candidate, events: events.rows, publicationHolds: reviewGates(candidate) });
    } catch (error: unknown) {
      req.log?.error({ err: error }, "Failed to load directory import candidate");
      res.status(500).json({ error: "Failed to load directory import candidate." });
    }
  });

  app.post("/api/founder/directory-import-candidates/:id/validate-evidence-url", async (req: Request, res: Response) => {
    if (!requireFounder(req, res)) return;
    try {
      const candidate = await loadCandidate(String(req.params.id), transactionPool);
      if (!candidate) {
        res.status(404).json({ error: "Directory import candidate not found." });
        return;
      }
      const purpose = req.body?.purpose === "regulated" || req.body?.purpose === "resource"
        ? req.body.purpose as UrlValidationPayload["purpose"]
        : null;
      const submittedUrl = safeHttpUrl(req.body?.url);
      if (!purpose || !submittedUrl) {
        res.status(400).json({ error: "A valid public URL and evidence purpose are required." });
        return;
      }
      if (purpose === "regulated" && !(candidate.regulated_profession || candidate.target_kind === "regulated_review")) {
        res.status(409).json({ error: "Regulated evidence is not applicable to this candidate." });
        return;
      }
      if (purpose === "resource" && candidate.target_kind !== "community_resource") {
        res.status(409).json({ error: "Resource evidence is not applicable to this candidate." });
        return;
      }
      if (locationSigningSecret.length < 32) {
        res.status(503).json({ error: "Directory evidence review is not configured." });
        return;
      }
      const validation = await validateEvidenceUrl(submittedUrl);
      if (!validation) {
        res.status(409).json({ error: "The source URL did not pass the live public-link check.", code: "EVIDENCE_URL_NOT_VALIDATED" });
        return;
      }
      if (purpose === "regulated" && !isOfficialAuthorityUrl(validation.url)) {
        res.status(409).json({ error: "Regulated evidence must resolve to an approved government or configured authority host.", code: "AUTHORITY_HOST_REQUIRED" });
        return;
      }
      res.json({
        validation,
        validationToken: signDirectoryUrlValidation(candidate.id, purpose, validation, locationSigningSecret),
        message: "Live URL validation passed. Complete the remaining review fields before publication.",
      });
    } catch (error: unknown) {
      req.log?.error({ err: error }, "Failed to validate directory evidence URL");
      res.status(500).json({ error: "Failed to validate the evidence URL." });
    }
  });

  app.post("/api/founder/directory-import-candidates/:id/location-suggestion", async (req: Request, res: Response) => {
    if (!requireFounder(req, res)) return;
    try {
      const candidate = await loadCandidate(String(req.params.id), transactionPool);
      if (!candidate) {
        res.status(404).json({ error: "Directory import candidate not found." });
        return;
      }
      if (!isBusinessTarget(candidate)) {
        res.status(409).json({ error: "Location suggestions are available only for business candidates." });
        return;
      }
      const suggestion = await geocode(candidate);
      if (!suggestion) {
        res.status(409).json({
          error: "No address result passed the city, state, street, and house-number checks. Enter reviewed location evidence manually.",
          code: "NO_MATCHING_LOCATION_SUGGESTION",
        });
        return;
      }
      if (locationSigningSecret.length < 32) {
        res.status(503).json({ error: "Directory location review is not configured.", code: "LOCATION_SIGNING_UNAVAILABLE" });
        return;
      }
      res.json({
        suggestion,
        suggestionToken: signDirectoryLocationSuggestion(candidate, suggestion, locationSigningSecret),
        message: "Review the resolved address and source, then explicitly confirm it before publication.",
      });
    } catch (error: unknown) {
      req.log?.error({ err: error }, "Failed to prepare directory candidate location suggestion");
      res.status(500).json({ error: "Failed to prepare a location suggestion." });
    }
  });

  app.post("/api/founder/directory-import-candidates/:id/decision", async (req: Request, res: Response) => {
    const founder = requireFounder(req, res);
    if (!founder) return;
    const body = (req.body ?? {}) as DecisionBody;
    const action = body.action;
    if (!action || !["publish", "link_existing", "needs_research", "decline"].includes(action)) {
      res.status(400).json({ error: "action must be publish, link_existing, needs_research, or decline", code: "INVALID_DECISION" });
      return;
    }
    const idempotencyKey = asTrimmedString(req.header("idempotency-key"), 200);
    if (!idempotencyKey) {
      res.status(400).json({ error: "Idempotency-Key header is required.", code: "IDEMPOTENCY_KEY_REQUIRED" });
      return;
    }
    const candidateId = String(req.params.id);
    const reviewNote = asTrimmedString(body.reviewNote, 2_000);
    const expectedRevision = Number(body.expectedRevision);
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
      res.status(400).json({ error: "expectedRevision must be a non-negative integer.", code: "EXPECTED_REVISION_REQUIRED" });
      return;
    }
    const payloadHash = decisionPayloadHash(body);
    let client: PoolClient | null = null;
    try {
      const replay = await replayedDecision(transactionPool, idempotencyKey, payloadHash);
      if (replay) {
        if (replay.candidate_id !== candidateId) {
          throw new RouteError(409, "IDEMPOTENCY_CANDIDATE_MISMATCH", "This idempotency key belongs to a different candidate.");
        }
        const candidate = await loadCandidate(candidateId, transactionPool);
        res.json({ ok: true, replayed: true, candidate, recordType: replay.published_record_type, recordId: replay.published_record_id });
        return;
      }

      const preflight = await loadCandidate(candidateId, transactionPool);
      if (!preflight) throw new RouteError(404, "CANDIDATE_NOT_FOUND", "Directory import candidate not found.");
      let coordinates: Coordinates | null = null;
      if (action === "publish" && isBusinessTarget(preflight)) {
        coordinates = parseLocationEvidence(body.locationEvidence, preflight, locationSigningSecret);
        if (!coordinates) {
          throw new RouteError(409, "LOCATION_EVIDENCE_REQUIRED", "A reviewer-confirmed, unexpired server-validated location suggestion is required before this business can be published.");
        }
      }

      client = await transactionPool.connect();
      await client.query("BEGIN");
      const candidate = await loadCandidateForUpdate(candidateId, client);
      if (!candidate) throw new RouteError(404, "CANDIDATE_NOT_FOUND", "Directory import candidate not found.");
      const batch = await client.query<{ status: string }>(
        `SELECT status FROM directory_import_batches WHERE id = $1 FOR UPDATE`,
        [candidate.batch_id],
      );
      if (batch.rows[0]?.status !== "in_review") {
        throw new RouteError(
          409,
          "BATCH_NOT_REVIEW_READY",
          "This import batch has not completed atomic staging or is no longer open for review.",
          { batchStatus: batch.rows[0]?.status ?? "missing" },
        );
      }
      if (candidate.review_revision !== expectedRevision) {
        throw new RouteError(409, "STALE_CANDIDATE_REVISION", "This candidate changed after it was loaded. Refresh before deciding.", { currentRevision: candidate.review_revision });
      }
      if (candidate.status === "published" || candidate.status === "declined") {
        throw new RouteError(409, "CANDIDATE_ALREADY_DECIDED", `Candidate is already ${candidate.status}.`);
      }

      const previousStatus = candidate.status;
      const reviewEvidence = buildReviewEvidence(candidate, body, coordinates, locationSigningSecret);
      let newStatus: CandidateStatus;
      let published: { recordType: PublishedRecordType; recordId: string; action: "create" | "link_existing" } | null = null;

      if (action === "needs_research" || action === "decline") {
        if (!reviewNote) {
          throw new RouteError(400, "REVIEW_NOTE_REQUIRED", "A review note is required for this decision.");
        }
        newStatus = action === "decline" ? "declined" : "needs_research";
      } else {
        const holds = evaluatePublicationHolds(candidate, body, locationSigningSecret);
        if (holds.length > 0) {
          throw new RouteError(409, "PUBLICATION_HELD", "This candidate still has required review holds.", { holds });
        }
        if (isBusinessTarget(candidate)) {
          if (action === "publish" && !coordinates) throw new RouteError(409, "LOCATION_EVIDENCE_REQUIRED", "Location evidence is required.");
          published = await publishBusiness(candidate, founder.id, body, coordinates, idempotencyKey, payloadHash, locationSigningSecret, client);
        } else if (candidate.target_kind === "community_resource") {
          published = await publishResource(candidate, founder.id, body, coordinates, idempotencyKey, payloadHash, locationSigningSecret, client);
        } else {
          throw new RouteError(409, "TARGET_NOT_PUBLISHABLE", "This candidate must remain in manual review.");
        }
        newStatus = "published";
      }

      const updated = await client.query<DirectoryImportCandidate>(
        `UPDATE directory_import_candidates
            SET status = $2,
                reviewed_by = $3,
                reviewed_at = NOW(),
                review_note = $4,
                review_evidence = $5::jsonb,
                review_revision = review_revision + 1,
                published_record_type = $6::text,
                published_record_id = $7::text,
                matched_business_id = CASE WHEN $6::text = 'business' THEN $7::varchar ELSE matched_business_id END,
                updated_at = NOW()
          WHERE id = $1 AND review_revision = $8
          RETURNING ${CANDIDATE_COLUMNS}`,
        [
          candidate.id, newStatus, founder.id, reviewNote, JSON.stringify(reviewEvidence),
          published?.recordType ?? null, published?.recordId ?? null, expectedRevision,
        ],
      );
      if (!updated.rows[0]) throw new RouteError(409, "STALE_CANDIDATE_REVISION", "Candidate changed during review.");

      await appendDecisionEvent(client, {
        candidateId: candidate.id,
        batchId: candidate.batch_id,
        actorId: founder.id,
        action,
        previousStatus,
        newStatus,
        reviewNote,
        reviewEvidence,
        idempotencyKey,
        payloadHash,
        publishedRecordType: published?.recordType,
        publishedRecordId: published?.recordId,
      });
      await updateBatchStatus(candidate.batch_id, client);
      await client.query("COMMIT");

      res.json({
        ok: true,
        replayed: false,
        candidate: updated.rows[0],
        recordType: published?.recordType ?? null,
        recordId: published?.recordId ?? null,
        publicationAction: published?.action ?? null,
        message: newStatus === "published"
          ? published?.recordType === "business"
            ? "Founder-curated business published as unclaimed and not verified."
            : "Founder-curated community resource published to Resources."
          : newStatus === "declined"
            ? "Candidate declined."
            : "Candidate held for research.",
      });
    } catch (error: unknown) {
      if (client) await client.query("ROLLBACK").catch(() => undefined);
      if (error instanceof RouteError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code, ...error.details });
        return;
      }
      if (error && typeof error === "object" && (error as { code?: string }).code === "23505") {
        res.status(409).json({ error: "This candidate or canonical identity was already published.", code: "PUBLICATION_CONFLICT" });
        return;
      }
      req.log?.error({ err: error }, "Failed to process directory import decision");
      res.status(500).json({ error: "Failed to process directory import decision." });
    } finally {
      client?.release();
    }
  });
}

export const DIRECTORY_IMPORT_CANDIDATE_COLUMNS = CANDIDATE_COLUMNS;
export const DIRECTORY_RESOURCE_CATEGORIES = [...VALID_RESOURCE_CATEGORIES];
export const DIRECTORY_RESOURCE_SOURCE_TIERS = [...VALID_RESOURCE_TIERS];

import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { DIASPORA_OWNERSHIP_DESIGNATIONS } from "@workspace/constants";
import { isAdmin } from "../lib/adminAuth";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "./documentedDiscoveryEligibility";
import {
  type DirectoryReconciliationAction,
  type DirectoryReconciliationOwnershipStatus,
  type DirectoryReconciliationPresenceStatus,
  type DirectoryReconciliationReasonCode,
  type DirectoryReconciliationState,
  isDirectoryReconciliationReasonCode,
} from "./directoryReconciliationPolicy";

type EvidenceField =
  | "identity"
  | "ownership"
  | "official_website"
  | "official_social"
  | "address"
  | "map_pin";
type EvidenceSourceKind =
  | "business_official"
  | "owner_official"
  | "approved_public"
  | "founder_directory"
  | "official_geocoder";
type EligibilityStatus = "qualified" | "direct_name_only" | "review_hold" | "revoked";
type WebsiteCleanupStatus = "identity_mismatch" | "unsafe_spam" | "inactive_broken";

type WebsiteCleanupInput = Readonly<{
  status: WebsiteCleanupStatus;
  originalWebsite: string;
  finalDestination: string | null;
  evidenceSourceUrl: string;
  evidenceSummary: string;
  checkedAt: string;
}>;

type EvidenceInput = Readonly<{
  field: EvidenceField;
  sourceKind: EvidenceSourceKind;
  sourceUrl: string;
  sourceLabel?: string | null;
  observedAt: string;
  sourceExpiresAt?: string | null;
  confidence: "high" | "medium" | "low";
  observedValue?: Record<string, unknown>;
}>;

type ReviewInput = Readonly<{
  eligibilityStatus: EligibilityStatus;
  decisionReason: string;
  reconciliationReasonCode: DirectoryReconciliationReasonCode;
  batchReference?: string;
  ownershipDesignations?: string[];
  ownershipSourceExpiresAt?: string;
  reviewAfter?: string;
  evidence?: EvidenceInput[];
  websiteCleanup?: WebsiteCleanupInput;
}>;

type MapPinEvidenceReviewInput = Readonly<{
  decisionReason: string;
  addressEvidence: EvidenceInput;
  mapPinEvidence: EvidenceInput;
}>;

const OFFICIAL_SOCIAL_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "tiktok.com",
  "www.tiktok.com",
  "linkedin.com",
  "www.linkedin.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "threads.net",
  "www.threads.net",
  "pinterest.com",
  "www.pinterest.com",
  "bsky.app",
]);
const NON_OFFICIAL_WEBSITE_HOSTS = [
  "yelp.", "yellowpages.", "google.", "g.page", "bing.", "tripadvisor.",
  "foursquare.", "mapquest.", "doordash.", "ubereats.", "grubhub.", "opentable.",
  "etsy.", "amazon.", "facebook.com/marketplace",
];
const EVIDENCE_FIELDS = new Set<EvidenceField>([
  "identity", "ownership", "official_website", "official_social", "address", "map_pin",
]);
const SOURCE_KINDS = new Set<EvidenceSourceKind>([
  "business_official", "owner_official", "approved_public", "founder_directory", "official_geocoder",
]);
const ELIGIBILITY_STATUSES = new Set<EligibilityStatus>([
  "qualified", "direct_name_only", "review_hold", "revoked",
]);
const WEBSITE_CLEANUP_STATUSES = new Set<WebsiteCleanupStatus>([
  "identity_mismatch", "unsafe_spam", "inactive_broken",
]);
const DESIGNATIONS = new Set(DIASPORA_OWNERSHIP_DESIGNATIONS.map((item) => item.toLocaleLowerCase("en-US")));
const OFFICIAL_PRESENCE_SOURCE_KINDS = new Set<EvidenceSourceKind>([
  "business_official", "owner_official",
]);
const IDENTITY_MATCHING_SIGNALS = new Set([
  "business_name", "city", "phone", "address", "official_email_domain", "owner_name", "direct_official_link",
]);
const APPROVED_GEOCODER_HOSTS = new Set([
  "maps.googleapis.com",
  "nominatim.openstreetmap.org",
  "geocoding.geo.census.gov",
]);

function safeHttpsUrl(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS`);
  parsed.hash = "";
  return parsed.toString();
}

function safeHttpUrl(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${label} must use HTTP(S)`);
  parsed.hash = "";
  return parsed.toString();
}

function hostOf(value: string): string {
  return new URL(value).hostname.toLocaleLowerCase("en-US");
}

function isDirectoryOrMarketplaceUrl(value: string): boolean {
  const normalized = `${hostOf(value)}${new URL(value).pathname}`.toLocaleLowerCase("en-US");
  return NON_OFFICIAL_WEBSITE_HOSTS.some((fragment) => normalized.includes(fragment));
}

function asTimestamp(value: unknown, label: string, now: Date, maxFutureDays = 366): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${label} must be an ISO timestamp`);
  if (date.getTime() > now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000) {
    throw new Error(`${label} is implausibly far in the future`);
  }
  return date.toISOString();
}

function futureTimestamp(value: unknown, label: string, now: Date): string {
  const timestamp = asTimestamp(value, label, now);
  if (Date.parse(timestamp) <= now.getTime()) throw new Error(`${label} must be in the future`);
  return timestamp;
}

function normalizedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim().replace(/\s+/g, " ");
  return result ? result.slice(0, maxLength) : null;
}

function normalizedAddress(value: unknown): string | null {
  const text = normalizedText(value, 300);
  return text?.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim() ?? null;
}

function requireFiniteCoordinate(value: unknown, label: "latitude" | "longitude", minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`map pin evidence requires a finite numeric observedValue.${label}`);
  }
  return value;
}

function requireOfficialPresenceIdentity(
  observedValue: Record<string, unknown>,
  field: "official website" | "official social" | "address",
): void {
  const matchingSignals = Array.isArray(observedValue.matchingSignals)
    ? [...new Set(observedValue.matchingSignals.filter((value): value is string => typeof value === "string")
      .map((value) => value.trim()).filter((value) => IDENTITY_MATCHING_SIGNALS.has(value)))]
    : [];
  if (observedValue.identityMatch !== true || matchingSignals.length === 0) {
    throw new Error(`${field} evidence requires identityMatch: true and at least one concrete matching signal`);
  }
}

function validateEvidence(value: unknown, now: Date): EvidenceInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("evidence entries must be objects");
  }
  const raw = value as Record<string, unknown>;
  if (!EVIDENCE_FIELDS.has(raw.field as EvidenceField)) throw new Error("evidence field is invalid");
  if (!SOURCE_KINDS.has(raw.sourceKind as EvidenceSourceKind)) throw new Error("evidence sourceKind is invalid");
  if (!["high", "medium", "low"].includes(raw.confidence as string)) throw new Error("evidence confidence is invalid");
  const sourceUrl = safeHttpsUrl(raw.sourceUrl, "evidence sourceUrl");
  const sourceLabel = normalizedText(raw.sourceLabel, 255);
  const observedAt = asTimestamp(raw.observedAt, "evidence observedAt", now, 1);
  const sourceExpiresAt = raw.sourceExpiresAt == null
    ? null
    : futureTimestamp(raw.sourceExpiresAt, "evidence sourceExpiresAt", now);
  const observedValue = raw.observedValue && typeof raw.observedValue === "object" && !Array.isArray(raw.observedValue)
    ? raw.observedValue as Record<string, unknown>
    : {};
  if (JSON.stringify(observedValue).length > 16_000) throw new Error("evidence observedValue is too large");

  if (raw.field === "official_website") {
    if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(raw.sourceKind as EvidenceSourceKind)) {
      throw new Error("official website evidence must be captured from the business or owner-controlled presence");
    }
    const websiteUrl = safeHttpsUrl(observedValue.websiteUrl, "official website URL");
    if (isDirectoryOrMarketplaceUrl(websiteUrl) || OFFICIAL_SOCIAL_HOSTS.has(hostOf(websiteUrl))) {
      throw new Error("official website may not be a directory, marketplace, or social profile");
    }
    requireOfficialPresenceIdentity(observedValue, "official website");
  }
  if (raw.field === "official_social") {
    if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(raw.sourceKind as EvidenceSourceKind)) {
      throw new Error("official social evidence must be captured from the business or owner-controlled social profile");
    }
    const profileUrl = safeHttpsUrl(observedValue.profileUrl, "official social profile URL");
    if (!OFFICIAL_SOCIAL_HOSTS.has(hostOf(profileUrl))) {
      throw new Error("official social profile must use an approved business-controlled social host");
    }
    if (isDirectoryOrMarketplaceUrl(sourceUrl)) {
      throw new Error("official social evidence may not use a directory or marketplace URL as its proof source");
    }
    // The social profile itself is valid evidence when its identity is checked;
    // social-first businesses are not required to maintain a separate domain.
    requireOfficialPresenceIdentity(observedValue, "official social");
  }
  if (raw.field === "address") {
    const address = normalizedText(observedValue.address, 300);
    if (!address) throw new Error("address evidence requires observedValue.address");
  }
  if (raw.field === "map_pin") {
    const latitude = Number(observedValue.latitude);
    const longitude = Number(observedValue.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("map pin evidence requires finite observedValue.latitude and observedValue.longitude");
    }
  }
  if (raw.field === "ownership" && raw.sourceKind === "official_geocoder") {
    throw new Error("ownership evidence may not use an official geocoder source");
  }
  if (raw.field === "map_pin" && raw.sourceKind !== "official_geocoder") {
    throw new Error("map pin evidence must use the approved geocoder source");
  }

  return {
    field: raw.field as EvidenceField,
    sourceKind: raw.sourceKind as EvidenceSourceKind,
    sourceUrl,
    sourceLabel,
    observedAt,
    sourceExpiresAt,
    confidence: raw.confidence as EvidenceInput["confidence"],
    observedValue,
  };
}

/**
 * Accepts only a map attachment that is anchored to an unchanged stored
 * address, a first-party address page, and an approved geocoder result for
 * that exact address. It deliberately cannot alter identity, ownership,
 * lifecycle, or recommendation eligibility.
 */
export function validateMapPinEvidenceReviewInput(value: unknown, now: Date): MapPinEvidenceReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("request body must be an object");
  const raw = value as Record<string, unknown>;
  const decisionReason = normalizedText(raw.decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) throw new Error("A 3–4,000 character decisionReason is required");
  const addressEvidence = validateEvidence(raw.addressEvidence, now);
  const mapPinEvidence = validateEvidence(raw.mapPinEvidence, now);
  if (addressEvidence.field !== "address") throw new Error("addressEvidence must document the address field");
  if (!OFFICIAL_PRESENCE_SOURCE_KINDS.has(addressEvidence.sourceKind)) {
    throw new Error("address evidence must be captured from the business or owner-controlled presence");
  }
  requireOfficialPresenceIdentity(addressEvidence.observedValue ?? {}, "address");
  if (mapPinEvidence.field !== "map_pin" || mapPinEvidence.sourceKind !== "official_geocoder") {
    throw new Error("mapPinEvidence must be an official-geocoder map pin receipt");
  }
  if (!APPROVED_GEOCODER_HOSTS.has(hostOf(mapPinEvidence.sourceUrl))) {
    throw new Error("map pin evidence must use an approved geocoder endpoint");
  }
  const address = normalizedAddress(addressEvidence.observedValue?.address);
  const geocodedAddress = normalizedAddress(mapPinEvidence.observedValue?.formattedAddress);
  const queryAddress = normalizedAddress(mapPinEvidence.observedValue?.queryAddress);
  if (addressEvidence.observedValue?.addressType !== "physical" || addressEvidence.observedValue?.isServiceArea !== false) {
    throw new Error("address evidence must explicitly document a physical street address, not a service area");
  }
  requireFiniteCoordinate(mapPinEvidence.observedValue?.latitude, "latitude", -90, 90);
  requireFiniteCoordinate(mapPinEvidence.observedValue?.longitude, "longitude", -180, 180);
  if (!address || !geocodedAddress || !queryAddress || mapPinEvidence.observedValue?.addressMatch !== true
      || geocodedAddress !== address || queryAddress !== address) {
    throw new Error("map pin evidence must record an exact approved-geocoder address match");
  }
  return {
    decisionReason,
    addressEvidence,
    mapPinEvidence,
  };
}

export function storedAddressMatchesMapEvidence(storedAddress: unknown, input: MapPinEvidenceReviewInput): boolean {
  const stored = normalizedAddress(storedAddress);
  const evidenced = normalizedAddress(input.addressEvidence.observedValue?.address);
  return Boolean(stored && evidenced && stored === evidenced);
}

export function mapPinOnlyPatch(
  input: MapPinEvidenceReviewInput,
  addressEvidenceId: string,
  mapPinEvidenceId: string,
): Readonly<{ latitude: number; longitude: number; addressEvidenceId: string; mapPinEvidenceId: string }> {
  return Object.freeze({
    latitude: input.mapPinEvidence.observedValue?.latitude as number,
    longitude: input.mapPinEvidence.observedValue?.longitude as number,
    addressEvidenceId,
    mapPinEvidenceId,
  });
}

function validateWebsiteCleanup(value: unknown, now: Date): WebsiteCleanupInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("websiteCleanup must be an object");
  }
  const raw = value as Record<string, unknown>;
  if (!WEBSITE_CLEANUP_STATUSES.has(raw.status as WebsiteCleanupStatus)) {
    throw new Error("websiteCleanup status is invalid");
  }
  const originalWebsite = safeHttpUrl(raw.originalWebsite, "websiteCleanup originalWebsite");
  const finalDestination = raw.finalDestination == null || raw.finalDestination === ""
    ? null
    : safeHttpUrl(raw.finalDestination, "websiteCleanup finalDestination");
  const evidenceSourceUrl = safeHttpsUrl(raw.evidenceSourceUrl, "websiteCleanup evidenceSourceUrl");
  const evidenceSummary = normalizedText(raw.evidenceSummary, 4_000);
  if (!evidenceSummary || evidenceSummary.length < 3) {
    throw new Error("websiteCleanup evidenceSummary is required");
  }
  return {
    status: raw.status as WebsiteCleanupStatus,
    originalWebsite,
    finalDestination,
    evidenceSourceUrl,
    evidenceSummary,
    checkedAt: asTimestamp(raw.checkedAt, "websiteCleanup checkedAt", now, 1),
  };
}

export function validateDocumentedDiscoveryReviewInput(value: unknown, now: Date): ReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("request body must be an object");
  const raw = value as Record<string, unknown>;
  if (!ELIGIBILITY_STATUSES.has(raw.eligibilityStatus as EligibilityStatus)) {
    throw new Error("eligibilityStatus is invalid");
  }
  const decisionReason = normalizedText(raw.decisionReason, 4_000);
  if (!decisionReason || decisionReason.length < 3) throw new Error("A 3–4,000 character decisionReason is required");
  const ownershipDesignations = Array.isArray(raw.ownershipDesignations)
    ? [...new Set(raw.ownershipDesignations.filter((value): value is string => typeof value === "string")
      .map((value) => value.trim()).filter(Boolean))]
    : [];
  if (ownershipDesignations.some((value) => !DESIGNATIONS.has(value.toLocaleLowerCase("en-US")))) {
    throw new Error("ownershipDesignations must use approved documented diaspora designations");
  }
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.map((item) => validateEvidence(item, now))
    : [];
  const websiteCleanup = raw.websiteCleanup == null
    ? undefined
    : validateWebsiteCleanup(raw.websiteCleanup, now);
  const counts = new Map<EvidenceField, number>();
  for (const item of evidence) counts.set(item.field, (counts.get(item.field) ?? 0) + 1);
  if ([...counts.values()].some((count) => count > 1)) throw new Error("submit at most one receipt per evidence field per decision");
  const eligibilityStatus = raw.eligibilityStatus as EligibilityStatus;
  const ownershipSourceExpiresAt = raw.ownershipSourceExpiresAt == null
    ? undefined
    : futureTimestamp(raw.ownershipSourceExpiresAt, "ownershipSourceExpiresAt", now);
  const reviewAfter = raw.reviewAfter == null
    ? undefined
    : futureTimestamp(raw.reviewAfter, "reviewAfter", now);
  const defaultReasonCode: DirectoryReconciliationReasonCode = eligibilityStatus === "qualified"
    ? websiteCleanup
      ? (`website_removed_${websiteCleanup.status}` as DirectoryReconciliationReasonCode)
      : counts.has("official_social") && !counts.has("official_website")
        ? "social_only_public_business"
        : "source_ownership_and_official_presence_verified"
    : "official_presence_unverified";
  const reconciliationReasonCode = raw.reconciliationReasonCode == null
    ? defaultReasonCode
    : String(raw.reconciliationReasonCode).trim();
  if (!isDirectoryReconciliationReasonCode(reconciliationReasonCode)) {
    throw new Error("reconciliationReasonCode is invalid");
  }
  const batchReference = normalizedText(raw.batchReference, 160) ?? undefined;

  if (eligibilityStatus === "qualified") {
    if (!counts.has("ownership") || (!counts.has("official_website") && !counts.has("official_social"))) {
      throw new Error("qualified eligibility requires ownership plus an official website or official social receipt");
    }
    if (ownershipDesignations.length === 0) throw new Error("qualified eligibility requires a documented ownership designation");
    if (!ownershipSourceExpiresAt || !reviewAfter) {
      throw new Error("qualified eligibility requires ownershipSourceExpiresAt and reviewAfter");
    }
    if (counts.has("map_pin") && !counts.has("address")) {
      throw new Error("map pin qualification requires a documented physical-address receipt");
    }
  } else if ((evidence.length > 0 || ownershipDesignations.length > 0 || ownershipSourceExpiresAt || reviewAfter) && !websiteCleanup) {
    throw new Error("non-qualified decisions retain no active recommendation receipts; submit the review state only");
  }

  return {
    eligibilityStatus,
    decisionReason,
    reconciliationReasonCode,
    batchReference,
    ownershipDesignations,
    ownershipSourceExpiresAt,
    reviewAfter,
    evidence,
    websiteCleanup,
  };
}

function directoryReconciliationOutcome(input: ReviewInput): Readonly<{
  state: DirectoryReconciliationState;
  reasonCode: DirectoryReconciliationReasonCode;
  presenceStatus: DirectoryReconciliationPresenceStatus;
  ownershipStatus: DirectoryReconciliationOwnershipStatus;
  recommendedAction: DirectoryReconciliationAction;
}> {
  const evidenceByField = new Map((input.evidence ?? []).map((evidence) => [evidence.field, evidence]));
  const hasWebsite = evidenceByField.has("official_website");
  const hasSocial = evidenceByField.has("official_social");
  const presenceStatus: DirectoryReconciliationPresenceStatus = hasWebsite && hasSocial
    ? "valid_website_and_social"
    : hasWebsite
      ? "valid_website"
      : hasSocial
        ? "valid_social"
        : input.websiteCleanup
          ? (`website_removed_${input.websiteCleanup.status}` as DirectoryReconciliationPresenceStatus)
          : "official_presence_unverified";
  const ownershipEvidence = evidenceByField.get("ownership");
  const ownershipStatus: DirectoryReconciliationOwnershipStatus = input.eligibilityStatus === "qualified"
    ? (ownershipEvidence?.sourceKind === "business_official" || ownershipEvidence?.sourceKind === "owner_official")
      ? "officially_stated"
      : "source_documented"
    : input.reconciliationReasonCode === "identity_conflict"
      ? "ownership_conflict"
      : "ownership_unverified";
  if (input.eligibilityStatus === "qualified") {
    return {
      state: "reviewed_qualified",
      reasonCode: input.reconciliationReasonCode,
      presenceStatus,
      ownershipStatus,
      recommendedAction: "qualify_kinfolk_current",
    };
  }
  const archiveActionByReason: Partial<Record<DirectoryReconciliationReasonCode, DirectoryReconciliationAction>> = {
    confirmed_closed: "archive_confirmed_closed",
    confirmed_duplicate: "archive_confirmed_duplicate",
    confirmed_fraud_or_unsafe: "archive_confirmed_fraud_or_unsafe",
    documented_safety_or_legal_removal: "archive_documented_safety_or_legal",
  };
  const archiveAction = archiveActionByReason[input.reconciliationReasonCode];
  return {
    state: archiveAction ? "reversible_public_hold" : "requires_reconciliation",
    reasonCode: input.reconciliationReasonCode,
    presenceStatus,
    ownershipStatus,
    recommendedAction: archiveAction ?? "reconcile",
  };
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    return false;
  }
  return true;
}

export function registerDocumentedDiscoveryReviewRoutes(app: Express): void {
  /** Admin-only review queue; this is evidence work, never a public catalogue read. */
  app.get("/api/admin/business-discovery/review-queue", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const state = typeof req.query.state === "string" ? req.query.state.trim().toUpperCase() : "";
    const limit = Math.min(250, Math.max(1, Number.parseInt(String(req.query.limit ?? "100"), 10) || 100));
    const params: unknown[] = [];
    const conditions = ["b.status NOT IN ('removed', 'deleted')"];
    if (city) { params.push(city); conditions.push(`LOWER(BTRIM(COALESCE(b.city, ''))) = LOWER(BTRIM($${params.length}))`); }
    if (state) { params.push(state); conditions.push(`UPPER(BTRIM(COALESCE(b.state, ''))) = $${params.length}`); }
    params.push(limit);
    try {
      const { rows } = await pool.query(
        `SELECT b.id, b.name, b.city, b.state, b.website, b.instagram, b.facebook, b.tiktok,
                b.address, b.latitude, b.longitude, b.ownership_designations, b.research_source_url,
                b.research_source_label, b.listing_status, b.status,
                e.eligibility_status, e.ownership_source_expires_at, e.review_after, e.updated_at
           FROM businesses b
           LEFT JOIN business_discovery_eligibility e ON e.business_id::text = b.id::text
          WHERE ${conditions.join(" AND ")}
          ORDER BY CASE WHEN e.eligibility_status = 'qualified' THEN 1 ELSE 0 END,
                   b.city ASC NULLS LAST, b.name ASC
          LIMIT $${params.length}`,
        params,
      );
      res.json({ policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION, records: rows });
    } catch (error) {
      req.log.error({ error }, "Failed to load documented discovery review queue");
      res.status(500).json({ error: "Failed to load review queue" });
    }
  });

  /**
   * Sole mutation path for the eligibility gate. It preserves raw receipts and
   * an immutable before/after audit event. On qualification it enriches only
   * the official website/social and sourced address fields named in the new
   * evidence; it never infers ownership, changes map coordinates, claim state,
   * or listing lifecycle.
   */
  app.put("/api/admin/businesses/:id/documented-discovery-eligibility", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    if (!businessId || businessId.length > 255) {
      res.status(400).json({ error: "A valid business id is required" });
      return;
    }
    let input: ReviewInput;
    try {
      input = validateDocumentedDiscoveryReviewInput(req.body, new Date());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid review request" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingBusiness = await client.query<{ id: string; name: string; website: string | null }>(
        `SELECT id, name, website FROM businesses
          WHERE id = $1 AND status NOT IN ('removed', 'deleted')
          FOR UPDATE`,
        [businessId],
      );
      if (existingBusiness.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      if (input.websiteCleanup) {
        const storedWebsite = existingBusiness.rows[0].website?.trim() ?? "";
        const submittedWebsite = input.websiteCleanup.originalWebsite.trim();
        const normalize = (value: string) => value.replace(/\/$/, "").toLocaleLowerCase("en-US");
        if (!storedWebsite || normalize(storedWebsite) !== normalize(submittedWebsite)) {
          await client.query("ROLLBACK");
          res.status(409).json({ error: "websiteCleanup originalWebsite does not match the currently stored public website" });
          return;
        }
      }
      const prior = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(e) AS state FROM business_discovery_eligibility e WHERE e.business_id = $1`,
        [businessId],
      );
      const priorReconciliation = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(ledger) AS state
           FROM business_directory_reconciliation_ledger ledger
          WHERE ledger.business_id = $1
          FOR UPDATE`,
        [businessId],
      );
      const evidenceIds = new Map<EvidenceField, string>();
      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      for (const evidence of input.evidence ?? []) {
        const id = randomUUID();
        evidenceIds.set(evidence.field, id);
        await client.query(
          `INSERT INTO business_profile_evidence_receipts (
             id, business_id, field_name, source_kind, source_url, source_label,
             observed_at, source_expires_at, confidence, observed_value, captured_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10::jsonb, $11)`,
          [
            id, businessId, evidence.field, evidence.sourceKind, evidence.sourceUrl, evidence.sourceLabel,
            evidence.observedAt, evidence.sourceExpiresAt ?? null, evidence.confidence,
            JSON.stringify(evidence.observedValue ?? {}), actorId,
          ],
        );
      }
      // Enrich only fields that the active review receipt expressly supports.
      // This replaces an old directory/marketplace website with an official
      // domain and never guesses a social handle, address, or ownership label.
      if (input.eligibilityStatus === "qualified" || input.websiteCleanup) {
        const evidenceByField = new Map((input.evidence ?? []).map((evidence) => [evidence.field, evidence]));
        const officialWebsite = evidenceByField.get("official_website")?.observedValue?.websiteUrl;
        const officialSocial = evidenceByField.get("official_social")?.observedValue?.profileUrl;
        const sourceAddress = evidenceByField.get("address")?.observedValue?.address;
        const mapPin = evidenceByField.get("map_pin")?.observedValue;
        const profilePatch: Record<string, string | null> = {
          website: typeof officialWebsite === "string" ? officialWebsite : null,
          instagram: null,
          facebook: null,
          tiktok: null,
          address: typeof sourceAddress === "string" ? sourceAddress.trim() : null,
          latitude: mapPin && Number.isFinite(Number(mapPin.latitude)) ? String(mapPin.latitude) : null,
          longitude: mapPin && Number.isFinite(Number(mapPin.longitude)) ? String(mapPin.longitude) : null,
        };
        if (typeof officialSocial === "string") {
          const host = hostOf(officialSocial);
          if (host.endsWith("instagram.com")) profilePatch.instagram = officialSocial;
          if (host.endsWith("facebook.com")) profilePatch.facebook = officialSocial;
          if (host.endsWith("tiktok.com")) profilePatch.tiktok = officialSocial;
          // LinkedIn, YouTube, and other approved social receipts remain in the
          // immutable eligibility evidence even though the legacy profile table
          // has no matching URL columns. They are still complete presence proof.
        }
        await client.query(
          `UPDATE businesses
              SET website = CASE WHEN $2 THEN $3 ELSE COALESCE($3, website) END,
                  instagram = COALESCE($4, instagram),
                  facebook = COALESCE($5, facebook),
                  tiktok = COALESCE($6, tiktok),
                  address = COALESCE($7, address),
                  latitude = COALESCE($8::numeric, latitude),
                  longitude = COALESCE($9::numeric, longitude),
                  website_cleanup_status = CASE WHEN $2 THEN $10 ELSE website_cleanup_status END,
                  website_cleanup_at = CASE WHEN $2 THEN now() ELSE website_cleanup_at END,
                  updated_at = now()
            WHERE id = $1`,
          [
            businessId,
            Boolean(input.websiteCleanup),
            profilePatch.website,
            profilePatch.instagram,
            profilePatch.facebook,
            profilePatch.tiktok,
            profilePatch.address,
            profilePatch.latitude,
            profilePatch.longitude,
            input.websiteCleanup?.status ?? null,
          ],
        );
      }
      if (input.websiteCleanup) {
        await client.query(
          `INSERT INTO business_website_cleanup_audit_events (
             id, business_id, original_website, final_destination, cleanup_status,
             reason, evidence_source_url, evidence_summary, checked_at, actor_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10)`,
          [
            randomUUID(), businessId, input.websiteCleanup.originalWebsite,
            input.websiteCleanup.finalDestination, input.websiteCleanup.status,
            input.decisionReason, input.websiteCleanup.evidenceSourceUrl,
            JSON.stringify({ summary: input.websiteCleanup.evidenceSummary }),
            input.websiteCleanup.checkedAt, actorId,
          ],
        );
      }
      const existing = prior.rows[0]?.state ?? {};
      const retainedId = (column: string) => typeof existing[column] === "string" ? existing[column] : null;
      const next = await client.query<{ state: Record<string, unknown> }>(
        `INSERT INTO business_discovery_eligibility (
           business_id, eligibility_status, policy_version, identity_evidence_id,
           ownership_evidence_id, official_website_evidence_id, official_social_evidence_id,
           address_evidence_id, map_pin_evidence_id, ownership_designations,
           ownership_source_expires_at, review_after, decision_reason, decided_by, decided_at, updated_at
         ) VALUES (
           $1, $2, $3, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8::uuid, $9::uuid,
           $10::jsonb, $11::timestamptz, $12::timestamptz, $13, $14, now(), now()
         ) ON CONFLICT (business_id) DO UPDATE SET
           eligibility_status = EXCLUDED.eligibility_status,
           policy_version = EXCLUDED.policy_version,
           identity_evidence_id = EXCLUDED.identity_evidence_id,
           ownership_evidence_id = EXCLUDED.ownership_evidence_id,
           official_website_evidence_id = EXCLUDED.official_website_evidence_id,
           official_social_evidence_id = EXCLUDED.official_social_evidence_id,
           address_evidence_id = EXCLUDED.address_evidence_id,
           map_pin_evidence_id = EXCLUDED.map_pin_evidence_id,
           ownership_designations = EXCLUDED.ownership_designations,
           ownership_source_expires_at = EXCLUDED.ownership_source_expires_at,
           review_after = EXCLUDED.review_after,
           decision_reason = EXCLUDED.decision_reason,
           decided_by = EXCLUDED.decided_by,
           decided_at = now(),
           updated_at = now()
         RETURNING to_jsonb(business_discovery_eligibility) AS state`,
        [
          businessId,
          input.eligibilityStatus,
          DOCUMENTED_DISCOVERY_POLICY_VERSION,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("identity") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("ownership") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("official_website") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("official_social") : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("address") ?? null : null,
          input.eligibilityStatus === "qualified" ? evidenceIds.get("map_pin") ?? null : null,
          JSON.stringify(input.eligibilityStatus === "qualified" ? input.ownershipDesignations ?? [] : []),
          input.eligibilityStatus === "qualified" ? input.ownershipSourceExpiresAt : null,
          input.eligibilityStatus === "qualified" ? input.reviewAfter : null,
          input.decisionReason,
          actorId,
        ],
      );
      const action = input.eligibilityStatus === "qualified" && existing.eligibility_status === "qualified"
        ? "requalified"
        : input.eligibilityStatus;
      await client.query(
        `INSERT INTO business_discovery_eligibility_audit_events (
           id, business_id, action, actor_id, reason, before_state, after_state
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`,
        [
          randomUUID(), businessId, action, actorId, input.decisionReason,
          JSON.stringify(existing), JSON.stringify(next.rows[0]?.state ?? {}),
        ],
      );
      const reconciliation = directoryReconciliationOutcome(input);
      const reconciliationEvidenceIds = [...evidenceIds.values()];
      const reconciliationNext = await client.query<{ state: Record<string, unknown> }>(
        `INSERT INTO business_directory_reconciliation_ledger (
           business_id, reconciliation_state, reason_code, presence_status,
           ownership_status, recommended_action, evidence_receipt_ids,
           batch_reference, reviewed_at, reviewed_by, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7::jsonb, $8, now(), $9, now()
         ) ON CONFLICT (business_id) DO UPDATE SET
           reconciliation_state = EXCLUDED.reconciliation_state,
           reason_code = EXCLUDED.reason_code,
           presence_status = EXCLUDED.presence_status,
           ownership_status = EXCLUDED.ownership_status,
           recommended_action = EXCLUDED.recommended_action,
           evidence_receipt_ids = EXCLUDED.evidence_receipt_ids,
           batch_reference = EXCLUDED.batch_reference,
           reviewed_at = now(),
           reviewed_by = EXCLUDED.reviewed_by,
           updated_at = now()
         RETURNING to_jsonb(business_directory_reconciliation_ledger) AS state`,
        [
          businessId, reconciliation.state, reconciliation.reasonCode,
          reconciliation.presenceStatus, reconciliation.ownershipStatus,
          reconciliation.recommendedAction, JSON.stringify(reconciliationEvidenceIds),
          input.batchReference ?? null, actorId,
        ],
      );
      await client.query(
        `INSERT INTO business_directory_reconciliation_audit_events (
           id, business_id, action, actor_user_id, reason_code, reason,
           evidence_receipt_ids, before_state, after_state
         ) VALUES ($1, $2, 'review', $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)`,
        [
          randomUUID(), businessId, actorId, reconciliation.reasonCode,
          input.decisionReason, JSON.stringify(reconciliationEvidenceIds),
          JSON.stringify(priorReconciliation.rows[0]?.state ?? {}),
          JSON.stringify(reconciliationNext.rows[0]?.state ?? {}),
        ],
      );
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        eligibility: next.rows[0]?.state ?? null,
        reconciliation: reconciliationNext.rows[0]?.state ?? null,
        message: input.eligibilityStatus === "qualified"
          ? "Profile is qualified for documented recommendation surfaces until its next evidence review."
          : "Profile is retained for direct named lookup and excluded from ordinary recommendation surfaces.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId }, "Failed to record documented discovery eligibility");
      res.status(500).json({ error: "Failed to record discovery review" });
    } finally {
      client.release();
    }
  });

  /**
   * Map-only control path. It is intentionally separate from eligibility
   * review so an address/geocode repair cannot requalify a business, change a
   * public profile field, or carry identity/contact evidence across records.
   */
  app.put("/api/admin/businesses/:id/map-pin-evidence", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const businessId = String(req.params.id ?? "").trim();
    if (!businessId || businessId.length > 255) {
      res.status(400).json({ error: "A valid business id is required" });
      return;
    }
    let input: MapPinEvidenceReviewInput;
    try {
      input = validateMapPinEvidenceReviewInput(req.body, new Date());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid map evidence request" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingBusiness = await client.query<{
        id: string;
        name: string;
        address: string | null;
        latitude: string | null;
        longitude: string | null;
      }>(
        `SELECT id, name, address, latitude, longitude
           FROM businesses
          WHERE id = $1 AND status NOT IN ('removed', 'deleted')
          FOR UPDATE`,
        [businessId],
      );
      if (existingBusiness.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      const activeEligibility = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(e) AS state
           FROM business_discovery_eligibility e
          WHERE e.business_id = $1
            AND e.eligibility_status = 'qualified'
            AND e.identity_evidence_id IS NOT NULL
            AND e.ownership_evidence_id IS NOT NULL
            AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
            AND e.ownership_source_expires_at > now()
            AND e.review_after > now()
          FOR UPDATE`,
        [businessId],
      );
      if (activeEligibility.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "An active documented eligibility record is required before a map pin can be attached" });
        return;
      }
      if (!storedAddressMatchesMapEvidence(existingBusiness.rows[0].address, input)) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The evidenced physical address must exactly match the currently stored business address; address changes require separate review" });
        return;
      }
      const priorLedger = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(ledger) AS state
           FROM business_directory_reconciliation_ledger ledger
          WHERE ledger.business_id = $1
          FOR UPDATE`,
        [businessId],
      );
      if (priorLedger.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "A reconciliation ledger record is required before a map pin can be attached" });
        return;
      }

      const actorId = typeof (req as any).user?.id === "string" ? (req as any).user.id : "automation";
      const addressEvidenceId = randomUUID();
      const mapPinEvidenceId = randomUUID();
      const patch = mapPinOnlyPatch(input, addressEvidenceId, mapPinEvidenceId);
      for (const [id, evidence] of [[addressEvidenceId, input.addressEvidence], [mapPinEvidenceId, input.mapPinEvidence]] as const) {
        await client.query(
          `INSERT INTO business_profile_evidence_receipts (
             id, business_id, field_name, source_kind, source_url, source_label,
             observed_at, source_expires_at, confidence, observed_value, captured_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10::jsonb, $11)`,
          [
            id, businessId, evidence.field, evidence.sourceKind, evidence.sourceUrl, evidence.sourceLabel,
            evidence.observedAt, evidence.sourceExpiresAt ?? null, evidence.confidence,
            JSON.stringify(evidence.observedValue ?? {}), actorId,
          ],
        );
      }
      await client.query(
        `UPDATE businesses
            SET latitude = $2::numeric,
                longitude = $3::numeric
          WHERE id = $1`,
        [businessId, String(patch.latitude), String(patch.longitude)],
      );
      const nextEligibility = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE business_discovery_eligibility
            SET address_evidence_id = $2::uuid,
                map_pin_evidence_id = $3::uuid
          WHERE business_id = $1
          RETURNING to_jsonb(business_discovery_eligibility) AS state`,
        [businessId, patch.addressEvidenceId, patch.mapPinEvidenceId],
      );
      await client.query(
        `INSERT INTO business_discovery_eligibility_audit_events (
           id, business_id, action, actor_id, reason, before_state, after_state
         ) VALUES ($1, $2, 'map_pin_attached', $3, $4, $5::jsonb, $6::jsonb)`,
        [
          randomUUID(), businessId, actorId, input.decisionReason,
          JSON.stringify(activeEligibility.rows[0].state), JSON.stringify(nextEligibility.rows[0]?.state ?? {}),
        ],
      );
      const nextLedger = await client.query<{ state: Record<string, unknown> }>(
        `UPDATE business_directory_reconciliation_ledger
            SET evidence_receipt_ids = evidence_receipt_ids || $2::jsonb
          WHERE business_id = $1
          RETURNING to_jsonb(business_directory_reconciliation_ledger) AS state`,
        [businessId, JSON.stringify([addressEvidenceId, mapPinEvidenceId])],
      );
      await client.query(
        `INSERT INTO business_directory_reconciliation_audit_events (
           id, business_id, action, actor_user_id, reason_code, reason,
           evidence_receipt_ids, before_state, after_state
         ) VALUES ($1, $2, 'review', $3, 'source_ownership_and_official_presence_verified', $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
        [
          randomUUID(), businessId, actorId, input.decisionReason,
          JSON.stringify([addressEvidenceId, mapPinEvidenceId]),
          JSON.stringify(priorLedger.rows[0].state), JSON.stringify(nextLedger.rows[0]?.state ?? {}),
        ],
      );
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        mapEvidence: { addressEvidenceId, mapPinEvidenceId },
        message: "Audited map evidence attached without changing eligibility, ownership, lifecycle, contacts, or address.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      req.log.error({ error, businessId }, "Failed to attach audited map pin evidence");
      res.status(500).json({ error: "Failed to attach audited map pin evidence" });
    } finally {
      client.release();
    }
  });
}

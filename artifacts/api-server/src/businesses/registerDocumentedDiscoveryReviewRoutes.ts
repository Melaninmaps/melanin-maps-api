import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { DIASPORA_OWNERSHIP_DESIGNATIONS } from "@workspace/constants";
import { isAdmin } from "../lib/adminAuth";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "./documentedDiscoveryEligibility";

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
  ownershipDesignations?: string[];
  ownershipSourceExpiresAt?: string;
  reviewAfter?: string;
  evidence?: EvidenceInput[];
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
const DESIGNATIONS = new Set(DIASPORA_OWNERSHIP_DESIGNATIONS.map((item) => item.toLocaleLowerCase("en-US")));

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
    const websiteUrl = safeHttpsUrl(observedValue.websiteUrl, "official website URL");
    if (isDirectoryOrMarketplaceUrl(websiteUrl) || OFFICIAL_SOCIAL_HOSTS.has(hostOf(websiteUrl))) {
      throw new Error("official website may not be a directory, marketplace, or social profile");
    }
  }
  if (raw.field === "official_social") {
    const profileUrl = safeHttpsUrl(observedValue.profileUrl, "official social profile URL");
    if (!OFFICIAL_SOCIAL_HOSTS.has(hostOf(profileUrl))) {
      throw new Error("official social profile must use an approved business-controlled social host");
    }
    if (
      raw.sourceKind !== "founder_directory"
      && (isDirectoryOrMarketplaceUrl(sourceUrl) || OFFICIAL_SOCIAL_HOSTS.has(hostOf(sourceUrl)))
    ) {
      throw new Error("official social evidence must be observed from an official website or approved source, not a directory or the social profile itself");
    }
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
  } else if (evidence.length > 0 || ownershipDesignations.length > 0 || ownershipSourceExpiresAt || reviewAfter) {
    throw new Error("non-qualified decisions retain no active recommendation receipts; submit the review state only");
  }

  return {
    eligibilityStatus,
    decisionReason,
    ownershipDesignations,
    ownershipSourceExpiresAt,
    reviewAfter,
    evidence,
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
      const existingBusiness = await client.query<{ id: string; name: string }>(
        `SELECT id, name FROM businesses
          WHERE id = $1 AND status NOT IN ('removed', 'deleted')
          FOR UPDATE`,
        [businessId],
      );
      if (existingBusiness.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Business not found" });
        return;
      }
      const prior = await client.query<{ state: Record<string, unknown> }>(
        `SELECT to_jsonb(e) AS state FROM business_discovery_eligibility e WHERE e.business_id = $1`,
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
      if (input.eligibilityStatus === "qualified") {
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
              SET website = COALESCE($2, website),
                  instagram = COALESCE($3, instagram),
                  facebook = COALESCE($4, facebook),
                  tiktok = COALESCE($5, tiktok),
                  address = COALESCE($6, address),
                  latitude = COALESCE($7::numeric, latitude),
                  longitude = COALESCE($8::numeric, longitude),
                  updated_at = now()
            WHERE id = $1`,
          [
            businessId,
            profilePatch.website,
            profilePatch.instagram,
            profilePatch.facebook,
            profilePatch.tiktok,
            profilePatch.address,
            profilePatch.latitude,
            profilePatch.longitude,
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
      await client.query("COMMIT");
      res.json({
        ok: true,
        businessId,
        policyVersion: DOCUMENTED_DISCOVERY_POLICY_VERSION,
        eligibility: next.rows[0]?.state ?? null,
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
}

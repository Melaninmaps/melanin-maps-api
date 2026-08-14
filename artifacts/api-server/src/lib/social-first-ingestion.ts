/**
 * Social-First Business Ingestion — MWM
 *
 * Accepts businesses discovered via TikTok, Instagram, Facebook, or any
 * social/screenshot source. Enforces evidence gates before any insert:
 *   - Identity evidence required (or user-supplied social handle)
 *   - Location evidence required (address+city+state, or coords+evidence)
 *   - Ownership evidence required when an ownership claim is made
 *   - Category required
 *
 * All DB operations use pool.query raw SQL (not Drizzle) per the esbuild
 * bundle safety pattern used throughout this codebase.
 */

import { z } from "zod";
import { pool } from "@workspace/db";
import { logger } from "./logger";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const SocialProfileSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "facebook"]),
  url: z.string().url(),
  handle: z.string().nullable().optional(),
  suppliedByUser: z.boolean().default(false),
});

export const EvidenceSchema = z.object({
  url: z.string().url().nullable(),
  sourceType: z.enum(["official_website", "google_places", "social_profile", "directory", "screenshot", "user_supplied"]),
  field: z.enum(["identity", "address", "category", "ownership", "phone", "website", "social_profile", "open_status"]),
  supports: z.boolean(),
  excerpt: z.string().max(1000).nullable().optional(),
});

export const CandidateSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().max(120).nullable(),
  city: z.string().max(120).nullable(),
  state: z.string().max(80).nullable(),
  address: z.string().max(300).nullable(),
  latitude: z.number().gte(-90).lte(90).nullable(),
  longitude: z.number().gte(-180).lte(180).nullable(),
  phone: z.string().max(40).nullable(),
  website: z.string().url().nullable().optional(),
  socialProfiles: z.array(SocialProfileSchema).default([]),
  ownershipClaim: z.string().max(200).nullable(),
  ownershipEvidence: z.array(EvidenceSchema).default([]),
  sourceEvidence: z.array(EvidenceSchema).default([]),
  sourceInput: z.enum(["natural_language", "screenshot", "url", "social_url", "admin_search"]),
});

export type Candidate = z.infer<typeof CandidateSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type SocialProfile = z.infer<typeof SocialProfileSchema>;

// ── String normalization helpers ──────────────────────────────────────────────

export function norm(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizedUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.startsWith("http") ? value : `https://${value}`);
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname.replace(/\/$/, "");
    return u.toString().toLowerCase();
  } catch {
    return null;
  }
}

export function websiteHost(value: string | null | undefined): string | null {
  const u = normalizedUrl(value);
  if (!u) return null;
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function phoneKey(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

// ── Social-aware dedupe key ───────────────────────────────────────────────────
// Extends the base dedupe_key with sorted social profile URLs so two
// records discovered via different social platforms are still caught.

export function socialDedupeKey(candidate: Candidate): string {
  const social = candidate.socialProfiles
    .map((p) => normalizedUrl(p.url))
    .filter(Boolean)
    .sort()
    .join(",");
  return [
    norm(candidate.name),
    norm(candidate.address),
    norm(candidate.city),
    norm(candidate.state),
    phoneKey(candidate.phone) ?? "",
    websiteHost(candidate.website) ?? "",
    social,
  ].join("|");
}

// ── Evidence gates ────────────────────────────────────────────────────────────

function hasFieldEvidence(candidate: Candidate, field: string): boolean {
  return (
    [...candidate.sourceEvidence, ...candidate.ownershipEvidence].some(
      (e) => e.field === field && e.supports === true,
    ) || (field === "social_profile" && candidate.socialProfiles.length > 0)
  );
}

function hasIdentityEvidence(candidate: Candidate): boolean {
  return (
    hasFieldEvidence(candidate, "identity") ||
    candidate.socialProfiles.some((p) => p.suppliedByUser)
  );
}

function hasLocationEvidence(candidate: Candidate): boolean {
  return (
    Boolean(candidate.address && candidate.city && candidate.state) ||
    (candidate.latitude !== null &&
      candidate.longitude !== null &&
      hasFieldEvidence(candidate, "address"))
  );
}

function hasOwnershipEvidence(candidate: Candidate, requestedOwnership: string | null): boolean {
  return (
    !requestedOwnership ||
    candidate.ownershipEvidence.some((e) => e.field === "ownership" && e.supports === true)
  );
}

function rejectReason(candidate: Candidate, requestedOwnership: string | null): string | null {
  if (!hasIdentityEvidence(candidate)) return "identity_not_supported";
  if (!hasLocationEvidence(candidate)) return "location_not_supported";
  if (!hasOwnershipEvidence(candidate, requestedOwnership)) return "ownership_not_supported";
  if (!candidate.category) return "category_missing";
  return null;
}

// ── Evidence merge helpers ────────────────────────────────────────────────────

function socialEvidence(candidate: Candidate): Evidence[] {
  return candidate.socialProfiles.map((p) => ({
    url: p.url,
    sourceType: "social_profile" as const,
    field: "social_profile" as const,
    supports: true,
    excerpt: p.handle ?? null,
  }));
}

function mergeEvidence(existing: Evidence[], incoming: Evidence[]): Evidence[] {
  const byKey = new Map<string, Evidence>();
  for (const e of [...existing, ...incoming]) {
    byKey.set(`${e.field}|${e.url}|${e.sourceType}`, e);
  }
  return [...byKey.values()];
}

function mergeSocialProfiles(existing: SocialProfile[], incoming: SocialProfile[]): SocialProfile[] {
  const byUrl = new Map<string, SocialProfile>();
  for (const p of [...existing, ...incoming]) {
    const u = normalizedUrl(p.url);
    if (u) byUrl.set(u, { ...p, url: u });
  }
  return [...byUrl.values()];
}

// ── Duplicate detection ───────────────────────────────────────────────────────

async function findExisting(candidate: Candidate): Promise<{
  id: string;
  social_profiles: SocialProfile[] | null;
  source_evidence: Evidence[] | null;
  website: string | null;
  website_domain: string | null;
  phone: string | null;
} | null> {
  const phone = phoneKey(candidate.phone);
  const domain = websiteHost(candidate.website ?? null);
  const normalizedName = norm(candidate.name);
  const socialUrls = candidate.socialProfiles
    .map((p) => normalizedUrl(p.url))
    .filter(Boolean) as string[];

  // Never use name alone to merge. Require a strong identifier:
  // phone, website domain, a matching social URL, OR name+city+state.
  const { rows } = await pool.query<{
    id: string;
    social_profiles: SocialProfile[] | null;
    source_evidence: Evidence[] | null;
    website: string | null;
    website_domain: string | null;
    phone: string | null;
  }>(
    `SELECT id, social_profiles, source_evidence, website, website_domain, phone
     FROM businesses
     WHERE coalesce(is_duplicate, false) = false
       AND coalesce(status, 'active') NOT IN ('duplicate', 'permanently_hidden')
       AND (
         ($1::text IS NOT NULL AND phone = $1)
         OR ($2::text IS NOT NULL AND website_domain = $2)
         OR (
           $3::boolean
           AND social_profiles IS NOT NULL
           AND jsonb_typeof(social_profiles) = 'array'
           AND EXISTS (
             SELECT 1
             FROM jsonb_array_elements(social_profiles) AS p
             WHERE p->>'url' = ANY($4::text[])
           )
         )
         OR (
           normalized_name = $5
           AND lower(coalesce(city,'')) = lower($6)
           AND lower(coalesce(state,'')) = lower($7)
         )
       )
     LIMIT 1`,
    [
      phone,
      domain,
      socialUrls.length > 0,
      socialUrls,
      normalizedName,
      candidate.city ?? "",
      candidate.state ?? "",
    ],
  );
  return rows[0] ?? null;
}

// ── Review queue ──────────────────────────────────────────────────────────────
// Routes rejected candidates to the existing business_review_items table.

async function queueReview(candidate: Candidate, reason: string): Promise<void> {
  const allEvidence: Evidence[] = mergeEvidence(
    [...candidate.sourceEvidence, ...candidate.ownershipEvidence],
    socialEvidence(candidate),
  );
  await pool.query(
    `INSERT INTO business_review_items
       (candidate_name, candidate_address, candidate_city, candidate_state,
        candidate_website, candidate_phone, candidate_latitude, candidate_longitude,
        candidate_category, candidate_source_provider, candidate_source_url,
        evidence, score, review_type, reason, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'social_first',$10,$11::jsonb,0,'social_first',$12,'pending',NOW())`,
    [
      candidate.name,
      candidate.address ?? "",
      candidate.city ?? "",
      candidate.state ?? "",
      candidate.website ?? "",
      candidate.phone ?? "",
      candidate.latitude ?? null,
      candidate.longitude ?? null,
      candidate.category ?? "",
      candidate.socialProfiles[0]?.url ?? candidate.website ?? "",
      JSON.stringify(allEvidence),
      reason,
    ],
  );
}

// ── Main entry point ──────────────────────────────────────────────────────────

export type IngestResult =
  | { status: "VERIFIED_ADD"; canonicalId: string }
  | { status: "EXISTING_UPDATE"; canonicalId: string }
  | { status: "MANUAL_REVIEW"; reason: string };

export async function ingestSocialFirstCandidate(
  raw: unknown,
  requestedOwnership: string | null,
): Promise<IngestResult> {
  const candidate = CandidateSchema.parse(raw);

  // 1. Evidence gate — reject before any DB write.
  const reason = rejectReason(candidate, requestedOwnership);
  if (reason) {
    await queueReview(candidate, reason);
    logger.info(
      { event: "SOCIAL_FIRST_REJECTED", name: candidate.name, reason },
      "social-first candidate queued for review",
    );
    return { status: "MANUAL_REVIEW", reason };
  }

  // 2. Duplicate detection — check by phone, domain, social URL, or name+city+state.
  const existing = await findExisting(candidate);
  if (existing) {
    // Merge-only: never overwrite stronger verified data with a social claim.
    const mergedSocial = mergeSocialProfiles(
      (existing.social_profiles ?? []) as SocialProfile[],
      candidate.socialProfiles,
    );
    const mergedEvidence = mergeEvidence(
      (existing.source_evidence ?? []) as Evidence[],
      [...candidate.sourceEvidence, ...candidate.ownershipEvidence, ...socialEvidence(candidate)],
    );
    await pool.query(
      `UPDATE businesses SET
         website       = COALESCE(website, $2),
         website_domain = COALESCE(website_domain, $3),
         phone         = COALESCE(phone, $4),
         social_profiles = $5::jsonb,
         source_evidence = $6::jsonb,
         updated_at    = NOW()
       WHERE id = $1`,
      [
        existing.id,
        candidate.website ?? null,
        websiteHost(candidate.website ?? null),
        phoneKey(candidate.phone),
        JSON.stringify(mergedSocial),
        JSON.stringify(mergedEvidence),
      ],
    );
    logger.info(
      { event: "SOCIAL_FIRST_MERGE", id: existing.id, name: candidate.name },
      "social-first candidate merged into existing record",
    );
    return { status: "EXISTING_UPDATE", canonicalId: existing.id };
  }

  // 3. New record — conflict-safe insert on dedupe_key.
  const key = socialDedupeKey(candidate);
  const allEvidence = mergeEvidence(
    [...candidate.sourceEvidence, ...candidate.ownershipEvidence],
    socialEvidence(candidate),
  );

  const { rows: inserted } = await pool.query<{ id: string }>(
    `INSERT INTO businesses
       (id, name, normalized_name,
        category, address, city, state,
        latitude, longitude,
        phone, website, website_domain,
        social_profiles, ownership_claim, source_evidence,
        dedupe_key, status, listing_status,
        is_duplicate,
        created_at, updated_at)
     VALUES
       (gen_random_uuid(), $1, $2,
        $3, $4, $5, $6,
        $7, $8,
        $9, $10, $11,
        $12::jsonb, $13, $14::jsonb,
        $15, 'active', 'active',
        false,
        NOW(), NOW())
     ON CONFLICT (dedupe_key)
       WHERE dedupe_key IS NOT NULL AND btrim(dedupe_key) <> ''
       DO NOTHING
     RETURNING id`,
    [
      candidate.name,
      norm(candidate.name),
      candidate.category,
      candidate.address,
      candidate.city,
      candidate.state,
      candidate.latitude,
      candidate.longitude,
      phoneKey(candidate.phone),
      candidate.website ?? null,
      websiteHost(candidate.website ?? null),
      JSON.stringify(candidate.socialProfiles),
      candidate.ownershipClaim,
      JSON.stringify(allEvidence),
      key,
    ],
  );

  if (inserted[0]) {
    logger.info(
      { event: "SOCIAL_FIRST_VERIFIED_ADD", id: inserted[0].id, name: candidate.name },
      "social-first candidate verified and added",
    );
    return { status: "VERIFIED_ADD", canonicalId: inserted[0].id };
  }

  // Concurrent conflict: another request inserted the same key. Return the winner.
  const { rows: canonical } = await pool.query<{ id: string }>(
    `SELECT id FROM businesses WHERE dedupe_key = $1 LIMIT 1`,
    [key],
  );
  if (canonical[0]) {
    return { status: "EXISTING_UPDATE", canonicalId: canonical[0].id };
  }
  await queueReview(candidate, "concurrent_conflict_requires_review");
  return { status: "MANUAL_REVIEW", reason: "concurrent_conflict_requires_review" };
}

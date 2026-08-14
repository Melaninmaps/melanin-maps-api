import { z } from "zod";
import { db } from "../db";
import { businesses, businessSources } from "../schema";
import { and, eq, or, sql } from "drizzle-orm";

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
  website: z.string().url().nullable(),
  socialProfiles: z.array(SocialProfileSchema).default([]),
  ownershipClaim: z.string().max(200).nullable(),
  ownershipEvidence: z.array(EvidenceSchema).default([]),
  sourceEvidence: z.array(EvidenceSchema).default([]),
  sourceInput: z.enum(["natural_language", "screenshot", "url", "social_url", "admin_search"]),
});

type Candidate = z.infer<typeof CandidateSchema>;

function norm(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function normalizedUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try { const u = new URL(value.startsWith("http") ? value : `https://${value}`); u.hash = ""; u.search = ""; u.pathname = u.pathname.replace(/\/$/, ""); return u.toString().toLowerCase(); } catch { return null; }
}

function host(value: string | null | undefined): string | null {
  const u = normalizedUrl(value); if (!u) return null;
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return null; }
}

function phoneKey(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, ""); return digits.length >= 7 ? digits : null;
}

function hasFieldEvidence(candidate: Candidate, field: string): boolean {
  return [...candidate.sourceEvidence, ...candidate.ownershipEvidence].some((e) => e.field === field && e.supports === true)
    || (field === "social_profile" && candidate.socialProfiles.length > 0);
}

function hasIdentityEvidence(candidate: Candidate): boolean {
  return hasFieldEvidence(candidate, "identity") || candidate.socialProfiles.some((p) => p.suppliedByUser);
}

function hasLocationEvidence(candidate: Candidate): boolean {
  return Boolean(candidate.address && candidate.city && candidate.state)
    || (candidate.latitude !== null && candidate.longitude !== null && hasFieldEvidence(candidate, "address"));
}

function hasRequestedOwnershipEvidence(candidate: Candidate, requestedOwnership: string | null): boolean {
  return !requestedOwnership || candidate.ownershipEvidence.some((e) => e.field === "ownership" && e.supports === true);
}

function dedupeKey(candidate: Candidate): string {
  const social = candidate.socialProfiles.map((p) => normalizedUrl(p.url)).filter(Boolean).sort().join(",");
  return [norm(candidate.name), norm(candidate.address), norm(candidate.city), norm(candidate.state), phoneKey(candidate.phone) ?? "", host(candidate.website) ?? "", social].join("|");
}

async function findExisting(candidate: Candidate) {
  const name = norm(candidate.name);
  const phone = phoneKey(candidate.phone);
  const websiteHost = host(candidate.website);
  const socialUrls = candidate.socialProfiles.map((p) => normalizedUrl(p.url)).filter(Boolean) as string[];

  // Strong identifiers first. Never use name alone to merge.
  const matches = await db.select().from(businesses).where(or(
    phone ? eq(businesses.phone, phone) : sql`false`,
    websiteHost ? eq(businesses.websiteDomain, websiteHost) : sql`false`,
    socialUrls.length ? sql`${businesses.socialProfiles} ?| ARRAY[${sql.join(socialUrls.map((u) => sql`${u}`), sql`, `)}]` : sql`false`,
    sql`${businesses.normalizedName} = ${name} AND ${businesses.city} = ${candidate.city ?? ""} AND ${businesses.state} = ${candidate.state ?? ""}`,
  ));
  return matches[0] ?? null;
}

function rejectReason(candidate: Candidate, requestedOwnership: string | null): string | null {
  if (!hasIdentityEvidence(candidate)) return "identity_not_supported";
  if (!hasLocationEvidence(candidate)) return "location_not_supported";
  if (!hasRequestedOwnershipEvidence(candidate, requestedOwnership)) return "ownership_not_supported";
  if (!candidate.category) return "category_missing";
  return null;
}

export async function ingestSocialFirstCandidate(raw: unknown, requestedOwnership: string | null) {
  const candidate = CandidateSchema.parse(raw);
  const reason = rejectReason(candidate, requestedOwnership);
  if (reason) {
    await queueReview(candidate, reason);
    return { status: "MANUAL_REVIEW" as const, reason };
  }

  const existing = await findExisting(candidate);
  if (existing) {
    // Merge only evidence and missing fields. Never overwrite stronger verified data with a social claim.
    await db.update(businesses).set({
      website: existing.website ?? candidate.website,
      websiteDomain: existing.websiteDomain ?? host(candidate.website),
      phone: existing.phone ?? phoneKey(candidate.phone),
      socialProfiles: mergeSocialProfiles(existing.socialProfiles ?? [], candidate.socialProfiles),
      sourceEvidence: mergeEvidence(existing.sourceEvidence ?? [], [...candidate.sourceEvidence, ...candidate.ownershipEvidence, ...socialEvidence(candidate)]),
      updatedAt: new Date(),
    }).where(eq(businesses.id, existing.id));
    return { status: "EXISTING_UPDATE" as const, canonicalId: existing.id };
  }

  const key = dedupeKey(candidate);
  const inserted = await db.transaction(async (tx) => {
    // The unique index on dedupe_key is mandatory. This conflict-safe insert
    // prevents two simultaneous searches from creating duplicate businesses.
    const result = await tx.insert(businesses).values({
      name: candidate.name,
      normalizedName: norm(candidate.name),
      category: candidate.category,
      address: candidate.address,
      city: candidate.city,
      state: candidate.state,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      phone: phoneKey(candidate.phone),
      website: candidate.website,
      websiteDomain: host(candidate.website),
      socialProfiles: candidate.socialProfiles,
      ownershipClaim: candidate.ownershipClaim,
      sourceEvidence: mergeEvidence(candidate.sourceEvidence, [...candidate.ownershipEvidence, ...socialEvidence(candidate)]),
      dedupeKey: key,
      status: "active",
      isDuplicate: false,
    }).onConflictDoNothing({ target: businesses.dedupeKey }).returning({ id: businesses.id });
    if (result[0]) return result[0];
    const canonical = await tx.select({ id: businesses.id }).from(businesses).where(eq(businesses.dedupeKey, key)).limit(1);
    return canonical[0] ?? null;
  });
  return inserted ? { status: "VERIFIED_ADD" as const, canonicalId: inserted.id } : { status: "MANUAL_REVIEW" as const, reason: "concurrent_conflict_requires_review" };
}

function socialEvidence(candidate: Candidate): Evidence[] {
  return candidate.socialProfiles.map((p) => ({ url: p.url, sourceType: "social_profile", field: "social_profile", supports: true, excerpt: p.handle ?? null } as Evidence));
}

function mergeEvidence(existing: Evidence[], incoming: Evidence[]): Evidence[] {
  const byKey = new Map<string, Evidence>();
  for (const e of [...existing, ...incoming]) byKey.set(`${e.field}|${e.url}|${e.sourceType}`, e);
  return [...byKey.values()];
}

function mergeSocialProfiles(existing: any[], incoming: Candidate["socialProfiles"]): any[] {
  const byUrl = new Map<string, any>();
  for (const p of [...existing, ...incoming]) { const u = normalizedUrl(p.url); if (u) byUrl.set(u, { ...p, url: u }); }
  return [...byUrl.values()];
}

async function queueReview(candidate: Candidate, reason: string) {
  // Replace with the existing review-queue insert. Store all sourceEvidence,
  // ownershipEvidence, socialProfiles, sourceInput, and reason. Never publish.
  await db.insert(businessSources).values({
    businessId: null,
    sourceUrl: candidate.socialProfiles[0]?.url ?? candidate.website,
    sourceType: candidate.sourceInput,
    payload: { candidate, reason },
    reviewStatus: "pending",
  });
}

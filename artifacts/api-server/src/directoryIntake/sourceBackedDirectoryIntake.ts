import type { SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";
import {
  sanitizeFounderSourceOfficialWebsite,
  sourceListedOfficialSocials,
} from "./founderSourcePublicationPolicy";

export type ExistingDirectoryBusiness = Readonly<{
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  website: string | null;
  sourceUrl: string | null;
  dedupeKey: string | null;
  phone?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  pinterest?: string | null;
}>;

export type SourceBackedDirectoryIntakePlan = Readonly<{
  toCreate: readonly SourceBackedDirectoryCandidate[];
  heldForDescription: readonly SourceBackedDirectoryCandidate[];
  duplicateMatches: readonly Readonly<{
    candidate: SourceBackedDirectoryCandidate;
    existingBusinessId: string | null;
    matchedSourceReceiptKey?: string;
    reason: "exact_address" | "exact_official_destination" | "exact_phone" | "exact_social" | "within_source_batch";
  }>[];
}>;

export function normalizeDirectoryIdentity(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** A directory or category sentence is provenance, not member-facing copy. */
export function hasBusinessSpecificSourceDescription(
  candidate: SourceBackedDirectoryCandidate,
): boolean {
  const description = candidate.sourceDescription?.replace(/\s+/g, " ").trim() ?? "";
  // A concise factual source line such as "Authentic Ethiopian cuisine" is
  // useful consumer-facing copy. Reject only empty/near-placeholder text; the
  // directory/template guard below, not an arbitrary long-form requirement,
  // decides whether it is business-specific.
  if (description.length < 12) return false;
  const category = candidate.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !new RegExp(
    `(?:source-backed directory|business directory|current .* listing|${category} listing in)`,
    "i",
  ).test(description);
}

/**
 * The protected source manifest retains its original values verbatim. This
 * helper only creates safe database-column values for the few legacy bounded
 * columns on businesses, while preserving the full source value in searchable
 * tags and the member-safe source description.
 */
export function sourceBackedDirectoryPublicationFields(candidate: SourceBackedDirectoryCandidate): Readonly<{
  category: string;
  subcategory: string;
  phone: string | null;
  tags: string[];
  description: string;
}> {
  const category = candidate.category.length <= 100
    ? candidate.category
    : "Community business";
  const subcategory = candidate.subcategory.length <= 100
    ? candidate.subcategory
    : "Source-listed category";
  const sourceListedContact = candidate.phone && candidate.phone.length > 30
    ? candidate.phone
    : null;

  return {
    category,
    subcategory,
    phone: sourceListedContact ? null : candidate.phone,
    tags: [...new Set([
      category,
      subcategory,
      candidate.category,
      candidate.subcategory,
      ...candidate.serviceTerms,
    ])],
    // The intake plan prevents records without business-specific description
    // evidence from creating a public card. This formatter must never invent a
    // generic category/city sentence as a member-facing description.
    description: [
      candidate.sourceDescription?.trim() || null,
      sourceListedContact ? `Source-listed contact: ${sourceListedContact}.` : null,
    ].filter(Boolean).join(" "),
  };
}

/**
 * Exact receipt enrichment is distinct from new-profile creation. A receipt
 * can appear on several retained rows, so bound each request by immutable
 * receipt rather than database row. The cursor permits a safe retry without
 * skipping source receipts or creating a duplicate profile.
 */
export function selectSourceBackedEnrichmentBatch<T extends Readonly<{
  candidate: SourceBackedDirectoryCandidate;
}>>(
  matches: readonly T[],
  batchSize: number,
  cursor: string | null | undefined,
): Readonly<{
  matches: readonly T[];
  receiptCount: number;
  remainingReceiptCount: number;
  nextCursor: string | null;
}> {
  const receiptKeys = [...new Set(matches.map((match) => match.candidate.sourceRecordKey))].sort();
  const normalizedCursor = cursor && receiptKeys.includes(cursor) ? cursor : null;
  const remainingKeys = normalizedCursor
    ? receiptKeys.filter((key) => key > normalizedCursor)
    : receiptKeys;
  const selectedKeys = remainingKeys.slice(0, Math.max(1, batchSize));
  const selectedKeySet = new Set(selectedKeys);
  const remainingReceiptCount = Math.max(0, remainingKeys.length - selectedKeys.length);

  return {
    matches: matches.filter((match) => selectedKeySet.has(match.candidate.sourceRecordKey)),
    receiptCount: selectedKeys.length,
    remainingReceiptCount,
    nextCursor: remainingReceiptCount > 0 ? selectedKeys.at(-1) ?? null : null,
  };
}

function normalizeStreetAddress(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b(street|st)\.?\b/g, "st")
    .replace(/\b(avenue|ave)\.?\b/g, "ave")
    .replace(/\b(road|rd)\.?\b/g, "rd")
    .replace(/\b(boulevard|blvd)\.?\b/g, "blvd")
    .replace(/\b(drive|dr)\.?\b/g, "dr")
    .replace(/\b(lane|ln)\.?\b/g, "ln")
    .replace(/\b(place|pl)\.?\b/g, "pl")
    .replace(/[^a-z0-9]+/g, "");
}

function hostname(value: string | null | undefined): string {
  const sanitized = sanitizeFounderSourceOfficialWebsite(value);
  if (!sanitized) return "";
  try {
    return new URL(sanitized).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function phoneIdentity(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return normalized.length >= 7 ? normalized : "";
}

function socialIdentity(value: string | null | undefined): string {
  if (!value) return "";
  const social = sourceListedOfficialSocials({ instagram: value });
  const normalized = social.instagram;
  if (!normalized) return "";
  const parsed = new URL(normalized);
  return `${parsed.hostname.replace(/^www\./i, "").toLowerCase()}${parsed.pathname.replace(/\/+$/, "").toLowerCase()}`;
}

function samePlaceKey(value: Readonly<{ name: string | null; city: string | null; state: string | null }>): string {
  return [
    normalizeDirectoryIdentity(value.name),
    normalizeDirectoryIdentity(value.city),
    normalizeDirectoryIdentity(value.state),
  ].join("|");
}

function exactAddressKey(value: Readonly<{
  name: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
}>): string | null {
  const address = normalizeStreetAddress(value.address);
  return address ? `${samePlaceKey(value)}|address:${address}` : null;
}

function officialDestinationKey(value: Readonly<{
  name: string | null;
  city: string | null;
  state: string | null;
  officialUrl?: string | null;
  website?: string | null;
}>): string | null {
  const domain = hostname(value.officialUrl ?? value.website);
  return domain ? `${samePlaceKey(value)}|host:${domain}` : null;
}

function phoneDestinationKey(value: Readonly<{
  name: string | null;
  city: string | null;
  state: string | null;
  phone?: string | null;
}>): string | null {
  const phone = phoneIdentity(value.phone);
  return phone ? `${samePlaceKey(value)}|phone:${phone}` : null;
}

function socialDestinationKeys(value: Readonly<{
  name: string | null;
  city: string | null;
  state: string | null;
  socialLinks?: SourceBackedDirectoryCandidate["socialLinks"];
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  pinterest?: string | null;
}>): string[] {
  const profiles = value.socialLinks
    ? Object.values(sourceListedOfficialSocials(value.socialLinks))
    : [value.facebook, value.instagram, value.tiktok, value.twitter, value.youtube, value.pinterest];
  return profiles
    .map(socialIdentity)
    .filter(Boolean)
    .map((social) => `${samePlaceKey(value)}|social:${social}`);
}

/**
 * A source listing is skipped only when it can be tied to an already-live record
 * by the same normalized name + city + state and an exact street address or
 * official-destination hostname. Similar names alone remain separate, preserving
 * the founder's no-silent-merge requirement.
 */
export function buildSourceBackedDirectoryIntakePlan(
  candidates: readonly SourceBackedDirectoryCandidate[],
  existingBusinesses: readonly ExistingDirectoryBusiness[],
): SourceBackedDirectoryIntakePlan {
  const toCreate: SourceBackedDirectoryCandidate[] = [];
  const heldForDescription: SourceBackedDirectoryCandidate[] = [];
  const duplicateMatches: Array<{
    candidate: SourceBackedDirectoryCandidate;
    existingBusinessId: string | null;
    matchedSourceReceiptKey?: string;
    reason: "exact_address" | "exact_official_destination" | "exact_phone" | "exact_social" | "within_source_batch";
  }> = [];

  // The protected founder manifest is intentionally large. Indexing preserves
  // the exact same-place rules while avoiding repeated full-list scans in the
  // admin preview and in every bounded publication retry.
  // A shared directory/category URL is provenance, not an individual listing
  // receipt. It cannot connect a candidate to a canonical profile: only a URL
  // that occurs once in the supplied source scope can be an exact listing key.
  const listingReceiptCounts = new Map<string, number>();
  for (const candidate of candidates) {
    const listingReceipt = candidate.sourceListingUrl ?? candidate.sourceUrl;
    listingReceiptCounts.set(listingReceipt, (listingReceiptCounts.get(listingReceipt) ?? 0) + 1);
  }
  const existingByReceipt = new Map<string, ExistingDirectoryBusiness>();
  const existingByListingReceipt = new Map<string, ExistingDirectoryBusiness>();
  const existingByAddress = new Map<string, ExistingDirectoryBusiness>();
  const existingByOfficialDestination = new Map<string, ExistingDirectoryBusiness>();
  const existingByPhone = new Map<string, ExistingDirectoryBusiness>();
  const existingBySocial = new Map<string, ExistingDirectoryBusiness>();
  for (const existing of existingBusinesses) {
    if (existing.dedupeKey) existingByReceipt.set(existing.dedupeKey, existing);
    if (existing.sourceUrl) existingByListingReceipt.set(existing.sourceUrl, existing);
    const addressKey = exactAddressKey(existing);
    if (addressKey) existingByAddress.set(addressKey, existing);
    const destinationKey = officialDestinationKey(existing);
    if (destinationKey) existingByOfficialDestination.set(destinationKey, existing);
    const phoneKey = phoneDestinationKey(existing);
    if (phoneKey) existingByPhone.set(phoneKey, existing);
    for (const socialKey of socialDestinationKeys(existing)) existingBySocial.set(socialKey, existing);
  }

  const createdByAddress = new Map<string, SourceBackedDirectoryCandidate>();
  const createdByOfficialDestination = new Map<string, SourceBackedDirectoryCandidate>();
  const createdByPhone = new Map<string, SourceBackedDirectoryCandidate>();
  const createdBySocial = new Map<string, SourceBackedDirectoryCandidate>();

  for (const candidate of candidates) {
    if (!hasBusinessSpecificSourceDescription(candidate)) {
      // A founder-approved, named source directory is sufficient documentary
      // evidence for a searchable unclaimed record. Missing detail copy is a
      // review signal, never a reason to silently omit the source listing. The
      // publication formatter intentionally leaves its member-facing
      // description blank rather than inventing category/city boilerplate.
      heldForDescription.push(candidate);
    }
    // Directory rows with street addresses use a canonical place key for
    // deduplication, so their sourceRecordKey is retained as the exact
    // source-listing URL rather than overwriting the place key. Either exact
    // persisted receipt proves this is a retry, including a review-vault row.
    const sourceReceiptMatch = existingByReceipt.get(candidate.sourceRecordKey)
      ?? (listingReceiptCounts.get(candidate.sourceListingUrl ?? candidate.sourceUrl) === 1
        ? existingByListingReceipt.get(candidate.sourceListingUrl ?? candidate.sourceUrl)
        : undefined);
    if (sourceReceiptMatch) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: sourceReceiptMatch.id,
        reason: "exact_official_destination",
      });
      continue;
    }

    const addressKey = exactAddressKey(candidate);
    const addressMatch = addressKey ? existingByAddress.get(addressKey) : undefined;
    if (addressMatch) {
      duplicateMatches.push({ candidate, existingBusinessId: addressMatch.id, reason: "exact_address" });
      continue;
    }

    const destinationKey = officialDestinationKey(candidate);
    const officialDestinationMatch = destinationKey
      ? existingByOfficialDestination.get(destinationKey)
      : undefined;
    if (officialDestinationMatch) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: officialDestinationMatch.id,
        reason: "exact_official_destination",
      });
      continue;
    }

    const phoneKey = phoneDestinationKey(candidate);
    const phoneMatch = phoneKey ? existingByPhone.get(phoneKey) : undefined;
    if (phoneMatch) {
      duplicateMatches.push({ candidate, existingBusinessId: phoneMatch.id, reason: "exact_phone" });
      continue;
    }

    const socialKeys = socialDestinationKeys(candidate);
    const socialMatch = socialKeys.map((key) => existingBySocial.get(key)).find(Boolean);
    if (socialMatch) {
      duplicateMatches.push({ candidate, existingBusinessId: socialMatch.id, reason: "exact_social" });
      continue;
    }

    // Retain every source receipt in the protected manifest, but do not create
    // two records in one publish transaction when exact same-place evidence
    // ties independently sourced records together. Similar names stay separate.
    const sameAddressCreated = addressKey ? createdByAddress.get(addressKey) : undefined;
    const sameDestinationCreated = destinationKey
      ? createdByOfficialDestination.get(destinationKey)
      : undefined;
    const samePhoneCreated = phoneKey ? createdByPhone.get(phoneKey) : undefined;
    const sameSocialCreated = socialKeys.map((key) => createdBySocial.get(key)).find(Boolean);
    // Preserve the established conservative rule: when both source records have
    // addresses, only the exact address can collapse them. An official-domain
    // match remains sufficient when the candidate or its earlier receipt is
    // mapless, where it is the only exact identity evidence available.
    const sourceBatchMatch = sameAddressCreated
      ?? (sameDestinationCreated && (!candidate.address || !sameDestinationCreated.address)
        ? sameDestinationCreated
        : undefined);
    if (sourceBatchMatch) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: null,
        matchedSourceReceiptKey: sourceBatchMatch.sourceRecordKey,
        reason: "within_source_batch",
      });
      continue;
    }

    if (samePhoneCreated) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: null,
        matchedSourceReceiptKey: samePhoneCreated.sourceRecordKey,
        reason: "within_source_batch",
      });
      continue;
    }
    if (sameSocialCreated) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: null,
        matchedSourceReceiptKey: sameSocialCreated.sourceRecordKey,
        reason: "within_source_batch",
      });
      continue;
    }

    toCreate.push(candidate);
    if (addressKey) createdByAddress.set(addressKey, candidate);
    if (destinationKey) createdByOfficialDestination.set(destinationKey, candidate);
    if (phoneKey) createdByPhone.set(phoneKey, candidate);
    for (const socialKey of socialKeys) createdBySocial.set(socialKey, candidate);
  }

  return { toCreate, heldForDescription, duplicateMatches };
}

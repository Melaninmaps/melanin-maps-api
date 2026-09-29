import type { SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";

export type ExistingDirectoryBusiness = Readonly<{
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  website: string | null;
  sourceUrl: string | null;
  dedupeKey: string | null;
}>;

export type SourceBackedDirectoryIntakePlan = Readonly<{
  toCreate: readonly SourceBackedDirectoryCandidate[];
  heldForDescription: readonly SourceBackedDirectoryCandidate[];
  duplicateMatches: readonly Readonly<{
    candidate: SourceBackedDirectoryCandidate;
    existingBusinessId: string | null;
    matchedSourceReceiptKey?: string;
    reason: "exact_address" | "exact_official_destination" | "within_source_batch";
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
  const raw = value?.trim();
  if (!raw) return "";
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
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
    reason: "exact_address" | "exact_official_destination" | "within_source_batch";
  }> = [];

  // The protected founder manifest is intentionally large. Indexing preserves
  // the exact same-place rules while avoiding repeated full-list scans in the
  // admin preview and in every bounded publication retry.
  const existingByReceipt = new Map<string, ExistingDirectoryBusiness>();
  const existingByListingReceipt = new Map<string, ExistingDirectoryBusiness>();
  const existingByAddress = new Map<string, ExistingDirectoryBusiness>();
  const existingByOfficialDestination = new Map<string, ExistingDirectoryBusiness>();
  for (const existing of existingBusinesses) {
    if (existing.dedupeKey) existingByReceipt.set(existing.dedupeKey, existing);
    if (existing.sourceUrl) existingByListingReceipt.set(existing.sourceUrl, existing);
    const addressKey = exactAddressKey(existing);
    if (addressKey) existingByAddress.set(addressKey, existing);
    const destinationKey = officialDestinationKey(existing);
    if (destinationKey) existingByOfficialDestination.set(destinationKey, existing);
  }

  const createdByAddress = new Map<string, SourceBackedDirectoryCandidate>();
  const createdByOfficialDestination = new Map<string, SourceBackedDirectoryCandidate>();

  for (const candidate of candidates) {
    if (!hasBusinessSpecificSourceDescription(candidate)) {
      heldForDescription.push(candidate);
      continue;
    }
    // Directory rows with street addresses use a canonical place key for
    // deduplication, so their sourceRecordKey is retained as the exact
    // source-listing URL rather than overwriting the place key. Either exact
    // persisted receipt proves this is a retry, including a review-vault row.
    const sourceReceiptMatch = existingByReceipt.get(candidate.sourceRecordKey)
      ?? existingByListingReceipt.get(candidate.sourceListingUrl ?? candidate.sourceUrl);
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

    // Retain every source receipt in the protected manifest, but do not create
    // two records in one publish transaction when exact same-place evidence
    // ties independently sourced records together. Similar names stay separate.
    const sameAddressCreated = addressKey ? createdByAddress.get(addressKey) : undefined;
    const sameDestinationCreated = destinationKey
      ? createdByOfficialDestination.get(destinationKey)
      : undefined;
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

    toCreate.push(candidate);
    if (addressKey) createdByAddress.set(addressKey, candidate);
    if (destinationKey) createdByOfficialDestination.set(destinationKey, candidate);
  }

  return { toCreate, heldForDescription, duplicateMatches };
}

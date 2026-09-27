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
  duplicateMatches: readonly Readonly<{
    candidate: SourceBackedDirectoryCandidate;
    existingBusinessId: string;
    reason: "exact_address" | "exact_official_destination";
  }>[];
}>;

export function normalizeDirectoryIdentity(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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
  const duplicateMatches: Array<{
    candidate: SourceBackedDirectoryCandidate;
    existingBusinessId: string;
    reason: "exact_address" | "exact_official_destination";
  }> = [];

  for (const candidate of candidates) {
    const sourceReceiptMatch = existingBusinesses.find(
      (existing) => existing.dedupeKey === candidate.sourceRecordKey,
    );
    if (sourceReceiptMatch) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: sourceReceiptMatch.id,
        reason: "exact_official_destination",
      });
      continue;
    }

    const sameNameAndPlace = existingBusinesses.filter((existing) =>
      normalizeDirectoryIdentity(existing.name) === normalizeDirectoryIdentity(candidate.name) &&
      normalizeDirectoryIdentity(existing.city) === normalizeDirectoryIdentity(candidate.city) &&
      normalizeDirectoryIdentity(existing.state) === normalizeDirectoryIdentity(candidate.state),
    );

    const addressMatch = candidate.address
      ? sameNameAndPlace.find((existing) =>
          normalizeStreetAddress(existing.address) === normalizeStreetAddress(candidate.address),
        )
      : undefined;
    if (addressMatch) {
      duplicateMatches.push({ candidate, existingBusinessId: addressMatch.id, reason: "exact_address" });
      continue;
    }

    const candidateHost = hostname(candidate.officialUrl);
    const officialDestinationMatch = candidateHost
      ? sameNameAndPlace.find((existing) => hostname(existing.website) === candidateHost)
      : undefined;
    if (officialDestinationMatch) {
      duplicateMatches.push({
        candidate,
        existingBusinessId: officialDestinationMatch.id,
        reason: "exact_official_destination",
      });
      continue;
    }

    toCreate.push(candidate);
  }

  return { toCreate, duplicateMatches };
}

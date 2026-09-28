import type { SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";

export type MinnesotaLegacyDirectoryRecord = Readonly<{
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  sourceUrl: string | null;
  description: string | null;
  isDuplicate: boolean | null;
}>;

export type MinnesotaLegacyCanonicalReconciliation = Readonly<{
  candidate: SourceBackedDirectoryCandidate;
  canonicalId: string;
}>;

function normalizeIdentity(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeMinnesotaState(value: string | null | undefined): string {
  const normalized = normalizeIdentity(value);
  return normalized === "minnesota" ? "mn" : normalized;
}

function sameMinnesotaPlace(
  candidate: SourceBackedDirectoryCandidate,
  record: MinnesotaLegacyDirectoryRecord,
): boolean {
  return normalizeIdentity(candidate.name) === normalizeIdentity(record.name)
    && normalizeIdentity(candidate.city) === normalizeIdentity(record.city)
    && normalizeMinnesotaState(candidate.state) === normalizeMinnesotaState(record.state);
}

/**
 * Earlier Minnesota imports created public profiles from a location-index card,
 * before individual source pages had been captured. Their generic wording is
 * exact evidence of that limited source import, not a member-authored profile.
 *
 * When a current candidate has the same source place and an individual detail
 * receipt, it is safe to preserve the existing public profile id and replace
 * only that generic importer copy with the current detail-page copy. Ambiguous
 * names never qualify: they remain in duplicate review.
 */
export function buildMinnesotaLegacyCanonicalReconciliations(
  candidates: readonly SourceBackedDirectoryCandidate[],
  existingRecords: readonly MinnesotaLegacyDirectoryRecord[],
): MinnesotaLegacyCanonicalReconciliation[] {
  const legacyRows = existingRecords.filter((record) => {
    if (record.isDuplicate) return false;
    if (!record.sourceUrl?.startsWith("https://mnblackbusiness.com/listing-location/")) return false;
    return /black\/african american business ecosystem\s+current minneapolis listing in the minnesota black-owned business directory\.?/i
      .test(record.description ?? "");
  });

  const reconciliations: MinnesotaLegacyCanonicalReconciliation[] = [];
  for (const candidate of candidates) {
    const matches = legacyRows.filter((record) => sameMinnesotaPlace(candidate, record));
    if (matches.length !== 1) continue;
    reconciliations.push({ candidate, canonicalId: matches[0].id });
  }
  return reconciliations;
}

export type DirectNameOwnershipField =
  | "ownershipDesignations"
  | "blackOwned"
  | "verifiedDesignations"
  | "ownershipClaim"
  | "documentedOwnership"
  | "featured"
  | "promotionType"
  | "culturalMatch";

/**
 * Exact public-directory retrieval is a profile-only safety/context read. It
 * must never turn stored, reviewed, or source-reported ownership information
 * into a member-visible ownership filter, label, or economic-flywheel signal.
 */
export function stripDirectNameOwnershipPresentation<T extends Record<string, unknown>>(
  records: readonly T[],
): Array<Omit<T, DirectNameOwnershipField>> {
  return records.map((record) => {
    const {
      ownershipDesignations: _ownershipDesignations,
      blackOwned: _blackOwned,
      verifiedDesignations: _verifiedDesignations,
      ownershipClaim: _ownershipClaim,
      documentedOwnership: _documentedOwnership,
      featured: _featured,
      promotionType: _promotionType,
      culturalMatch: _culturalMatch,
      ...profileOnlyRecord
    } = record;
    return profileOnlyRecord;
  });
}

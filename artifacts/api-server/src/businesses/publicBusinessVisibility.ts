export const PUBLIC_BUSINESS_LISTING_STATUSES = [
  "live_unclaimed",
  "live_claimed",
] as const;

type PublicBusinessCandidate = {
  listingStatus?: string | null;
  listing_status?: string | null;
  status?: string | null;
  isDuplicate?: boolean | null;
  is_duplicate?: boolean | null;
  duplicateOfId?: string | null;
  duplicate_of_id?: string | null;
  permanentlyHidden?: boolean | null;
  permanently_hidden?: boolean | null;
};

/** Pure equivalent of the established public.public_businesses view for fixtures. */
export function isPublicBusinessRecord(record: PublicBusinessCandidate): boolean {
  const listingStatus = record.listingStatus ?? record.listing_status ?? "live_unclaimed";
  const status = record.status ?? "active";
  const permanentlyHidden = record.permanentlyHidden ?? record.permanently_hidden ?? false;
  // Potential duplicates remain in the live catalog while the administrator
  // performs city-by-city review. The reversible archive action, not an older
  // automated duplicate marker, is the control that removes a listing from
  // default search, map, and Kinfolk surfaces.
  return !permanentlyHidden
    && !["suspended", "removed", "deleted", "permanently_hidden"].includes(status)
    && PUBLIC_BUSINESS_LISTING_STATUSES.includes(
      listingStatus as (typeof PUBLIC_BUSINESS_LISTING_STATUSES)[number],
    );
}

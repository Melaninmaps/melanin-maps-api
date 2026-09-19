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
  const isDuplicate = record.isDuplicate ?? record.is_duplicate ?? false;
  const superseded = record.duplicateOfId ?? record.duplicate_of_id;
  const permanentlyHidden = record.permanentlyHidden ?? record.permanently_hidden ?? false;
  return !isDuplicate
    && !superseded
    && !permanentlyHidden
    && record.status === "active"
    && PUBLIC_BUSINESS_LISTING_STATUSES.includes(
      listingStatus as (typeof PUBLIC_BUSINESS_LISTING_STATUSES)[number],
    );
}

export const DIRECTORY_ELIGIBILITY_STATES = [
  "public_eligible",
  "kinfolk_eligible",
  "official_presence_unresolved",
  "ownership_not_established",
  "website_identity_mismatch",
  "website_unsafe_or_spam",
  "identity_conflict",
  "duplicate_review",
  "closure_review",
  "unreviewed",
] as const;

export type DirectoryEligibilityState = (typeof DIRECTORY_ELIGIBILITY_STATES)[number];

export const PUBLIC_DIRECTORY_ELIGIBILITY_STATES = [
  "public_eligible",
  "kinfolk_eligible",
] as const satisfies readonly DirectoryEligibilityState[];

export const KINFOLK_DIRECTORY_ELIGIBILITY_STATES = [
  "kinfolk_eligible",
] as const satisfies readonly DirectoryEligibilityState[];

export const DIRECTORY_REVIEW_ELIGIBILITY_STATES = DIRECTORY_ELIGIBILITY_STATES.filter(
  (state) => !PUBLIC_DIRECTORY_ELIGIBILITY_STATES.includes(
    state as (typeof PUBLIC_DIRECTORY_ELIGIBILITY_STATES)[number],
  ),
) as readonly Exclude<DirectoryEligibilityState, (typeof PUBLIC_DIRECTORY_ELIGIBILITY_STATES)[number]>[];

export const DIRECTORY_ELIGIBILITY_STATE_LABELS: Record<DirectoryEligibilityState, string> = {
  public_eligible: "Public eligible",
  kinfolk_eligible: "Kinfolk eligible",
  official_presence_unresolved: "Official presence unresolved",
  ownership_not_established: "Ownership not established",
  website_identity_mismatch: "Website identity mismatch",
  website_unsafe_or_spam: "Website unsafe or spam",
  identity_conflict: "Identity conflict",
  duplicate_review: "Duplicate review",
  closure_review: "Closure review",
  unreviewed: "Unreviewed",
};

export function isDirectoryEligibilityState(value: unknown): value is DirectoryEligibilityState {
  return typeof value === "string" && DIRECTORY_ELIGIBILITY_STATES.includes(value as DirectoryEligibilityState);
}

export function isPublicDirectoryEligibilityState(value: unknown): value is (typeof PUBLIC_DIRECTORY_ELIGIBILITY_STATES)[number] {
  return typeof value === "string" && PUBLIC_DIRECTORY_ELIGIBILITY_STATES.includes(
    value as (typeof PUBLIC_DIRECTORY_ELIGIBILITY_STATES)[number],
  );
}

/**
 * A record in any review state is deliberately retained. This helper answers
 * only whether it may appear through broad member-facing discovery; it never
 * authorizes an archive, deletion, merge, claim, or profile mutation.
 */
export function isHeldDirectoryEligibilityState(value: unknown): boolean {
  return isDirectoryEligibilityState(value) && !isPublicDirectoryEligibilityState(value);
}

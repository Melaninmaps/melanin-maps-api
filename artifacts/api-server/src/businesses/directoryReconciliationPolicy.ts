export const DIRECTORY_RECONCILIATION_STATES = [
  "unreviewed",
  "reviewed_retain",
  "reviewed_qualified",
  "requires_reconciliation",
  "reversible_public_hold",
  "archived_confirmed_closed",
  "archived_confirmed_duplicate",
  "archived_confirmed_fraud_or_unsafe",
  "archived_documented_safety_or_legal",
] as const;

export type DirectoryReconciliationState = (typeof DIRECTORY_RECONCILIATION_STATES)[number];

export const DIRECTORY_RECONCILIATION_REASON_CODES = [
  "unreviewed",
  "source_ownership_and_official_presence_verified",
  "official_presence_unverified",
  "ownership_unverified",
  "identity_conflict",
  "address_conflict",
  "phone_conflict",
  "duplicate_candidate",
  "confirmed_closed",
  "confirmed_duplicate",
  "confirmed_fraud_or_unsafe",
  "documented_safety_or_legal_removal",
  "website_removed_identity_mismatch",
  "website_removed_unsafe_spam",
  "website_removed_inactive_broken",
  "social_only_public_business",
] as const;

export type DirectoryReconciliationReasonCode =
  (typeof DIRECTORY_RECONCILIATION_REASON_CODES)[number];

export const DIRECTORY_RECONCILIATION_PRESENCE_STATUSES = [
  "unreviewed",
  "valid_website",
  "valid_social",
  "valid_website_and_social",
  "official_presence_unverified",
  "website_removed_identity_mismatch",
  "website_removed_unsafe_spam",
  "website_removed_inactive_broken",
] as const;

export type DirectoryReconciliationPresenceStatus =
  (typeof DIRECTORY_RECONCILIATION_PRESENCE_STATUSES)[number];

export const DIRECTORY_RECONCILIATION_OWNERSHIP_STATUSES = [
  "unreviewed",
  "source_documented",
  "officially_stated",
  "ownership_unverified",
  "ownership_conflict",
] as const;

export type DirectoryReconciliationOwnershipStatus =
  (typeof DIRECTORY_RECONCILIATION_OWNERSHIP_STATUSES)[number];

export const DIRECTORY_RECONCILIATION_ACTIONS = [
  "retain",
  "qualify_kinfolk_current",
  "reconcile",
  "reversible_public_hold",
  "archive_confirmed_closed",
  "archive_confirmed_duplicate",
  "archive_confirmed_fraud_or_unsafe",
  "archive_documented_safety_or_legal",
] as const;

export type DirectoryReconciliationAction =
  (typeof DIRECTORY_RECONCILIATION_ACTIONS)[number];

export const DIRECTORY_ARCHIVE_REASON_CODES = [
  "confirmed_closed",
  "confirmed_duplicate",
  "confirmed_fraud_or_unsafe",
  "documented_safety_or_legal_removal",
] as const;

export type DirectoryArchiveReasonCode = (typeof DIRECTORY_ARCHIVE_REASON_CODES)[number];

// These reasons do not assert closure, duplicate status, fraud, or a legal/safety
// finding. They permit only a reversible public-discovery hold after the exact
// reason was recorded in the reconciliation ledger.
export const DIRECTORY_REVERSIBLE_PUBLIC_HOLD_REASON_CODES = [
  "identity_conflict",
  "phone_conflict",
] as const;

export type DirectoryReversiblePublicHoldReasonCode =
  (typeof DIRECTORY_REVERSIBLE_PUBLIC_HOLD_REASON_CODES)[number];

export function isDirectoryReconciliationReasonCode(
  value: unknown,
): value is DirectoryReconciliationReasonCode {
  return typeof value === "string"
    && (DIRECTORY_RECONCILIATION_REASON_CODES as readonly string[]).includes(value);
}

export function isDirectoryArchiveReasonCode(
  value: unknown,
): value is DirectoryArchiveReasonCode {
  return typeof value === "string"
    && (DIRECTORY_ARCHIVE_REASON_CODES as readonly string[]).includes(value);
}

export function isDirectoryReversiblePublicHoldReasonCode(
  value: unknown,
): value is DirectoryReversiblePublicHoldReasonCode {
  return typeof value === "string"
    && (DIRECTORY_REVERSIBLE_PUBLIC_HOLD_REASON_CODES as readonly string[]).includes(value);
}

export function isDirectoryPublicDiscoveryRemovalReasonCode(
  value: unknown,
): value is DirectoryArchiveReasonCode | DirectoryReversiblePublicHoldReasonCode {
  return isDirectoryArchiveReasonCode(value) || isDirectoryReversiblePublicHoldReasonCode(value);
}

export function archiveStateForReason(
  reasonCode: DirectoryArchiveReasonCode,
): DirectoryReconciliationState {
  switch (reasonCode) {
    case "confirmed_closed":
      return "archived_confirmed_closed";
    case "confirmed_duplicate":
      return "archived_confirmed_duplicate";
    case "confirmed_fraud_or_unsafe":
      return "archived_confirmed_fraud_or_unsafe";
    case "documented_safety_or_legal_removal":
      return "archived_documented_safety_or_legal";
  }
}

export function archiveActionForReason(
  reasonCode: DirectoryArchiveReasonCode,
): DirectoryReconciliationAction {
  switch (reasonCode) {
    case "confirmed_closed":
      return "archive_confirmed_closed";
    case "confirmed_duplicate":
      return "archive_confirmed_duplicate";
    case "confirmed_fraud_or_unsafe":
      return "archive_confirmed_fraud_or_unsafe";
    case "documented_safety_or_legal_removal":
      return "archive_documented_safety_or_legal";
  }
}

export function publicDiscoveryRemovalStateForReason(
  reasonCode: DirectoryArchiveReasonCode | DirectoryReversiblePublicHoldReasonCode,
): DirectoryReconciliationState {
  return isDirectoryArchiveReasonCode(reasonCode)
    ? archiveStateForReason(reasonCode)
    : "reversible_public_hold";
}

export function publicDiscoveryRemovalActionForReason(
  reasonCode: DirectoryArchiveReasonCode | DirectoryReversiblePublicHoldReasonCode,
): DirectoryReconciliationAction {
  return isDirectoryArchiveReasonCode(reasonCode)
    ? archiveActionForReason(reasonCode)
    : "reversible_public_hold";
}

export const DIRECTORY_RECONCILIATION_RULE =
  "Every retained business has a concrete reconciliation state and reason code. Kinfolk Current requires documented diaspora/minority ownership plus a valid identity-matching official website or official social account. Phone, map, directory, marketplace, and aggregator links never count as official presence. Missing presence or ownership evidence routes a record to reconciliation. A ledger-recorded identity or phone conflict may place only that record on reversible public-discovery hold; only confirmed closure, duplicate, fraud/unsafe destination, or documented safety/legal removal may use an archive-specific reconciliation state.";

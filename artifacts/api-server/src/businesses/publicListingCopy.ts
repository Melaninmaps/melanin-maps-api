/**
 * Removes internal intake/reconciliation notes from member-facing listing copy.
 * The source records and admin-only provenance fields remain unchanged for audit.
 */
const INTERNAL_LISTING_COPY_PATTERNS: readonly RegExp[] = [
  /Large-batch candidate sourced from a current 2026 Visit Philadelphia ownership\/operated guide\.\s*Reconcile exact current address, operating status, parent\/child locations, ownership continuity, price, and social\/website before public display\.\s*External guide status does not equal MWM verification\./gi,
  /\bELIGIBLE_UNCLAIMED_AFTER_RECONCILIATION\b/gi,
  /\bCURRENT_2026_VISIT_PHILADELPHIA_OWNERSHIP_GUIDE\b/gi,
];

function normalizeVisibleCopy(value: string): string {
  return value
    .replace(/\s*·\s*(?=·|$)/g, " ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizePublicListingCopy(value: unknown): string {
  if (typeof value !== "string") return "";
  return normalizeVisibleCopy(
    INTERNAL_LISTING_COPY_PATTERNS.reduce(
      (copy, pattern) => copy.replace(pattern, " "),
      value,
    ),
  );
}

export function sanitizePublicListingCopyOrNull(value: unknown): string | null {
  const sanitized = sanitizePublicListingCopy(value);
  return sanitized || null;
}

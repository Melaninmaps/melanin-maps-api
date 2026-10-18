export const PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS = 3;

export const PRIVATE_SKIP_FEEDBACK_REASON_OPTIONS = [
  { code: "accessibility", label: "Accessibility" },
  { code: "hours_availability", label: "Hours or availability" },
  { code: "price_value", label: "Price or value" },
  { code: "service_experience", label: "Service or experience" },
  { code: "information_access", label: "Information or booking" },
  { code: "other", label: "Other general concern" },
] as const;

export type PrivateSkipFeedbackReasonCode =
  (typeof PRIVATE_SKIP_FEEDBACK_REASON_OPTIONS)[number]["code"];

type PrivateSkipFeedbackSignal = Readonly<{
  reasonCode?: unknown;
  message?: unknown;
  submittedById?: unknown;
}>;

const reasonOptionsByCode = new Map(
  PRIVATE_SKIP_FEEDBACK_REASON_OPTIONS.map((option) => [option.code, option]),
);

/**
 * Free-text skip notes could contain identifiers, personal accounts, or private
 * context. Only this reviewed, intentionally small category set is persisted
 * and later used as business-facing flywheel input.
 */
export function normalizePrivateSkipFeedbackReason(
  value: unknown,
): PrivateSkipFeedbackReasonCode | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toLowerCase();
  return reasonOptionsByCode.has(code as PrivateSkipFeedbackReasonCode)
    ? (code as PrivateSkipFeedbackReasonCode)
    : null;
}

/**
 * Produces only thresholded, distinct-member aggregates. Legacy free-text rows
 * do not map to a reviewed category and are deliberately withheld rather than
 * being exposed or sent to a model.
 */
export function aggregatePrivateSkipFeedbackSignals(
  signals: readonly PrivateSkipFeedbackSignal[],
): {
  totalDistinctMembers: number;
  reasonCounts: Array<{
    reasonCode: PrivateSkipFeedbackReasonCode;
    label: string;
    distinctMemberCount: number;
  }>;
} {
  const distinctMembersByReason = new Map<PrivateSkipFeedbackReasonCode, Set<string>>();

  for (const signal of signals) {
    const reasonCode = normalizePrivateSkipFeedbackReason(
      signal.reasonCode ?? signal.message,
    );
    const submittedById = typeof signal.submittedById === "string"
      ? signal.submittedById.trim()
      : "";
    if (!reasonCode || !submittedById) continue;

    const members = distinctMembersByReason.get(reasonCode) ?? new Set<string>();
    members.add(submittedById);
    distinctMembersByReason.set(reasonCode, members);
  }

  const reasonCounts = [...distinctMembersByReason.entries()]
    .map(([reasonCode, members]) => ({
      reasonCode,
      label: reasonOptionsByCode.get(reasonCode)!.label,
      distinctMemberCount: members.size,
    }))
    .filter((entry) => entry.distinctMemberCount >= PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS)
    .sort((left, right) => right.distinctMemberCount - left.distinctMemberCount || left.label.localeCompare(right.label));

  return {
    totalDistinctMembers: reasonCounts.reduce(
      (total, entry) => total + entry.distinctMemberCount,
      0,
    ),
    reasonCounts,
  };
}

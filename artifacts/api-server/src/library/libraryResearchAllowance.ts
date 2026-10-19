/**
 * Fresh Library research must be backed by a durable, member-bound idempotency
 * ledger before it can use an external provider. Aggregate Kinfolk counters do
 * not identify a confirmed research request, so using them directly would allow
 * duplicate debits or duplicate provider work after retries or concurrent taps.
 *
 * This source-only boundary intentionally fails closed until the separately
 * reviewed ledger migration and global cost-budget policy are available. It is
 * not a new membership tier or allowance.
 */
export const LIBRARY_RESEARCH_LEDGER_UNAVAILABLE =
  "LIBRARY_RESEARCH_LEDGER_UNAVAILABLE";

export type LibraryResearchAllowanceUnavailable = {
  status: "unavailable";
  code: typeof LIBRARY_RESEARCH_LEDGER_UNAVAILABLE;
  error: string;
  retryable: false;
  usesKinfolkAiAllowance: true;
  confirmationRequired: true;
};

export function unavailableLibraryResearchAllowance(): LibraryResearchAllowanceUnavailable {
  return {
    status: "unavailable",
    code: LIBRARY_RESEARCH_LEDGER_UNAVAILABLE,
    error:
      "Fresh Library research is temporarily unavailable while KinfolkAI allowance protections are finalized. Approved Library content remains free to browse and search.",
    retryable: false,
    usesKinfolkAiAllowance: true,
    confirmationRequired: true,
  };
}

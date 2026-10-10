const LEAKED_ENVELOPE_START = /\n\s*(?:\{\s*\n\s*"reply"\s*:|(?:recommendations|followUpSuggestions|smartPromotion|taskAction|follow[- ]?up suggestions)\s*:)/i;

/**
 * The lean path is rendered as ordinary conversation, not a transport envelope.
 * A model occasionally duplicates response-schema fields inside `reply`; remove
 * only a standalone trailing envelope block while leaving normal prose intact.
 */
export function sanitizeKinfolkGeneralReply(reply: string): string {
  const normalized = reply.trim();
  const marker = normalized.search(LEAKED_ENVELOPE_START);
  return marker >= 0 ? normalized.slice(0, marker).trim() : normalized;
}

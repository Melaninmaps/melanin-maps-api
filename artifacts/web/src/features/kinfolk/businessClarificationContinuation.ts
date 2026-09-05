export function businessClarificationContinuation(
  originalQuery: string | null | undefined,
  selectedContext?: string | null,
): string {
  const original = originalQuery?.trim() || "Continue my local business search";
  const context = selectedContext?.trim();
  return context
    ? `${original} — ${context}`
    : `${original} — keep this search broad`;
}

export function businessClarificationContinuation(
  originalQuery: string | null | undefined,
  selectedLabel?: string | null,
): string {
  const original = originalQuery?.trim() || "Continue my local business search";
  const context = selectedLabel?.trim();
  return context
    ? `${original} — ${context}`
    : `${original} — keep this search broad`;
}

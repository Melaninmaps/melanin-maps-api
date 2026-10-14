/**
 * Converts the serialized notification topic formats found in legacy and
 * current isolated databases into an exact safety-topic decision. PostgreSQL
 * arrays serialize as `{community,safety}`, while newer rows may be JSON.
 */
export function allowsSafetyCheckinNotification(
  topicsText: string | null,
  defaultWhenMissing = false,
): boolean {
  if (topicsText === null) return defaultWhenMissing;
  const value = topicsText.trim();
  if (!value) return false;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.some((topic) => topic === "safety");
    if (typeof parsed === "string") return parsed === "safety";
  } catch {
    // PostgreSQL text-array output (for example, {community,safety}) is not JSON.
  }
  return /(^|[,\[{])\s*"?safety"?\s*(?=$|[,}\]])/.test(value);
}

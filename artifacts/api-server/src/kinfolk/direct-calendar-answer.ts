const DIRECT_CALENDAR_DATE_RE = /^(?:\s*(?:what(?:'s|\s+is)|tell me|can you tell me)\s+(?:the\s+)?(?:date(?:\s+today)?|today'?s\s+date)|\s*what\s+day\s+is\s+it)\s*[?!.]*\s*$/i;
const SHORTHAND_CALENDAR_DATE_RE = /^\s*(?:today'?s\s+date|date\s+today|what\s+day\s+is\s+today)\s*[?!.]*\s*$/i;

/**
 * Calendar-only questions are deterministic. They must never be routed through
 * current-web research, where an otherwise healthy chat can return a misleading
 * source-availability fallback instead of the date.
 */
export function isDirectKinfolkCalendarDateQuestion(message: string): boolean {
  return DIRECT_CALENDAR_DATE_RE.test(message) || SHORTHAND_CALENDAR_DATE_RE.test(message);
}

function supportedTimeZone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 120) return null;
  const candidate = value.trim();
  if (!candidate) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return null;
  }
}

export function answerDirectKinfolkCalendarDate(input: {
  message: string;
  clientTimeZone?: unknown;
  now?: Date;
}): string | null {
  if (!isDirectKinfolkCalendarDateQuestion(input.message)) return null;
  const timeZone = supportedTimeZone(input.clientTimeZone) ?? "UTC";
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(input.now ?? new Date());
  return `Today is ${date}.`;
}

const DIRECT_CALENDAR_DATE_RE = /^(?:\s*(?:what(?:'s|\s+is)|tell me|can you tell me)\s+(?:the\s+)?(?:date(?:\s+today)?|today'?s\s+date)|\s*what\s+day\s+is\s+it)\s*[?!.]*\s*$/i;
const SHORTHAND_CALENDAR_DATE_RE = /^\s*(?:today'?s\s+date|date\s+today|what\s+day\s+is\s+today)\s*[?!.]*\s*$/i;
const TOMORROW_CALENDAR_DATE_RE = /^\s*(?:(?:what(?:'s|\s+is)\s+)?(?:tomorrow'?s\s+(?:date|day)|(?:the\s+)?(?:date|day)\s+(?:of\s+)?tomorrow)|what\s+(?:weekday\s+and\s+)?(?:calendar\s+)?date\s+will\s+tomorrow\s+be|what\s+day\s+will\s+tomorrow\s+be)(?:\s+in\s+[A-Za-z][A-Za-z .'-]{1,80})?\s*[?!.]*\s*$/i;

type CalendarQuestion = "today" | "tomorrow";

function calendarQuestion(message: string): CalendarQuestion | null {
  if (DIRECT_CALENDAR_DATE_RE.test(message) || SHORTHAND_CALENDAR_DATE_RE.test(message)) {
    return "today";
  }
  return TOMORROW_CALENDAR_DATE_RE.test(message) ? "tomorrow" : null;
}

/**
 * Calendar-only questions are deterministic. They must never be routed through
 * current-web research, where an otherwise healthy chat can return a misleading
 * source-availability fallback instead of the date.
 */
export function isDirectKinfolkCalendarDateQuestion(message: string): boolean {
  return calendarQuestion(message) !== null;
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

function calendarDateForZone(input: { now: Date; timeZone: string; offsetDays: number }): Date {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone: input.timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(input.now).reduce<Record<string, number>>((parts, part) => {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
    return parts;
  }, {});

  // Construct at UTC midnight from the zone's *calendar* date. Formatting that
  // date in UTC avoids adding 24 hours across a daylight-saving transition.
  return new Date(Date.UTC(values.year, values.month - 1, values.day + input.offsetDays));
}

function formatCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function answerDirectKinfolkCalendarDate(input: {
  message: string;
  clientTimeZone?: unknown;
  now?: Date;
}): string | null {
  const question = calendarQuestion(input.message);
  if (!question) return null;

  const timeZone = supportedTimeZone(input.clientTimeZone) ?? "UTC";
  const date = formatCalendarDate(calendarDateForZone({
    now: input.now ?? new Date(),
    timeZone,
    offsetDays: question === "tomorrow" ? 1 : 0,
  }));
  return question === "tomorrow" ? `Tomorrow will be ${date}.` : `Today is ${date}.`;
}

export type KinfolkTemporalContextInput = Readonly<{
  /** IANA zone supplied by the active client for this single request. */
  clientTimeZone?: unknown;
  /** Already-resolved destination-local context for a location-aware current turn. */
  destinationLocalTimeContext?: string | null;
  now?: Date;
}>;

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

function formatLocalTime(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);
}

/**
 * A single, request-scoped temporal contract for every model-generated Kinfolk
 * answer. The server establishes the current instant; a valid client IANA zone
 * merely tells the server how to render that instant for ordinary life questions.
 *
 * This is intentionally not location tracking, profile data, or persistent
 * memory. Destination-local time remains separately resolved only when the
 * current request is actually location-aware.
 */
export function buildKinfolkTemporalContext(input: KinfolkTemporalContextInput): string {
  const timeZone = supportedTimeZone(input.clientTimeZone) ?? "UTC";
  const now = input.now ?? new Date();
  const renderedNow = formatLocalTime(now, timeZone);
  const destination = input.destinationLocalTimeContext?.trim();

  return [
    "TEMPORAL CONTEXT — SERVER-RESOLVED FOR THIS RESPONSE:",
    `At response generation, it is ${renderedNow} in the member's active time zone (${timeZone}).`,
    "Treat the member's relative time language—today, tonight, tomorrow, this weekend, next week, later, already there, arriving, leaving, and future plans—as active context. Do not assume every travel question is before arrival.",
    "Use the relevant local calendar and clock before describing dates, meal times, event timing, reminders, arrival, departure, or what may still be open. When a relative date could be misunderstood, include the concrete weekday or calendar date naturally.",
    "Do not mention this context or volunteer the current time unless it helps answer the member's question. Do not call a business, event, alert, route, price, weather condition, or hours current/open without supplied current evidence.",
    destination
      ? `For this location-aware current turn, ${destination.replace(/^SERVER-RESOLVED LOCAL TIME — AUTHORITATIVE FOR LOCATION FEATURES:\s*/i, "")}`
      : "No destination-local clock is active for this turn. Do not borrow a city or time zone from an earlier, unrelated conversation.",
  ].join("\n");
}

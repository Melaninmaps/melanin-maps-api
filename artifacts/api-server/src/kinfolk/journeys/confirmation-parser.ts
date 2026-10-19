import { redactedPreview } from "./domain";

export type JourneyParsedFact = Readonly<{
  field:
    | "confirmation_code"
    | "flight_number"
    | "airline"
    | "origin"
    | "destination"
    | "start_date"
    | "end_date"
    | "start_time"
    | "end_time"
    | "lodging"
    | "location"
    | "title";
  value: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}>;

export type JourneyConfirmationParseResult = Readonly<{
  kind:
    | "flight"
    | "lodging"
    | "reservation"
    | "event"
    | "transport"
    | "unknown";
  title: string;
  facts: readonly JourneyParsedFact[];
  warnings: readonly string[];
  reviewRequired: true;
}>;

const AIRLINE_CODES: Readonly<Record<string, string>> = {
  AA: "American Airlines",
  AS: "Alaska Airlines",
  B6: "JetBlue",
  DL: "Delta Air Lines",
  F9: "Frontier Airlines",
  NK: "Spirit Airlines",
  SW: "Southwest Airlines",
  UA: "United Airlines",
  WN: "Southwest Airlines",
};

function distinctFacts(facts: JourneyParsedFact[]): JourneyParsedFact[] {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    const key = `${fact.field}:${fact.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fact(
  field: JourneyParsedFact["field"],
  value: string | undefined,
  confidence: JourneyParsedFact["confidence"],
  reason: string,
): JourneyParsedFact | null {
  const trimmed = value?.trim();
  return trimmed ? { field, value: trimmed, confidence, reason } : null;
}

function detectKind(text: string): JourneyConfirmationParseResult["kind"] {
  if (/\b(?:flight|boarding|departure|arrival|airline|gate)\b/i.test(text))
    return "flight";
  if (/\b(?:hotel|lodging|check[- ]?in|check[- ]?out|room)\b/i.test(text))
    return "lodging";
  if (
    /\b(?:rental car|car rental|train|rail|bus|ferry|rideshare)\b/i.test(text)
  )
    return "transport";
  if (/\b(?:ticket|event|concert|admission|venue)\b/i.test(text))
    return "event";
  if (/\b(?:reservation|booking|confirmation)\b/i.test(text))
    return "reservation";
  return "unknown";
}

function detectTitle(kind: JourneyConfirmationParseResult["kind"]): string {
  // A confirmation subject can contain private names, account identifiers, or
  // arbitrary prose. Return a category label rather than reproducing that raw
  // source text in a saved draft field.
  const labels: Record<JourneyConfirmationParseResult["kind"], string> = {
    flight: "Flight confirmation",
    lodging: "Lodging confirmation",
    transport: "Transport confirmation",
    event: "Event confirmation",
    reservation: "Reservation confirmation",
    unknown: "Imported travel detail",
  };
  return labels[kind];
}

/**
 * Parses only facts that are explicitly present in member-provided text. The
 * result is deliberately review-only: dates, codes, and locations are never
 * converted into a confirmed booking or calendar event without a member action.
 */
export function parseJourneyConfirmationText(
  value: string,
): JourneyConfirmationParseResult {
  const text = value
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .trim();
  const kind = detectKind(text);
  const facts: JourneyParsedFact[] = [];
  const warnings: string[] = [];

  const confirmation = text.match(
    /\b(?:confirmation|booking|reservation)(?:[ \t]*(?:number|no\.?|#|code))?[ \t]*(?::|#|-|[ \t]+)[ \t]*([A-Z0-9-]{5,32})\b/i,
  );
  const confirmationFact = fact(
    "confirmation_code",
    confirmation?.[1]?.toUpperCase(),
    "high",
    "Explicit confirmation label in member-provided content.",
  );
  if (confirmationFact) facts.push(confirmationFact);

  const flight = text.match(/\b([A-Z]{2})\s?(\d{1,4})\b/);
  if (flight) {
    const carrier = AIRLINE_CODES[flight[1]!.toUpperCase()];
    facts.push({
      field: "flight_number",
      value: `${flight[1]!.toUpperCase()}${flight[2]}`,
      confidence: "medium",
      reason:
        "Airline-style code and flight number in member-provided content.",
    });
    const airlineFact = fact(
      "airline",
      carrier,
      "medium",
      "Carrier inferred only from the explicit flight designator.",
    );
    if (airlineFact) facts.push(airlineFact);
  }

  const route = text.match(/\b([A-Z]{3})\s*(?:→|->|to)\s*([A-Z]{3})\b/);
  if (route) {
    facts.push({
      field: "origin",
      value: route[1]!,
      confidence: "high",
      reason: "Explicit airport-code route in member-provided content.",
    });
    facts.push({
      field: "destination",
      value: route[2]!,
      confidence: "high",
      reason: "Explicit airport-code route in member-provided content.",
    });
  }

  const isoDates = [...text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map(
    (match) => match[1]!,
  );
  if (isoDates[0])
    facts.push({
      field: "start_date",
      value: isoDates[0],
      confidence: "high",
      reason: "Explicit ISO date in member-provided content.",
    });
  if (isoDates[1])
    facts.push({
      field: "end_date",
      value: isoDates[1],
      confidence: "high",
      reason: "Second explicit ISO date in member-provided content.",
    });

  const monthDates = [
    ...text.matchAll(
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+20\d{2})?\b/gi,
    ),
  ].map((match) => match[0]!);
  if (!isoDates.length && monthDates[0])
    facts.push({
      field: "start_date",
      value: monthDates[0],
      confidence: "medium",
      reason:
        "Explicit written date in member-provided content; confirm year and time zone.",
    });
  if (!isoDates.length && monthDates[1])
    facts.push({
      field: "end_date",
      value: monthDates[1],
      confidence: "medium",
      reason:
        "Second explicit written date in member-provided content; confirm year and time zone.",
    });

  const times = [
    ...text.matchAll(/\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s?(?:AM|PM|am|pm)\b/g),
  ].map((match) => match[0]!);
  if (times[0])
    facts.push({
      field: "start_time",
      value: times[0],
      confidence: "medium",
      reason:
        "Explicit time in member-provided content; confirm local time zone.",
    });
  if (times[1])
    facts.push({
      field: "end_time",
      value: times[1],
      confidence: "medium",
      reason:
        "Second explicit time in member-provided content; confirm local time zone.",
    });

  const lodging = text.match(
    /\b(?:hotel|lodging|property|stay)(?:\s*(?:at|:|-))?\s*([A-Z][A-Za-z0-9&'., -]{2,90})/i,
  );
  const lodgingFact = fact(
    "lodging",
    lodging?.[1],
    "low",
    "Possible lodging name from a labeled line; confirm before saving.",
  );
  if (lodgingFact) facts.push(lodgingFact);

  const location = text.match(
    /\b(?:address|location|venue)(?:\s*[:#-])\s*([^\n]{4,160})/i,
  );
  const locationFact = fact(
    "location",
    location?.[1],
    "medium",
    "Explicit location label in member-provided content.",
  );
  if (locationFact) facts.push(locationFact);

  facts.push({
    field: "title",
    value: detectTitle(kind),
    confidence: "low",
    reason:
      "Draft title generated from the member-provided content for review.",
  });

  if (facts.length <= 1)
    warnings.push(
      "No structured travel facts were found. Keep this as a note or add details manually.",
    );
  if (kind === "unknown")
    warnings.push(
      "The import type is uncertain. Review and choose the correct plan type before confirming.",
    );
  if (facts.some((entry) => entry.confidence !== "high"))
    warnings.push(
      "Some details need review because the source did not state them in a fully unambiguous format.",
    );

  return {
    kind,
    title: detectTitle(kind),
    facts: distinctFacts(facts),
    warnings,
    reviewRequired: true,
  };
}

function unfoldIcsLines(value: string): string[] {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function icsValue(lines: readonly string[], property: string): string | null {
  const match = lines.find((line) =>
    new RegExp(`^${property}(?:;[^:]*)?:`, "i").test(line),
  );
  if (!match) return null;
  return (
    match
      .slice(match.indexOf(":") + 1)
      .replace(/\\n/gi, " ")
      .trim() || null
  );
}

function icsDateParts(
  value: string | null,
): { date: string; time: string | null } | null {
  if (!value) return null;
  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(?:\d{2})?(?:Z)?)?$/,
  );
  if (!match) return null;
  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: match[4] && match[5] ? `${match[4]}:${match[5]}` : null,
  };
}

/**
 * Parses one member-selected iCalendar file as a review-only event proposal.
 * It intentionally reads only the first VEVENT and never writes to a calendar.
 */
export function parseJourneyIcs(value: string): JourneyConfirmationParseResult {
  const lines = unfoldIcsLines(value);
  const eventStart = lines.findIndex((line) => /^BEGIN:VEVENT$/i.test(line));
  const eventEnd = lines.findIndex(
    (line, index) => index > eventStart && /^END:VEVENT$/i.test(line),
  );
  if (eventStart < 0 || eventEnd < 0) {
    const fallback = parseJourneyConfirmationText(value);
    return {
      ...fallback,
      warnings: [
        "This calendar file did not contain a complete event. Review it manually before saving any details.",
        ...fallback.warnings,
      ],
    };
  }
  const event = lines.slice(eventStart + 1, eventEnd);
  const summary = icsValue(event, "SUMMARY") ?? "Imported calendar event";
  const location = icsValue(event, "LOCATION");
  const startsAt = icsDateParts(icsValue(event, "DTSTART"));
  const endsAt = icsDateParts(icsValue(event, "DTEND"));
  const facts: JourneyParsedFact[] = [
    {
      field: "title",
      value: redactedPreview(summary, 100),
      confidence: "high",
      reason: "Explicit event title in the member-selected calendar file.",
    },
  ];
  if (startsAt) {
    facts.push({
      field: "start_date",
      value: startsAt.date,
      confidence: "high",
      reason: "Explicit event start date in the member-selected calendar file.",
    });
    if (startsAt.time)
      facts.push({
        field: "start_time",
        value: startsAt.time,
        confidence: "medium",
        reason:
          "Explicit event start time in the member-selected calendar file; confirm its time zone.",
      });
  }
  if (endsAt) {
    facts.push({
      field: "end_date",
      value: endsAt.date,
      confidence: "high",
      reason: "Explicit event end date in the member-selected calendar file.",
    });
    if (endsAt.time)
      facts.push({
        field: "end_time",
        value: endsAt.time,
        confidence: "medium",
        reason:
          "Explicit event end time in the member-selected calendar file; confirm its time zone.",
      });
  }
  if (location)
    facts.push({
      field: "location",
      value: redactedPreview(location, 160),
      confidence: "medium",
      reason: "Explicit location in the member-selected calendar file.",
    });
  return {
    kind: "event",
    title: redactedPreview(summary, 100),
    facts: distinctFacts(facts),
    warnings: [
      "This is a private calendar-file proposal. It is not written to any calendar or confirmed until you choose what to save.",
    ],
    reviewRequired: true,
  };
}

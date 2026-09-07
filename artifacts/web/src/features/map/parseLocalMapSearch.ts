import { getHeritageCity } from "@workspace/constants";

export type ParsedLocalMapSearch = {
  subject: string;
  city?: string;
  stateCode?: string;
  usesDeviceLocation?: boolean;
};

const SUBJECTS: Array<{ expression: RegExp; subject: string }> = [
  { expression: /\b(?:book\s*stores?|bookshops?|booksellers?)\b/i, subject: "bookstore" },
  { expression: /\bgrocery\s+stores?\b/i, subject: "grocery store" },
  { expression: /\b(?:restaurants?|dining)\b/i, subject: "restaurant" },
  { expression: /\b(?:barber[ -]?shops?|barbers?)\b/i, subject: "barber" },
  { expression: /\b(?:locs?|dreadlocks?|natural[ -]?hair|protective styles?)\b/i, subject: "locs" },
  { expression: /\b(?:salons?|beauty)\b/i, subject: "salon" },
  { expression: /\b(?:hvac|heating and (?:air|cooling)|air conditioning|a\/c repair)\b/i, subject: "hvac" },
];
const DEVICE_LOCATION = /^(?:me|my location|current location|nearby|here)$/i;
const ZIP_CODE = /^\d{5}(?:-\d{4})?$/;

type TypedGeography = { city: string; stateCode?: string };

function normalizeSubject(value: string): string {
  const subject = value.trim().replace(/^[, ]+|[, ]+$/g, "");
  return SUBJECTS.find(({ expression }) => expression.test(subject))?.subject ?? subject;
}

function typedGeography(value: string): TypedGeography | null {
  const candidate = value.trim().replace(/^[, ]+|[, .!?]+$/g, "");
  if (ZIP_CODE.test(candidate)) return { city: candidate };
  const canonical = getHeritageCity(candidate);
  return canonical ? { city: canonical.city, stateCode: canonical.state } : null;
}

function parsedWithGeography(subjectText: string, geography: TypedGeography): ParsedLocalMapSearch {
  return {
    subject: normalizeSubject(subjectText),
    city: geography.city,
    ...(geography.stateCode ? { stateCode: geography.stateCode } : {}),
  };
}

/** Coordinates are intentionally resolved by the server, never from this parser. */
export function parseLocalMapSearch(input: string): ParsedLocalMapSearch {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) return { subject: "" };

  const explicitLocation = text.match(/^(.+?)\s+(?:in|near|at|around)\s+(.+)$/i);
  if (explicitLocation) {
    const subjectText = explicitLocation[1].trim();
    const locationText = explicitLocation[2].trim();
    if (subjectText && DEVICE_LOCATION.test(locationText)) {
      return { subject: normalizeSubject(subjectText), usesDeviceLocation: true };
    }
    const geography = subjectText ? typedGeography(locationText) : null;
    if (geography) return parsedWithGeography(subjectText, geography);
  }

  const trailingDeviceLocation = text.match(/^(.*?)\s+(me|my location|current location|nearby|here)$/i);
  if (trailingDeviceLocation?.[1]?.trim()) {
    return { subject: normalizeSubject(trailingDeviceLocation[1]), usesDeviceLocation: true };
  }

  // Test every trailing phrase against the canonical city/state/alias registry or
  // ZIP grammar. A bare trailing word is never geography merely because it is last.
  for (const match of text.matchAll(/\s+/g)) {
    const boundary = (match.index ?? -1) + match[0].length;
    const subjectText = text.slice(0, match.index).trim();
    if (!subjectText) continue;
    const geography = typedGeography(text.slice(boundary));
    if (geography) return parsedWithGeography(subjectText, geography);
  }

  // With no validated typed geography, local business text is a genuine nearby
  // search. Conversely, every typed city/state/ZIP return above omits this flag,
  // so an older browser GPS fix can never override geography from this turn.
  return { subject: normalizeSubject(text), usesDeviceLocation: true };
}

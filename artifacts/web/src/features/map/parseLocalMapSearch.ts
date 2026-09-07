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
const DEFAULT_STATE_BY_CITY: Record<string, string> = {
  atlanta: "GA",
  philadelphia: "PA",
  phoenix: "AZ",
};
const DEVICE_LOCATION = /^(?:me|my location|current location|nearby|here)$/i;

/** Coordinates are intentionally resolved by the server, never from this parser. */
export function parseLocalMapSearch(input: string): ParsedLocalMapSearch {
  const text = input.trim().replace(/\s+/g, " ");
  const definition = SUBJECTS.find(({ expression }) => expression.test(text));
  const subjectMatch = definition?.expression.exec(text);
  const subject = definition?.subject ?? text;
  const trailingText = subjectMatch
    ? text.slice((subjectMatch.index ?? 0) + subjectMatch[0].length)
    : "";
  const location = trailingText
    .replace(/^\s*,?\s*(?:(?:in|near|at|around)\s+)?/i, "")
    .trim()
    .replace(/^[, ]+|[, ]+$/g, "");
  // A recognized subject with no typed geography is a genuine nearby search.
  // Any city or ZIP parsed below is returned without this flag, so callers can
  // never let an older GPS fix override geography the member typed.
  if (!location) return definition ? { subject, usesDeviceLocation: true } : { subject };
  if (DEVICE_LOCATION.test(location)) return { subject, usesDeviceLocation: true };
  const stateMatch = location.match(/^(.*?)\s*,?\s+([A-Z]{2})$/i);
  const city = (stateMatch?.[1] ?? location).trim();
  const suppliedState = stateMatch?.[2]?.toUpperCase();
  return { subject, city, stateCode: suppliedState ?? (city ? DEFAULT_STATE_BY_CITY[city.toLowerCase()] : undefined) };
}

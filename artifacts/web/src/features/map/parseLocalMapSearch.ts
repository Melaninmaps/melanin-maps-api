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
const CITY_NAME = /^[\p{L}][\p{L}\p{M}.'’ -]{0,78}[\p{L}.]$/u;
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);
const US_STATE_NAMES = new Map<string, string>([
  ["alabama", "AL"], ["alaska", "AK"], ["arizona", "AZ"], ["arkansas", "AR"],
  ["california", "CA"], ["colorado", "CO"], ["connecticut", "CT"], ["delaware", "DE"],
  ["florida", "FL"], ["georgia", "GA"], ["hawaii", "HI"], ["idaho", "ID"],
  ["illinois", "IL"], ["indiana", "IN"], ["iowa", "IA"], ["kansas", "KS"],
  ["kentucky", "KY"], ["louisiana", "LA"], ["maine", "ME"], ["maryland", "MD"],
  ["massachusetts", "MA"], ["michigan", "MI"], ["minnesota", "MN"], ["mississippi", "MS"],
  ["missouri", "MO"], ["montana", "MT"], ["nebraska", "NE"], ["nevada", "NV"],
  ["new hampshire", "NH"], ["new jersey", "NJ"], ["new mexico", "NM"], ["new york", "NY"],
  ["north carolina", "NC"], ["north dakota", "ND"], ["ohio", "OH"], ["oklahoma", "OK"],
  ["oregon", "OR"], ["pennsylvania", "PA"], ["rhode island", "RI"], ["south carolina", "SC"],
  ["south dakota", "SD"], ["tennessee", "TN"], ["texas", "TX"], ["utah", "UT"],
  ["vermont", "VT"], ["virginia", "VA"], ["washington", "WA"], ["west virginia", "WV"],
  ["wisconsin", "WI"], ["wyoming", "WY"], ["district of columbia", "DC"],
]);

type TypedGeography = { city: string; stateCode?: string };

function explicitUsCityState(value: string): TypedGeography | null {
  const normalized = value.trim().replace(/\s+/g, " ");
  const codeMatch = normalized.match(/^(.+?)(?:,\s*|\s+)([A-Za-z]{2})$/);
  if (codeMatch) {
    const city = codeMatch[1].trim();
    const stateCode = codeMatch[2].toUpperCase();
    return CITY_NAME.test(city) && US_STATE_CODES.has(stateCode) ? { city, stateCode } : null;
  }
  const lowered = normalized.toLocaleLowerCase("en-US");
  const stateNamesLongestFirst = [...US_STATE_NAMES].sort((left, right) => right[0].length - left[0].length);
  for (const [stateName, stateCode] of stateNamesLongestFirst) {
    const suffix = ` ${stateName}`;
    if (!lowered.endsWith(suffix)) continue;
    const city = normalized.slice(0, -suffix.length).replace(/,\s*$/, "").trim();
    return CITY_NAME.test(city) ? { city, stateCode } : null;
  }
  return null;
}

function normalizeSubject(value: string): string {
  const subject = value.trim().replace(/^[, ]+|[, ]+$/g, "");
  return SUBJECTS.find(({ expression }) => expression.test(subject))?.subject ?? subject;
}

function isKnownSubject(value: string): boolean {
  return SUBJECTS.some(({ expression }) => expression.test(value));
}

function typedGeography(value: string): TypedGeography | null {
  const candidate = value.trim().replace(/^[, ]+|[, .!?]+$/g, "");
  if (ZIP_CODE.test(candidate)) return { city: candidate };
  const canonical = getHeritageCity(candidate);
  return canonical
    ? { city: canonical.city, stateCode: canonical.state }
    : explicitUsCityState(candidate);
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

  // Collect every trailing phrase that satisfies the canonical registry, ZIP
  // grammar, or explicit city+state grammar. Multiword cities can otherwise
  // produce several syntactically valid splits (for example Los Angeles CA).
  const candidates: Array<{
    subjectText: string;
    locationText: string;
    geography: TypedGeography;
  }> = [];
  for (const match of text.matchAll(/\s+/g)) {
    const boundary = (match.index ?? -1) + match[0].length;
    const subjectText = text.slice(0, match.index).trim();
    if (!subjectText) continue;
    const locationText = text.slice(boundary).trim();
    const geography = typedGeography(locationText);
    if (geography) candidates.push({ subjectText, locationText, geography });
  }
  if (candidates.length > 0) {
    // A recognized business phrase is the strongest split: this preserves
    // Book Store | Atlanta, GA instead of Book | Store Atlanta, GA.
    const recognized = candidates.filter(({ subjectText }) => isKnownSubject(subjectText)).at(-1);
    if (recognized) return parsedWithGeography(recognized.subjectText, recognized.geography);

    // Capitalization identifies the boundary for arbitrary multiword services
    // when present (mobile dog grooming | Boston MA). Otherwise the first valid
    // split retains the complete city tail (plumber | Los Angeles CA).
    const capitalizationBoundary = candidates.find(({ subjectText, locationText }) => {
      const subjectLast = subjectText.split(/\s+/).at(-1) ?? "";
      const locationFirst = locationText.split(/\s+/)[0] ?? "";
      return /^[a-z]/.test(subjectLast) && /^\p{Lu}/u.test(locationFirst);
    });
    const selected = capitalizationBoundary ?? candidates[0];
    return parsedWithGeography(selected.subjectText, selected.geography);
  }

  // With no validated typed geography, local business text is a genuine nearby
  // search. Conversely, every typed city/state/ZIP return above omits this flag,
  // so an older browser GPS fix can never override geography from this turn.
  return { subject: normalizeSubject(text), usesDeviceLocation: true };
}

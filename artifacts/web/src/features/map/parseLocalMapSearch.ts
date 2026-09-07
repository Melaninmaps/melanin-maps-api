export type ParsedLocalMapSearch = {
  subject: string;
  city?: string;
  stateCode?: string;
};

const SUBJECTS: Array<{ expression: RegExp; subject: string }> = [
  { expression: /\bbook\s*stores?\b|\bbookshops?\b|\bbooksellers?\b/i, subject: "bookstore" },
  { expression: /\bgrocery\s+stores?\b/i, subject: "grocery store" },
  { expression: /\brestaurants?\b|\bdining\b/i, subject: "restaurant" },
  { expression: /\bbarbers?\b|\bsalons?\b|\bbeauty\b/i, subject: "beauty" },
];
const DEFAULT_STATE_BY_CITY: Record<string, string> = { atlanta: "GA" };

/** Coordinates are intentionally resolved by the server, never from this parser. */
export function parseLocalMapSearch(input: string): ParsedLocalMapSearch {
  const text = input.trim().replace(/\s+/g, " ");
  const match = SUBJECTS.find(({ expression }) => expression.test(text));
  const subject = match?.subject ?? text;
  const afterIn = text.match(/\bin\s+(.+?)\s*$/i)?.[1];
  const atStart = match && text.match(new RegExp(`^\\s*${match.expression.source}\\s+(.+?)\\s*$`, "i"));
  const location = (afterIn ?? atStart?.[1])?.trim().replace(/^[, ]+|[, ]+$/g, "");
  if (!location) return { subject };
  const stateMatch = location.match(/^(.*?)\s*,?\s+([A-Z]{2})$/i);
  const city = (stateMatch?.[1] ?? location).trim();
  const suppliedState = stateMatch?.[2]?.toUpperCase();
  return { subject, city, stateCode: suppliedState ?? (city ? DEFAULT_STATE_BY_CITY[city.toLowerCase()] : undefined) };
}
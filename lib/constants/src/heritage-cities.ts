export type HeritageCity = Readonly<{
  city: string;
  state: string;
  stateName?: string;
  aliases?: readonly string[];
}>;

export type HeritageCityResolution = Readonly<{
  city: string;
  state: string;
  matchedText: string;
  normalizedMatch: string;
  matchKind: "canonical" | "alias";
}>;

/**
 * Canonical geography used by Kinfolk city, local-discovery, and heritage flows.
 *
 * Entries contain geography only. They intentionally contain no demographic or
 * cultural-identity attributes: a member's location must never be used to infer
 * who they are. Add new cities here instead of creating route-local alias maps.
 */
export const HERITAGE_CITIES: readonly HeritageCity[] = [
  // International city/province pairs are canonical inventory scopes too. This
  // prevents an explicit city-only request from becoming an unscoped fallback.
  { city: "Toronto", state: "ON", stateName: "Ontario", aliases: ["Toronto, Ontario", "Toronto ON"] },
  {
    city: "Philadelphia",
    state: "PA",
    stateName: "Pennsylvania",
    aliases: ["Philly", "City of Brotherly Love", "The City of Brotherly Love"],
  },
  {
    city: "New York",
    state: "NY",
    stateName: "New York",
    aliases: ["NYC", "New York City", "The Big Apple"],
  },
  {
    city: "Washington",
    state: "DC",
    aliases: ["Washington DC", "Washington D.C."],
  },
  { city: "Los Angeles", state: "CA", stateName: "California" },
  {
    city: "Chicago",
    state: "IL",
    stateName: "Illinois",
    aliases: ["Chitown", "Chi-Town", "The Windy City"],
  },
  {
    city: "Houston",
    state: "TX",
    stateName: "Texas",
    aliases: ["H-Town", "Space City"],
  },
  {
    city: "New Orleans",
    state: "LA",
    stateName: "Louisiana",
    aliases: ["NOLA", "The Big Easy", "Nawlins", "N'awlins"],
  },
  {
    city: "Baltimore",
    state: "MD",
    stateName: "Maryland",
    aliases: ["Bmore", "Charm City"],
  },
  {
    city: "Detroit",
    state: "MI",
    stateName: "Michigan",
    aliases: ["Motor City"],
  },
  { city: "Oakland", state: "CA", stateName: "California" },
  {
    city: "Nashville",
    state: "TN",
    stateName: "Tennessee",
    aliases: ["Nash Vegas"],
  },
  {
    city: "Memphis",
    state: "TN",
    stateName: "Tennessee",
    aliases: ["Bluff City"],
  },
  { city: "Jackson", state: "MS", stateName: "Mississippi" },
  { city: "Richmond", state: "VA", stateName: "Virginia", aliases: ["RVA"] },
  { city: "Charlotte", state: "NC", stateName: "North Carolina" },
  {
    city: "Birmingham",
    state: "AL",
    stateName: "Alabama",
    aliases: ["B-Ham", "Bham"],
  },
  {
    city: "Atlanta",
    state: "GA",
    stateName: "Georgia",
    aliases: ["ATL", "Hotlanta"],
  },
  { city: "Miami", state: "FL", stateName: "Florida" },
  { city: "Dallas", state: "TX", stateName: "Texas", aliases: ["DFW"] },
  { city: "San Antonio", state: "TX", stateName: "Texas" },
  { city: "Denver", state: "CO", stateName: "Colorado" },
  { city: "Seattle", state: "WA", stateName: "Washington" },
  { city: "Portland", state: "OR", stateName: "Oregon" },
  { city: "Minneapolis", state: "MN", stateName: "Minnesota" },
  { city: "Cleveland", state: "OH", stateName: "Ohio" },
  {
    city: "Cincinnati",
    state: "OH",
    stateName: "Ohio",
    aliases: ["Cincy", "The Nati"],
  },
  { city: "Columbus", state: "OH", stateName: "Ohio" },
  {
    city: "Pittsburgh",
    state: "PA",
    stateName: "Pennsylvania",
    aliases: ["Steel City", "The Burgh", "PGH"],
  },
  {
    city: "Indianapolis",
    state: "IN",
    stateName: "Indiana",
    aliases: ["Indy", "Naptown"],
  },
  { city: "Kansas City", state: "MO", stateName: "Missouri" },
  { city: "St. Louis", state: "MO", stateName: "Missouri", aliases: ["STL"] },
  { city: "Milwaukee", state: "WI", stateName: "Wisconsin" },
  {
    city: "Louisville",
    state: "KY",
    stateName: "Kentucky",
    aliases: ["Derby City"],
  },
  { city: "Tampa", state: "FL", stateName: "Florida" },
  { city: "Orlando", state: "FL", stateName: "Florida" },
  { city: "Jacksonville", state: "FL", stateName: "Florida" },
  { city: "Raleigh", state: "NC", stateName: "North Carolina" },
  { city: "Durham", state: "NC", stateName: "North Carolina" },
  { city: "Greensboro", state: "NC", stateName: "North Carolina" },
  { city: "Columbia", state: "SC", stateName: "South Carolina" },
  { city: "Charleston", state: "SC", stateName: "South Carolina" },
  { city: "Savannah", state: "GA", stateName: "Georgia" },
  { city: "Montgomery", state: "AL", stateName: "Alabama" },
  { city: "Mobile", state: "AL", stateName: "Alabama" },
  { city: "Baton Rouge", state: "LA", stateName: "Louisiana" },
  { city: "Shreveport", state: "LA", stateName: "Louisiana" },
  { city: "Little Rock", state: "AR", stateName: "Arkansas" },
  { city: "Oklahoma City", state: "OK", stateName: "Oklahoma" },
  { city: "Tulsa", state: "OK", stateName: "Oklahoma" },
  { city: "Las Vegas", state: "NV", stateName: "Nevada" },
  { city: "Phoenix", state: "AZ", stateName: "Arizona" },
  { city: "Tucson", state: "AZ", stateName: "Arizona" },
  { city: "Albuquerque", state: "NM", stateName: "New Mexico" },
  { city: "El Paso", state: "TX", stateName: "Texas" },
  {
    city: "San Francisco",
    state: "CA",
    stateName: "California",
    aliases: ["San Fran", "The City by the Bay"],
  },
] as const;

function normalizeLookup(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

type LookupEntry = {
  normalizedForm: string;
  displayForm: string;
  city: HeritageCity;
  matchKind: HeritageCityResolution["matchKind"];
};

function canonicalForms(city: HeritageCity): string[] {
  return [
    city.city,
    `${city.city}, ${city.state}`,
    `${city.city} ${city.state}`,
    ...(city.stateName
      ? [`${city.city}, ${city.stateName}`, `${city.city} ${city.stateName}`]
      : []),
  ];
}

const LOOKUP_ENTRIES: readonly LookupEntry[] = HERITAGE_CITIES.flatMap(
  (city) => [
    ...canonicalForms(city).map((displayForm) => ({
      normalizedForm: normalizeLookup(displayForm),
      displayForm,
      city,
      matchKind: "canonical" as const,
    })),
    ...(city.aliases ?? []).map((displayForm) => ({
      normalizedForm: normalizeLookup(displayForm),
      displayForm,
      city,
      matchKind: "alias" as const,
    })),
  ],
)
  .filter(
    (entry, index, entries) =>
      entries.findIndex(
        (candidate) =>
          candidate.normalizedForm === entry.normalizedForm &&
          candidate.city.city === entry.city.city,
      ) === index,
  )
  .sort((a, b) => b.normalizedForm.length - a.normalizedForm.length);

/** Resolve a registered city anywhere in a user message, earliest match first. */
export function resolveHeritageCity(
  message: string,
): HeritageCityResolution | null {
  const normalizedMessage = normalizeLookup(message);
  if (!normalizedMessage) return null;

  const paddedMessage = ` ${normalizedMessage} `;
  const match = LOOKUP_ENTRIES.map((entry) => ({
    entry,
    index: paddedMessage.indexOf(` ${entry.normalizedForm} `),
  }))
    .filter((candidate) => candidate.index >= 0)
    .sort(
      (a, b) =>
        a.index - b.index ||
        b.entry.normalizedForm.length - a.entry.normalizedForm.length,
    )[0]?.entry;
  if (!match) return null;

  return {
    city: match.city.city,
    state: match.city.state,
    matchedText: match.displayForm,
    normalizedMatch: match.normalizedForm,
    matchKind: match.matchKind,
  };
}

/** Resolve only when the supplied value itself is a registered canonical form or alias. */
export function getHeritageCity(
  value: string | null | undefined,
): HeritageCity | null {
  if (!value) return null;
  const normalizedValue = normalizeLookup(value);
  const match = LOOKUP_ENTRIES.find(
    (entry) => entry.normalizedForm === normalizedValue,
  );
  return match?.city ?? null;
}

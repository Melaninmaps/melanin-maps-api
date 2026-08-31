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

export type TurnGeographyResolution = Readonly<{
  city: string;
  state: string | null;
  source: "alias" | "explicit" | "session";
  currentTurn: boolean;
  matchedText: string | null;
}>;

/**
 * Canonical geography used by Kinfolk city, local-discovery, and heritage flows.
 *
 * Entries contain geography only. They intentionally contain no demographic or
 * cultural-identity attributes: a member's location must never be used to infer
 * who they are. Add new cities here instead of creating route-local alias maps.
 */
export const HERITAGE_CITIES: readonly HeritageCity[] = [
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

function extractUnregisteredDestination(message: string): string | null {
  const patterns = [
    /\b(?:in|to|at|around|visiting|headed to|going to|travelling to|traveling to|moving to|near)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/,
    /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:restaurants|food|spots|places|businesses|things to do|events|bars|brunch|coffee|barbershop|barbers|salons|vibes|nightlife|heritage sites|historic sites)\b/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern)?.[1]?.trim();
    if (match && match.length >= 3) return match;
  }
  return null;
}

/**
 * Resolve current-turn geography before falling back to an already permitted,
 * enabled-session destination. A current message always wins, so changing cities
 * cannot be masked by stale session state. Unregistered international destinations
 * retain the route's existing grammar-based fallback.
 */
export function resolveTurnGeography(
  message: string,
  sessionDestination?: string | null,
): TurnGeographyResolution | null {
  // An explicit destination is stronger than another current-turn city reference
  // (for example, "from Philadelphia to Atlanta"). Resolve it first, but only
  // if the captured value is a known canonical city or a safe alias.
  const unregistered = extractUnregisteredDestination(message);
  const explicitRegistered = unregistered
    ? getHeritageCity(unregistered)
    : null;
  if (explicitRegistered && unregistered) {
    const explicitMatch = resolveHeritageCity(unregistered);
    return {
      city: explicitRegistered.city,
      state: explicitRegistered.state,
      source: explicitMatch?.matchKind === "alias" ? "alias" : "explicit",
      currentTurn: true,
      matchedText: unregistered,
    };
  }

  const current = resolveHeritageCity(message);
  if (current) {
    return {
      city: current.city,
      state: current.state,
      source: current.matchKind === "alias" ? "alias" : "explicit",
      currentTurn: true,
      matchedText: current.matchedText,
    };
  }

  if (unregistered) {
    return {
      city: unregistered,
      state: null,
      source: "explicit",
      currentTurn: true,
      matchedText: unregistered,
    };
  }

  if (!sessionDestination) return null;
  const registeredSession = getHeritageCity(sessionDestination);
  return {
    city: registeredSession?.city ?? sessionDestination,
    state: registeredSession?.state ?? null,
    source: "session",
    currentTurn: false,
    matchedText: null,
  };
}

/** Current-turn geography is authoritative; model output may only fill a blank. */
export function destinationForEnabledSession(input: {
  turn: TurnGeographyResolution | null;
  existingDestination?: string | null;
  modelDestination?: string | null;
}): string | null {
  if (input.turn?.currentTurn) return input.turn.city;
  if (input.existingDestination) {
    return (
      getHeritageCity(input.existingDestination)?.city ??
      input.existingDestination
    );
  }
  if (input.turn) return input.turn.city;
  if (input.modelDestination) {
    return (
      getHeritageCity(input.modelDestination)?.city ?? input.modelDestination
    );
  }
  return null;
}

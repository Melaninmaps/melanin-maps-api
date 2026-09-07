/**
 * Canonical, intentionally small location normalization contract for discovery.
 * Keep aliases here rather than allowing each search surface to grow its own
 * interpretation of a city, country, or postal code.
 */
export function foldDiscoveryLocation(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

const CITY_ALIAS_FAMILIES: Readonly<Record<string, readonly string[]>> = {
  "new york": ["new york", "new york city", "nyc"],
  washington: ["washington", "washington dc", "washington d c", "washington, d.c.", "dc", "d c"],
  "los angeles": ["los angeles", "la"],
  "new orleans": ["new orleans", "nola"],
  philadelphia: ["philadelphia", "philly"],
  atlanta: ["atlanta", "atl"],
  chicago: ["chicago", "chi"],
  houston: ["houston", "hou"],
  baltimore: ["baltimore", "bmore", "bmore md"],
};
const CITY_ALIASES: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.values(CITY_ALIAS_FAMILIES).flatMap((family) =>
    family.map((alias) => [foldDiscoveryLocation(alias), family]),
  ),
);

/** Values are folded so callers can compare them with normalized SQL fields. */
export function getDiscoveryCityAliases(city: string | null | undefined): string[] {
  const folded = foldDiscoveryLocation(city ?? "");
  if (!folded) return [];
  return [...(CITY_ALIASES[folded] ?? [folded])].map(foldDiscoveryLocation);
}

const COUNTRY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  US: ["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"],
  GB: ["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN"],
  CA: ["CA", "CANADA"],
  AU: ["AU", "AUSTRALIA"],
  NG: ["NG", "NIGERIA"],
  GH: ["GH", "GHANA"],
  JM: ["JM", "JAMAICA"],
  BR: ["BR", "BRAZIL"],
};

export function getDiscoveryCountryAliases(countryCode: string | null | undefined): string[] | null {
  if (!countryCode?.trim()) return null;
  const code = countryCode.trim().toUpperCase();
  return [...(COUNTRY_ALIASES[code] ?? [code])];
}

/** Removes presentation whitespace and normalizes case without changing ZIP+4. */
export function normalizeDiscoveryPostalCode(postalCode: string | null | undefined): string | null {
  if (!postalCode?.trim()) return null;
  return postalCode.replace(/\s/g, "").toUpperCase();
}
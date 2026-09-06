export const POLICE_ENCOUNTER_TYPES = [
  "police_stop",
  "ice_activity",
  "racial_profiling",
  "excessive_force",
  "checkpoint",
  "other_encounter",
] as const;

export type PoliceEncounterType = (typeof POLICE_ENCOUNTER_TYPES)[number];
export type IncidentLocationSource = "manual_area" | "current_device" | "selected_place" | "legacy_text";
export type IncidentLocationPrecision = "city" | "neighborhood" | "unknown";

const LEGACY_ENCOUNTER_TYPES: Record<string, PoliceEncounterType> = {
  "police stop/questioning": "police_stop",
  "ice activity": "ice_activity",
  "racial profiling": "racial_profiling",
  "excessive force/misconduct": "excessive_force",
  "checkpoint/roadblock": "checkpoint",
  "other encounter": "other_encounter",
};

const LOCATION_SOURCES = new Set<IncidentLocationSource>([
  "manual_area",
  "current_device",
  "selected_place",
]);

const US_STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA",
  michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC", "d c": "DC",
};

const STREET_LEVEL_PATTERN = /(?:\b\d{1,6}\b|\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|highway|hwy|drive|dr|lane|ln|court|ct)\b)/i;
const CITY_STREET_PATTERN = /(?:\b\d{1,6}\b|\b(?:street|avenue|road|boulevard|highway|drive|lane|court)\b|\b(?:ave|rd|blvd|hwy|dr|ln|ct)\.?$)/i;

export interface IncidentLocation {
  city: string;
  region: string | null;
  area: string | null;
  source: IncidentLocationSource;
  precision: IncidentLocationPrecision;
  label: string;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function recognizedRegion(value: string): string | null {
  const normalized = value.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (/^[a-z]{2}$/.test(normalized)) return normalized.toUpperCase();
  return US_STATE_NAMES[normalized] ?? null;
}

function normalizeRegion(value: string): string | null {
  return recognizedRegion(value) ?? (cleanText(value, 100) || null);
}

function splitCityRegion(value: string): { city: string; region: string | null } {
  const cleaned = cleanText(value, 200);
  const commaParts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) {
    const region = normalizeRegion(commaParts[commaParts.length - 1]);
    return { city: cleanText(commaParts.slice(0, -1).join(", "), 100), region };
  }

  const words = cleaned.split(" ").filter(Boolean);
  for (const suffixLength of [3, 2, 1]) {
    if (words.length <= suffixLength) continue;
    const suffix = words.slice(-suffixLength).join(" ").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
    const region = suffixLength === 1 && /^[a-z]{2}$/.test(suffix)
      ? suffix.toUpperCase()
      : US_STATE_NAMES[suffix];
    if (region) return { city: cleanText(words.slice(0, -suffixLength).join(" "), 100), region };
  }
  return { city: cleanText(cleaned, 100), region: null };
}

function coarseArea(value: unknown): string | null {
  const area = cleanText(value, 255);
  if (!area || STREET_LEVEL_PATTERN.test(area)) return null;
  return area;
}

function labelFor(city: string, region: string | null, area: string | null): string {
  const cityRegion = region ? `${city}, ${region}` : city;
  return (area ? `${area}, ${cityRegion}` : cityRegion).slice(0, 255);
}

function sensitiveCityOnlyInput(value: string): string | null {
  const parts = cleanText(value, 200).split(",").map((part) => part.trim()).filter(Boolean);
  const candidate = parts.length > 1 ? parts.slice(-2).join(", ") : parts[0] ?? "";
  const { city } = splitCityRegion(candidate);
  return !city || CITY_STREET_PATTERN.test(city) ? null : candidate;
}

export function normalizePoliceEncounterType(value: unknown): PoliceEncounterType | null {
  const normalized = cleanText(value, 80).toLowerCase();
  if (!normalized) return null;
  if ((POLICE_ENCOUNTER_TYPES as readonly string[]).includes(normalized)) {
    return normalized as PoliceEncounterType;
  }
  return LEGACY_ENCOUNTER_TYPES[normalized] ?? null;
}

export function reportMustBeAnonymous(category: string): boolean {
  return category === "police" || category === "discrimination";
}

export function normalizeReportTarget(
  targetType: unknown,
  targetId: unknown,
  sensitive: boolean,
): { targetType: "neighborhood" | "business" | "area"; targetId: string | null } {
  if (sensitive) return { targetType: "neighborhood", targetId: null };
  const supported = targetType === "business" || targetType === "area" || targetType === "neighborhood";
  return {
    targetType: supported ? targetType : "neighborhood",
    targetId: typeof targetId === "string" && targetId.trim() ? targetId.trim() : null,
  };
}

export function normalizeIncidentLocation(
  body: Record<string, unknown>,
  options: { sensitive: boolean },
): IncidentLocation | null {
  const raw = body.incidentLocation;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const location = raw as Record<string, unknown>;
    const rawCity = cleanText(location.city, 200);
    const cityInput = options.sensitive ? sensitiveCityOnlyInput(rawCity) : rawCity;
    if (!cityInput) return null;
    const { city, region } = splitCityRegion(cityInput);
    const area = options.sensitive ? null : coarseArea(location.area);
    const requestedSource = cleanText(location.source, 30) as IncidentLocationSource;
    const source = LOCATION_SOURCES.has(requestedSource) ? requestedSource : "manual_area";
    if (!city) return null;
    return {
      city,
      region,
      area,
      source,
      precision: area ? "neighborhood" : "city",
      label: labelFor(city, region, area),
    };
  }

  // Backward compatibility for Build 105 and the current website. For sensitive
  // reports, legacy leading text may be a GPS-derived street, so it is discarded.
  const targetName = cleanText(body.targetName, 255);
  if (!targetName) return null;
  const parts = targetName.split(",").map((part) => part.trim()).filter(Boolean);
  let cityInput = targetName;
  let legacyArea: string | null = null;
  if (parts.length > 1) {
    const possibleRegion = recognizedRegion(parts[parts.length - 1]);
    if (possibleRegion && parts.length >= 2) {
      cityInput = `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      legacyArea = parts.slice(0, -2).join(", ") || null;
    } else {
      cityInput = parts[parts.length - 1];
      legacyArea = parts.slice(0, -1).join(", ") || null;
    }
  }
  const { city, region } = splitCityRegion(cityInput);
  if (!city || (options.sensitive && CITY_STREET_PATTERN.test(city))) return null;
  const area = options.sensitive ? null : coarseArea(legacyArea);
  return {
    city,
    region,
    area,
    source: "legacy_text",
    precision: "unknown",
    label: labelFor(city, region, area),
  };
}

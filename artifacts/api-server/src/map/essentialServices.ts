import {
  MAP_ESSENTIAL_SERVICE_DEFAULT_RADIUS_MILES,
  MAP_ESSENTIAL_SERVICE_MAX_RADIUS_MILES,
  MAP_ESSENTIAL_SERVICE_PLACE_TYPES,
  MAP_ESSENTIAL_SERVICE_RESULT_CAP,
  findMapEssentialServiceCategory,
  type MapEssentialServiceCategory,
} from "@workspace/constants";

const PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const METERS_PER_MILE = 1609.344;
const MAX_RESPONSE_DISTANCE_METERS = (MAP_ESSENTIAL_SERVICE_MAX_RADIUS_MILES * METERS_PER_MILE) + 1;

export type EssentialServicePlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  primaryType: string | null;
  directionsUrl: string;
};

export type EssentialServicesSearchResult = {
  category: MapEssentialServiceCategory;
  radiusMiles: number;
  places: EssentialServicePlace[];
  source: "Google Maps";
  disclaimer: string;
};

export type EssentialServicesSearchInput = {
  category: string;
  latitude: number;
  longitude: number;
  radiusMiles?: number;
};

type FetchLike = typeof fetch;

export class EssentialServicesInputError extends Error {
  constructor(public readonly code: "INVALID_CATEGORY" | "INVALID_LOCATION" | "INVALID_RADIUS") {
    super(code);
  }
}

export class EssentialServicesUnavailableError extends Error {
  constructor() {
    super("ESSENTIAL_SERVICES_UNAVAILABLE");
  }
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180
    && !(latitude === 0 && longitude === 0);
}

export function normalizeEssentialServicesSearchInput(
  input: EssentialServicesSearchInput,
): Required<EssentialServicesSearchInput> & { category: MapEssentialServiceCategory } {
  const category = findMapEssentialServiceCategory(input.category)?.id;
  if (!category) throw new EssentialServicesInputError("INVALID_CATEGORY");
  if (!isValidCoordinate(input.latitude, input.longitude)) {
    throw new EssentialServicesInputError("INVALID_LOCATION");
  }

  const radiusMiles = input.radiusMiles ?? MAP_ESSENTIAL_SERVICE_DEFAULT_RADIUS_MILES;
  if (!Number.isFinite(radiusMiles) || radiusMiles < 1 || radiusMiles > MAP_ESSENTIAL_SERVICE_MAX_RADIUS_MILES) {
    throw new EssentialServicesInputError("INVALID_RADIUS");
  }

  return { category, latitude: input.latitude, longitude: input.longitude, radiusMiles };
}

function safePlace(
  item: unknown,
  origin: { latitude: number; longitude: number },
): EssentialServicePlace | null {
  if (!item || typeof item !== "object") return null;
  const place = item as {
    id?: unknown;
    displayName?: { text?: unknown };
    formattedAddress?: unknown;
    primaryType?: unknown;
    location?: { latitude?: unknown; longitude?: unknown };
  };
  if (typeof place.id !== "string" || !place.id.trim()) return null;
  if (typeof place.displayName?.text !== "string" || !place.displayName.text.trim()) return null;
  if (typeof place.formattedAddress !== "string" || !place.formattedAddress.trim()) return null;
  const latitude = Number(place.location?.latitude);
  const longitude = Number(place.location?.longitude);
  if (!isValidCoordinate(latitude, longitude)) return null;

  // Google enforces the circle restriction. Retaining this guard avoids rendering
  // an obviously invalid response should the upstream contract ever change.
  const latitudeMeters = Math.abs(latitude - origin.latitude) * 111_320;
  const longitudeMeters = Math.abs(longitude - origin.longitude) * 111_320
    * Math.cos((origin.latitude * Math.PI) / 180);
  if (Math.hypot(latitudeMeters, longitudeMeters) > MAX_RESPONSE_DISTANCE_METERS) return null;

  const params = new URLSearchParams({
    api: "1",
    query: `${latitude},${longitude}`,
    query_place_id: place.id,
  });
  return {
    id: place.id,
    name: place.displayName.text.trim(),
    address: place.formattedAddress.trim(),
    latitude,
    longitude,
    primaryType: typeof place.primaryType === "string" ? place.primaryType : null,
    directionsUrl: `https://www.google.com/maps/search/?${params.toString()}`,
  };
}

/**
 * An on-demand, non-persistent Google Places view for ordinary public services.
 * It is deliberately not a directory import: results never enter MWM's business
 * table, receive no ownership or safety labels, and are never recommendation
 * candidates until a separate governed source process establishes that record.
 */
export class GoogleEssentialServicesSearch {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async search(rawInput: EssentialServicesSearchInput): Promise<EssentialServicesSearchResult> {
    const input = normalizeEssentialServicesSearchInput(rawInput);
    if (!this.apiKey) throw new EssentialServicesUnavailableError();

    let response: Response;
    try {
      response = await this.fetchImpl(PLACES_NEARBY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType",
        },
        body: JSON.stringify({
          includedTypes: MAP_ESSENTIAL_SERVICE_PLACE_TYPES[input.category],
          maxResultCount: MAP_ESSENTIAL_SERVICE_RESULT_CAP,
          rankPreference: "DISTANCE",
          languageCode: "en",
          locationRestriction: {
            circle: {
              center: { latitude: input.latitude, longitude: input.longitude },
              radius: input.radiusMiles * METERS_PER_MILE,
            },
          },
        }),
      });
    } catch {
      throw new EssentialServicesUnavailableError();
    }

    if (!response.ok) throw new EssentialServicesUnavailableError();
    let payload: { places?: unknown[] };
    try {
      payload = await response.json() as { places?: unknown[] };
    } catch {
      throw new EssentialServicesUnavailableError();
    }

    const seen = new Set<string>();
    const places = (payload.places ?? [])
      .map((place) => safePlace(place, input))
      .filter((place): place is EssentialServicePlace => place !== null)
      .filter((place) => {
        if (seen.has(place.id)) return false;
        seen.add(place.id);
        return true;
      })
      .slice(0, MAP_ESSENTIAL_SERVICE_RESULT_CAP);

    return {
      category: input.category,
      radiusMiles: input.radiusMiles,
      places,
      source: "Google Maps",
      disclaimer: "Availability information from Google Maps. These are not Mapping With Melanin listings, ownership designations, safety ratings, or recommendations. Confirm hours, accessibility, and current eligibility directly with the provider.",
    };
  }
}

export function createGoogleEssentialServicesSearch(
  environment: NodeJS.ProcessEnv = process.env,
): GoogleEssentialServicesSearch {
  return new GoogleEssentialServicesSearch(
    environment.GOOGLE_PLACES_SERVER_KEY ?? environment.GOOGLE_MAPS_API_KEY,
  );
}

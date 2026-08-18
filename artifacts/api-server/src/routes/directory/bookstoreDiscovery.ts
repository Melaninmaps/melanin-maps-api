import {
  type BookstoreDiscoveryResponse,
  type BookstoreResult,
  type Business,
  type Coordinates,
  type DirectoryRepository,
} from "./types";

const EARTH_RADIUS_MILES = 3958.7613;
export const DEFAULT_BOOKSTORE_RADIUS_MILES = 25;

const BOOKSTORE_ALIASES = new Set([
  "bookstore",
  "book store",
  "book-shop",
  "book shop",
  "bookshop",
]);

export function normalizeDirectoryQuery(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ");
}

export function isBookstoreIntent(query: string): boolean {
  const normalized = normalizeDirectoryQuery(query);
  if (BOOKSTORE_ALIASES.has(normalized)) return true;
  return /\b(bookstore|book\s*-?\s*store|bookshop)\b/i.test(normalized);
}

export function haversineMiles(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const lat1 = radians(from.lat);
  const lat2 = radians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

function hasCoordinates(
  business: Business,
): business is Business & { latitude: number; longitude: number } {
  return (
    typeof business.latitude === "number" &&
    Number.isFinite(business.latitude) &&
    typeof business.longitude === "number" &&
    Number.isFinite(business.longitude)
  );
}

function isBookstoreBusiness(business: Business): boolean {
  const searchableFields = [
    business.name,
    business.category,
    business.subcategory ?? "",
    business.description ?? "",
    ...(business.tags ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase("en-US");

  return /\b(bookstore|book\s*-?\s*store|bookshop)\b/.test(searchableFields);
}

function toBookstoreResult(
  business: Business & { latitude: number; longitude: number },
  distanceMiles: number,
): BookstoreResult {
  return {
    ...business,
    distanceMiles: Number(distanceMiles.toFixed(1)),
    detailUrl: `/businesses/${encodeURIComponent(business.id)}/${encodeURIComponent(
      business.slug,
    )}`,
  };
}

/**
 * Stores a coarse 0.05-degree cell (roughly a few miles), never the member's
 * precise coordinates. The aggregate lets the product identify areas where a
 * community member searched but no qualifying local bookstore was available.
 */
export function toPrivacySafeLocationCell(location: Coordinates): string {
  const roundToCell = (value: number) => (Math.round(value * 20) / 20).toFixed(2);
  return `${roundToCell(location.lat)},${roundToCell(location.lng)}`;
}

function assertValidCoordinates(location: Coordinates): void {
  if (
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lng) ||
    location.lat < -90 ||
    location.lat > 90 ||
    location.lng < -180 ||
    location.lng > 180
  ) {
    throw new Error("A valid latitude and longitude are required for local discovery.");
  }
}

export async function discoverClosestBookstore(
  repository: DirectoryRepository,
  input: {
    query: string;
    location: Coordinates | null;
    radiusMiles?: number;
  },
): Promise<BookstoreDiscoveryResponse> {
  const normalizedQuery = normalizeDirectoryQuery(input.query);
  const radiusMiles = input.radiusMiles ?? DEFAULT_BOOKSTORE_RADIUS_MILES;

  if (!isBookstoreIntent(normalizedQuery)) {
    throw new Error("The bookstore discovery service only accepts bookstore-intent searches.");
  }

  // Step 1 — location required before showing any results
  if (!input.location) {
    return {
      query: input.query,
      normalizedQuery,
      intent: "bookstore",
      radiusMiles,
      locationRequired: true,
      closestBookstore: null,
      nearbyResultCount: 0,
      onlineRecommendation: null,
      message:
        "Share your location so we can find the closest community bookstore first.",
    };
  }

  assertValidCoordinates(input.location);

  // Step 2 — find all active bookstore businesses with coordinates
  const all = await repository.findActiveBookstores();
  const bookstores = all.filter(isBookstoreBusiness).filter(hasCoordinates);

  // Step 3 — calculate distances and filter to radius
  const withDistance = bookstores.map((b) => ({
    business: b as Business & { latitude: number; longitude: number },
    distanceMiles: haversineMiles(
      input.location as Coordinates,
      { lat: (b as Business & { latitude: number }).latitude, lng: (b as Business & { longitude: number }).longitude },
    ),
  }));

  const nearby = withDistance
    .filter(({ distanceMiles }) => distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  const closest = nearby[0]
    ? toBookstoreResult(nearby[0].business, nearby[0].distanceMiles)
    : null;

  const locationCell = toPrivacySafeLocationCell(input.location);

  // Step 4 — record coverage signal asynchronously (never blocks the response)
  void repository
    .recordDirectorySearchSignal({
      intent: "bookstore",
      normalizedQuery,
      outcome: closest ? "nearby_match" : "online_fallback",
      locationCell,
      nearestDistanceMiles: nearby[0]?.distanceMiles ?? null,
      nearbyResultCount: nearby.length,
      radiusMiles,
      occurredAt: new Date(),
    })
    .catch((error) => {
      console.error("Directory search signal was not recorded", error);
    });

  if (closest) {
    return {
      query: input.query,
      normalizedQuery,
      intent: "bookstore",
      radiusMiles,
      locationRequired: false,
      closestBookstore: closest,
      nearbyResultCount: nearby.length,
      onlineRecommendation: null,
      message:
        nearby.length > 1
          ? `${closest.name} is the closest verified bookstore. ${nearby.length - 1} additional option${nearby.length === 2 ? " is" : "s are"} available within ${radiusMiles} miles.`
          : `${closest.name} is the closest verified bookstore within ${radiusMiles} miles.`,
    };
  }

  const onlineBookstore = (await repository.findVerifiedOnlineBookstores())
    .filter((store) => store.isVerified)
    .sort((left, right) => left.priority - right.priority)[0];

  return {
    query: input.query,
    normalizedQuery,
    intent: "bookstore",
    radiusMiles,
    locationRequired: false,
    closestBookstore: null,
    nearbyResultCount: 0,
    onlineRecommendation: onlineBookstore
      ? {
          name: onlineBookstore.name,
          url: onlineBookstore.url,
          description: onlineBookstore.description,
          reason: `No verified community bookstore was found within ${radiusMiles} miles of your shared location.`,
        }
      : null,
    message: onlineBookstore
      ? `No verified community bookstore was found within ${radiusMiles} miles. Here is a verified online option while we continue improving local coverage.`
      : `No verified community bookstore was found within ${radiusMiles} miles. We recorded this coverage gap so the directory can improve.`,
  };
}

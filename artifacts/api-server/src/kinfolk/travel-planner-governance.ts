import {
  validateKinfolkCityScope,
  type GovernedKinfolkBusiness,
  type ValidatedKinfolkCityScope,
} from "./governedBusinessRepository";
import {
  buildRankedCatalogItinerary,
  buildValidatedItineraryReply,
} from "./itinerary-response";

export type TravelPlannerStyle = "budget" | "mid-range" | "luxury";

export type GovernedTravelPlannerRequest = Readonly<{
  destination: string;
  days: number;
  style: TravelPlannerStyle;
  interests: string[];
  cityScope: ValidatedKinfolkCityScope | null;
}>;

export type TravelPlannerActivity = Readonly<{
  time: string;
  title: string;
  description: string;
  type: "breakfast" | "lunch" | "dinner" | "attraction" | "shopping" | "experience" | "rest" | "nightlife";
  businessName: string | null;
  businessType: string | null;
  tip: string | null;
  isBlackOwned: boolean;
}>;

export type GovernedTravelPlannerResponse = Readonly<{
  destination: string;
  totalDays: number;
  overview: string;
  highlights: string[];
  days: Array<{
    day: number;
    theme: string;
    activities: TravelPlannerActivity[];
  }>;
  safetyNote: string;
  packingTips: string[];
}>;

const ALLOWED_STYLES = new Set<TravelPlannerStyle>([
  "budget",
  "mid-range",
  "luxury",
]);

function normalizeDestination(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const destination = value.trim().replace(/\s+/g, " ");
  if (
    destination.length < 2 ||
    destination.length > 120 ||
    /[\u0000-\u001f\u007f]/.test(destination)
  ) {
    return null;
  }
  return destination;
}

function normalizeInterests(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().replace(/\s+/g, " "))
        .filter((item) => item.length >= 2 && item.length <= 48)
        .filter((item) => /^[\p{L}\p{N}][\p{L}\p{N} &/'-]*$/u.test(item)),
    ),
  ].slice(0, 8);
}

/**
 * Directory lookup is deliberately restricted to an exact US-style City, ST
 * scope. Other destinations may receive only a generic, non-directory plan;
 * Kinfolk never guesses a state, broadens into nearby cities, or invents a
 * business outside the governed catalog.
 */
export function parseTravelPlannerCityScope(
  destination: string,
): ValidatedKinfolkCityScope | null {
  const match = /^(.+?),\s*([A-Za-z]{2})$/.exec(destination.trim());
  if (!match) return null;
  try {
    return validateKinfolkCityScope({
      city: match[1]!.trim(),
      stateCode: match[2]!.toUpperCase(),
    });
  } catch {
    return null;
  }
}

export function parseGovernedTravelPlannerRequest(
  input: Record<string, unknown>,
): GovernedTravelPlannerRequest | null {
  const destination = normalizeDestination(input.destination);
  if (!destination) return null;

  const rawDays = typeof input.days === "number" ? input.days : Number(input.days);
  const days = Number.isFinite(rawDays)
    ? Math.min(14, Math.max(1, Math.floor(rawDays)))
    : 3;
  const style = typeof input.style === "string" && ALLOWED_STYLES.has(input.style as TravelPlannerStyle)
    ? input.style as TravelPlannerStyle
    : "mid-range";

  return {
    destination,
    days,
    style,
    interests: normalizeInterests(input.interests),
    cityScope: parseTravelPlannerCityScope(destination),
  };
}

function activityType(category: string): TravelPlannerActivity["type"] {
  const normalized = category.toLowerCase();
  if (/food|restaurant|cafe|bakery|dining/.test(normalized)) return "dinner";
  if (/shop|retail|market/.test(normalized)) return "shopping";
  if (/night|music|bar|club/.test(normalized)) return "nightlife";
  if (/museum|history|heritage|art|culture/.test(normalized)) return "attraction";
  return "experience";
}

/**
 * Convert the existing deterministic, catalog-only Kinfolk itinerary into the
 * legacy native planner response shape. No provider prose, non-catalog venue,
 * or asserted current condition reaches this response.
 */
export function buildGovernedTravelPlannerResponse(input: {
  request: GovernedTravelPlannerRequest;
  catalog: readonly GovernedKinfolkBusiness[];
}): GovernedTravelPlannerResponse {
  const catalog = [...input.catalog];
  const requestMessage = [
    `Plan a ${input.request.days}-day ${input.request.style} trip in ${input.request.destination}.`,
    ...input.request.interests,
  ].join(" ");
  const itinerary = buildRankedCatalogItinerary({
    message: requestMessage,
    catalog,
  });
  const byName = new Map(catalog.map((business) => [business.name, business]));

  return {
    destination: input.request.destination,
    totalDays: itinerary.days.length,
    overview: buildValidatedItineraryReply(input.request.destination, itinerary),
    highlights: catalog.length > 0
      ? catalog.slice(0, 5).map((business) => business.name)
      : [
          "Use this as a flexible starting point.",
          "Confirm current local details before you go.",
        ],
    days: itinerary.days.map((day) => ({
      day: day.day,
      theme: day.theme,
      activities: day.activities.map((activity) => {
        const business = activity.canonicalVenue
          ? byName.get(activity.canonicalVenue) ?? null
          : null;
        return {
          time: activity.time,
          title: activity.title,
          description: activity.description,
          type: business ? activityType(business.category) : "experience",
          businessName: business?.name ?? null,
          businessType: business?.category ?? null,
          tip: null,
          isBlackOwned: business?.blackOwned === true,
        };
      }),
    })),
    safetyNote:
      "This plan does not provide a current safety assessment. Confirm local public guidance, transit, hours, and availability before you leave.",
    packingTips: [
      "Pack for the forecast you independently confirm before you travel.",
      "Keep room to adjust if a venue's current hours or availability change.",
    ],
  };
}

import { pool } from "@workspace/db";
import {
  createGovernedKinfolkBusinessRepository,
  type GovernedKinfolkBusiness,
  type KinfolkRadiusScope,
} from "./governedBusinessRepository";
import { isPrivatePlacesFictionalQaProvider } from "./private-places-fictional-qa";
import {
  openPrivatePlace,
  PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION,
  privatePlacesRuntimeState,
} from "./private-places-policy";
import { isPrivateOriginCareRestrictedRequest } from "./health-care-override";

type PrivatePlaceRow = Readonly<{
  id: string;
  label: string;
  encrypted_payload: string;
  encryption_key_version: string;
  geocode_provider: string;
  is_active: boolean;
  disclosure_version: string;
}>;

type PrivatePlaceQuery = Readonly<{
  query<T extends PrivatePlaceRow>(text: string, values: readonly unknown[]): Promise<Readonly<{ rows: readonly T[] }>>;
}>;

type GovernedNearbyRepository = Readonly<{
  findWithinRadius(scope: KinfolkRadiusScope, limit?: number): Promise<GovernedKinfolkBusiness[]>;
}>;

export type PrivatePlaceConversationOrigin =
  | Readonly<{ state: "not_requested" }>
  | Readonly<{ state: "consent_required" }>
  | Readonly<{ state: "securely_unavailable" }>
  | Readonly<{
      state: "matched";
      businesses: readonly GovernedKinfolkBusiness[];
      radiusMiles: number;
    }>;

export type PrivatePlaceConversationOriginDependencies = Readonly<{
  query?: PrivatePlaceQuery;
  repository?: GovernedNearbyRepository;
  environment?: NodeJS.ProcessEnv;
}>;

const PRIVATE_PLACE_BUSINESS_SUBJECT =
  /\b(?:business(?:es)?|restaurant|food|coffee|barber|salon|shop|store|hotel|market|service)\b/i;
const PRIVATE_PLACE_PROXIMITY = /\b(?:near|nearby|close\s+to|around|by)\b/i;

function canonical(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isExplicitNearbyDiscoveryRequest(message: string): boolean {
  return PRIVATE_PLACE_BUSINESS_SUBJECT.test(message) && PRIVATE_PLACE_PROXIMITY.test(message);
}

/**
 * Matches only a member-selected label in an explicit nearby-business request.
 * It never inspects an address or coordinates, and duplicate canonical labels
 * fail closed rather than guessing which saved place the member intended.
 */
export function resolveExplicitPrivatePlaceLabel(
  message: string,
  labels: readonly string[],
): string | null {
  if (!isExplicitNearbyDiscoveryRequest(message)) return null;
  const normalizedMessage = canonical(message);
  const matches = labels.filter((label) => {
    const normalizedLabel = canonical(label);
    if (!normalizedLabel) return false;
    const labelPattern = escapePattern(normalizedLabel);
    const proximityToLabel = new RegExp(
      `\\b(?:near|nearby|close\\s+to|around|by)\\s+(?:my\\s+)?${labelPattern}(?:\\b|[?.!,;:]|$)`,
      "i",
    );
    return proximityToLabel.test(normalizedMessage);
  });
  return matches.length === 1 ? matches[0]! : null;
}

function requestedRadiusMiles(message: string): number {
  const match = message.match(/\b(?:within|in)\s+(\d{1,2})\s*(?:mile|miles|mi)\b/i);
  const requested = match ? Number(match[1]) : 8;
  return Number.isFinite(requested) ? Math.max(1, Math.min(25, requested)) : 8;
}

async function ownerPrivatePlaces(
  ownerId: string,
  query: PrivatePlaceQuery | undefined,
): Promise<readonly PrivatePlaceRow[]> {
  const statement = `SELECT id, label, encrypted_payload, encryption_key_version, geocode_provider, is_active, disclosure_version
    FROM kinfolk_private_places
    WHERE user_id = $1
    ORDER BY updated_at DESC`;
  if (query) return (await query.query<PrivatePlaceRow>(statement, [ownerId])).rows;
  return (await pool.query<PrivatePlaceRow>(statement, [ownerId])).rows;
}

/**
 * Resolves a Saved Place solely inside the authenticated server boundary for a
 * same-turn, explicitly requested nearby-directory query. The function returns
 * public governed businesses only; exact address, formatted address, ciphertext,
 * coordinates, and the chosen label never leave this module.
 */
export async function resolvePrivatePlaceConversationOrigin(input: {
  ownerId: string;
  message: string;
  dependencies?: PrivatePlaceConversationOriginDependencies;
}): Promise<PrivatePlaceConversationOrigin> {
  const environment = input.dependencies?.environment ?? process.env;
  if (!privatePlacesRuntimeState(environment).enabled) return { state: "not_requested" };
  if (isPrivateOriginCareRestrictedRequest(input.message)) return { state: "not_requested" };

  let rows: readonly PrivatePlaceRow[];
  try {
    rows = await ownerPrivatePlaces(input.ownerId, input.dependencies?.query);
  } catch {
    return { state: "securely_unavailable" };
  }

  const label = resolveExplicitPrivatePlaceLabel(input.message, rows.map((row) => row.label));
  if (!label) return { state: "not_requested" };
  const matchingRows = rows.filter((row) => canonical(row.label) === canonical(label));
  if (matchingRows.length !== 1) return { state: "not_requested" };
  const place = matchingRows[0]!;
  // A paused place remains visible only long enough to refuse its use. It is
  // never decrypted, passed to discovery, or treated as a model instruction.
  if (!place.is_active) return { state: "securely_unavailable" };
  // Saved Places created under an earlier disclosure cannot become chat origins
  // until the member deliberately re-enters the place and accepts this version.
  if (place.disclosure_version !== PRIVATE_PLACES_EXPLICIT_NEARBY_DISCLOSURE_VERSION) {
    return { state: "consent_required" };
  }

  // The isolated non-geographic fixture is deliberately never allowed to
  // retrieve real directory data or simulate a real recommendation.
  if (isPrivatePlacesFictionalQaProvider(place.geocode_provider)) {
    return { state: "matched", businesses: [], radiusMiles: requestedRadiusMiles(input.message) };
  }

  try {
    const location = openPrivatePlace(
      place.encrypted_payload,
      place.encryption_key_version,
      environment,
    );
    const repository = input.dependencies?.repository ?? createGovernedKinfolkBusinessRepository(pool);
    const businesses = await repository.findWithinRadius(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMiles: requestedRadiusMiles(input.message),
      },
      12,
    );
    return { state: "matched", businesses, radiusMiles: requestedRadiusMiles(input.message) };
  } catch {
    return { state: "securely_unavailable" };
  }
}

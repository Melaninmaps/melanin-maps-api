import type { Pool } from "pg";
import {
  isValidPinCoordinates,
  resolvePreciseBusinessLocation,
  type ResolvedBusinessLocation,
} from "../businessIntake/communityPublicationPolicy";

const PIN_POLICY_VERSION = "mn-black-directory-exact-pin-v1";

export type MinnesotaSourcePinTarget = Readonly<{
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string | null;
}>;

type LocationResolver = (
  target: MinnesotaSourcePinTarget,
) => Promise<ResolvedBusinessLocation | null>;

type PinPool = Pick<Pool, "query">;

type PinLogger = (
  message: string,
  details?: Record<string, number>,
) => void;

export type MinnesotaSourcePinSummary = Readonly<{
  eligibleStreetAddresses: number;
  attempted: number;
  pinned: number;
  unresolved: number;
  errors: number;
}>;

const resolveMinnesotaSourceLocation: LocationResolver = (target) =>
  resolvePreciseBusinessLocation({
    ...target,
    category: "Source-listed business",
  });

/**
 * Removes repeated receipt targets and rejects mapless listings. This resolver is
 * intentionally restricted to rows selected by the protected Minnesota receipt
 * reconciliation; it never scans or changes unrelated inventory.
 */
export function collectMinnesotaSourcePinTargets(
  targets: readonly MinnesotaSourcePinTarget[],
): readonly MinnesotaSourcePinTarget[] {
  const retained = new Map<string, MinnesotaSourcePinTarget>();
  for (const target of targets) {
    if (
      !target.id.trim()
      || !target.name.trim()
      || !target.address?.trim()
      || !target.city.trim()
      || !target.state?.trim()
    ) continue;
    if (!retained.has(target.id)) retained.set(target.id, target);
  }
  return [...retained.values()];
}

/**
 * Adds a pin only after a geocoder validates the supplied street address. A
 * failed or ambiguous lookup leaves the listing searchable but mapless.
 */
export async function resolveMinnesotaSourcePins(
  productionPool: PinPool,
  targets: readonly MinnesotaSourcePinTarget[],
  resolveLocation: LocationResolver = resolveMinnesotaSourceLocation,
): Promise<MinnesotaSourcePinSummary> {
  const eligible = collectMinnesotaSourcePinTargets(targets);
  const summary: {
    eligibleStreetAddresses: number;
    attempted: number;
    pinned: number;
    unresolved: number;
    errors: number;
  } = {
    eligibleStreetAddresses: eligible.length,
    attempted: 0,
    pinned: 0,
    unresolved: 0,
    errors: 0,
  };

  for (const target of eligible) {
    summary.attempted += 1;
    try {
      const location = await resolveLocation(target);
      if (!location || !isValidPinCoordinates(location.lat, location.lng)) {
        summary.unresolved += 1;
        continue;
      }
      const updated = await productionPool.query<{ id: string }>(
        `UPDATE businesses
            SET latitude=$2,
                longitude=$3,
                public_location_kind='address',
                source_evidence=CASE
                  WHEN jsonb_typeof(COALESCE(source_evidence, '[]'::jsonb))='array'
                    THEN COALESCE(source_evidence, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                      'sourceType',$4::text,'field','precise_location','supports',true,
                      'verifiedByMwm',false,'excerpt',$5::text,'policyVersion',$6::text
                    ))
                  ELSE jsonb_build_array(source_evidence,jsonb_build_object(
                    'sourceType',$4::text,'field','precise_location','supports',true,
                    'verifiedByMwm',false,'excerpt',$5::text,'policyVersion',$6::text
                  ))
                END,
                updated_at=NOW()
          WHERE id=$1
            AND latitude IS NULL
            AND longitude IS NULL
            AND BTRIM(COALESCE(address, '')) = BTRIM($7)
            AND LOWER(BTRIM(COALESCE(city, ''))) = LOWER(BTRIM($8))
            AND COALESCE(UPPER(BTRIM(state)), '') = COALESCE(UPPER(BTRIM($9)), '')
            AND COALESCE(LOWER(BTRIM(country)), '') = COALESCE(LOWER(BTRIM($10)), '')
          RETURNING id`,
        [
          target.id,
          location.lat,
          location.lng,
          location.source,
          location.formattedAddress ?? target.address,
          PIN_POLICY_VERSION,
          target.address,
          target.city,
          target.state,
          target.country,
        ],
      );
      if (updated.rowCount) summary.pinned += 1;
      else summary.unresolved += 1;
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}

/** Runs after a completed receipt-reconciliation transaction; it never blocks the admin request. */
export function startMinnesotaSourcePinResolution(
  productionPool: PinPool,
  log: PinLogger,
  targets: readonly MinnesotaSourcePinTarget[],
): void {
  const eligible = collectMinnesotaSourcePinTargets(targets);
  if (eligible.length === 0) return;
  setTimeout(() => {
    resolveMinnesotaSourcePins(productionPool, eligible)
      .then((summary) => log("Minnesota source exact-pin resolution complete", summary))
      .catch(() => log("Minnesota source exact-pin resolution failed", { errors: 1 }));
  }, 1_000).unref();
}

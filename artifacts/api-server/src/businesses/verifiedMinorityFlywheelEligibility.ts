import {
  DIASPORA_OWNERSHIP_DESIGNATIONS,
  ownershipDesignationFilterId,
} from "@workspace/constants";

/**
 * Server-authoritative access rule for the economic flywheel. A listing's
 * self-reported ownership, a member's plan, a claim, or a paid placement is
 * never sufficient. The business must be active, platform-verified, and have
 * at least one MWM-controlled verified minority/diaspora designation.
 *
 * This deliberately does not gate ordinary registration, profile maintenance,
 * or general KinfolkAI assistance.
 */
export const VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR =
  "This business benefit is available after verified minority-owned status is approved.";

const VERIFIED_MINORITY_DESIGNATION_IDS = new Set(
  DIASPORA_OWNERSHIP_DESIGNATIONS.map(ownershipDesignationFilterId),
);

export type FlywheelEligibilityBusiness = Readonly<{
  status?: string | null;
  verified?: boolean | null;
  verifiedDesignations?: unknown;
  verified_designations?: unknown;
}>;

export type VerifiedMinorityFlywheelOwnerResolution =
  | { kind: "eligible"; businessId: string }
  | { kind: "not_owner" }
  | { kind: "ineligible" };

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    parameters?: unknown[],
  ): Promise<{ rows: T[] }>;
};

function normalizedDesignations(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((designation): designation is string => typeof designation === "string")
    : [];
}

export function isVerifiedMinorityFlywheelEligible(
  business: FlywheelEligibilityBusiness,
): boolean {
  if (business.status?.trim().toLocaleLowerCase("en-US") !== "active") return false;
  if (business.verified !== true) return false;
  return normalizedDesignations(
    business.verifiedDesignations ?? business.verified_designations,
  ).some((designation) => VERIFIED_MINORITY_DESIGNATION_IDS.has(ownershipDesignationFilterId(designation)));
}

/**
 * Resolves the access relationship from current server data on every request,
 * so a suspended listing, revoked owner link, or removed verification loses
 * flywheel access immediately. It intentionally selects verified_designations
 * rather than self-reported ownership_designations or black_owned.
 */
export async function resolveVerifiedMinorityFlywheelOwner(
  db: Queryable,
  input: { businessId: string; userId: string },
): Promise<VerifiedMinorityFlywheelOwnerResolution> {
  const result = await db.query<{
    id: string;
    status: string | null;
    verified: boolean | null;
    verified_designations: unknown;
  }>(
    `SELECT b.id, b.status, b.verified, b.verified_designations
       FROM businesses AS b
       INNER JOIN business_owner_links AS owner_link
         ON owner_link.business_id = b.id
        AND owner_link.user_id = $2
        AND owner_link.role = 'owner'
        AND owner_link.status = 'approved'
        AND owner_link.revoked_at IS NULL
      WHERE b.id = $1
      LIMIT 1`,
    [input.businessId, input.userId],
  );

  const business = result.rows[0];
  if (!business) return { kind: "not_owner" };
  return isVerifiedMinorityFlywheelEligible(business)
    ? { kind: "eligible", businessId: business.id }
    : { kind: "ineligible" };
}

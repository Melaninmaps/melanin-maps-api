import { DIASPORA_OWNERSHIP_DESIGNATIONS, ownershipDesignationFilterId } from "@workspace/constants";

/**
 * Server-owned promotion gate for map, directory, Discovery, and Kinfolk.
 *
 * A live profile is not a recommendation candidate merely because it is public
 * or has a legacy ownership flag. The gate is satisfied only by an active,
 * auditable eligibility decision whose ownership source and at least one
 * official member-facing presence remain current.
 * Direct named lookup deliberately does not use this predicate; it is a narrow
 * safety/context read, not a recommendation surface.
 */
export const DOCUMENTED_DISCOVERY_POLICY_VERSION =
  "documented_diaspora_discovery_v1" as const;

/** A fail-closed operational switch. There is intentionally no permissive "off" mode. */
export const DOCUMENTED_DISCOVERY_POLICY_MODE_ENV =
  "MWM_DOCUMENTED_DISCOVERY_POLICY_MODE" as const;

export type DocumentedDiscoverySurface = "discovery" | "map";

export type DocumentedDiscoveryEligibilityCandidate = Readonly<{
  eligibilityStatus?: string | null;
  eligibility_status?: string | null;
  policyVersion?: string | null;
  policy_version?: string | null;
  identityEvidenceId?: string | null;
  identity_evidence_id?: string | null;
  ownershipEvidenceId?: string | null;
  ownership_evidence_id?: string | null;
  officialWebsiteEvidenceId?: string | null;
  official_website_evidence_id?: string | null;
  officialSocialEvidenceId?: string | null;
  official_social_evidence_id?: string | null;
  mapPinEvidenceId?: string | null;
  map_pin_evidence_id?: string | null;
  ownershipSourceExpiresAt?: string | null;
  ownership_source_expires_at?: string | null;
  reviewAfter?: string | null;
  review_after?: string | null;
  ownershipDesignations?: readonly string[] | null;
  ownership_designations?: readonly string[] | null;
}>;

export function isDocumentedDiscoveryHoldEnabled(
  configuredValue: string | undefined = process.env[DOCUMENTED_DISCOVERY_POLICY_MODE_ENV],
): boolean {
  return configuredValue?.trim().toLowerCase() === "hold";
}

function columnFor(businessIdExpression: string, column: string): string {
  if (businessIdExpression.endsWith('."id"')) {
    return `${businessIdExpression.slice(0, -5)}."${column}"`;
  }
  if (businessIdExpression.endsWith(".id")) {
    return `${businessIdExpression.slice(0, -3)}.${column}`;
  }
  throw new Error("DOCUMENTED_DISCOVERY_BUSINESS_IDENTIFIER_REQUIRED");
}

/**
 * SQL predicate shared by every ordinary recommendation/browse surface. It is
 * static application policy: callers supply only a trusted column reference,
 * never an HTTP parameter or a member-controlled value.
 */
export function documentedDiscoveryEligibilitySqlPredicate(
  businessIdExpression: string,
  surface: DocumentedDiscoverySurface = "discovery",
  configuredValue: string | undefined = process.env[DOCUMENTED_DISCOVERY_POLICY_MODE_ENV],
): string {
  if (isDocumentedDiscoveryHoldEnabled(configuredValue)) return "FALSE";
  const businessId = columnFor(businessIdExpression, "id");
  const mapClause = surface === "map"
    ? `
       AND documented_eligibility.map_pin_evidence_id IS NOT NULL`
    : "";
  return `EXISTS (
    SELECT 1
      FROM public.business_discovery_eligibility AS documented_eligibility
     WHERE documented_eligibility.business_id::text = ${businessId}::text
       AND documented_eligibility.eligibility_status = 'qualified'
       AND documented_eligibility.policy_version = '${DOCUMENTED_DISCOVERY_POLICY_VERSION}'
       AND documented_eligibility.ownership_evidence_id IS NOT NULL
       AND (
         documented_eligibility.official_website_evidence_id IS NOT NULL
         OR documented_eligibility.official_social_evidence_id IS NOT NULL
       )
       AND documented_eligibility.ownership_source_expires_at > CURRENT_TIMESTAMP
       AND documented_eligibility.review_after > CURRENT_TIMESTAMP${mapClause}
  )`;
}

/** Pure test/non-SQL counterpart. Expired or incomplete receipts always fail closed. */
export function isDocumentedDiscoveryEligible(
  record: DocumentedDiscoveryEligibilityCandidate,
  surface: DocumentedDiscoverySurface = "discovery",
  now: Date = new Date(),
  configuredValue: string | undefined = process.env[DOCUMENTED_DISCOVERY_POLICY_MODE_ENV],
): boolean {
  if (isDocumentedDiscoveryHoldEnabled(configuredValue)) return false;
  const value = (camel: keyof DocumentedDiscoveryEligibilityCandidate, snake: keyof DocumentedDiscoveryEligibilityCandidate) =>
    record[camel] ?? record[snake] ?? null;
  const expiresAt = value("ownershipSourceExpiresAt", "ownership_source_expires_at");
  const reviewAfter = value("reviewAfter", "review_after");
  const dateIsFuture = (date: string | null | undefined) => {
    if (!date) return false;
    const timestamp = Date.parse(date);
    return Number.isFinite(timestamp) && timestamp > now.getTime();
  };
  const ownershipEvidence = value("ownershipEvidenceId", "ownership_evidence_id");
  const officialWebsite = value("officialWebsiteEvidenceId", "official_website_evidence_id");
  const officialSocial = value("officialSocialEvidenceId", "official_social_evidence_id");
  if (
    value("eligibilityStatus", "eligibility_status") !== "qualified"
    || value("policyVersion", "policy_version") !== DOCUMENTED_DISCOVERY_POLICY_VERSION
    || typeof ownershipEvidence !== "string" || !ownershipEvidence.trim()
    || !([officialWebsite, officialSocial].some((item) => typeof item === "string" && item.trim()))
    || !dateIsFuture(expiresAt as string | null)
    || !dateIsFuture(reviewAfter as string | null)
  ) return false;
  if (surface === "map") {
    const mapEvidence = value("mapPinEvidenceId", "map_pin_evidence_id");
    if (typeof mapEvidence !== "string" || !mapEvidence.trim()) return false;
  }
  const documentedIds = new Set(
    (record.ownershipDesignations ?? record.ownership_designations ?? [])
      .map(ownershipDesignationFilterId),
  );
  return DIASPORA_OWNERSHIP_DESIGNATIONS.some(
    (designation) => documentedIds.has(ownershipDesignationFilterId(designation)),
  );
}

export const DOCUMENTED_DISCOVERY_EVIDENCE_RULE =
  "Ordinary directory, Discovery, and Kinfolk recommendations require a current, audited ownership receipt and at least one audited official website or official social receipt. Map pins also require sourced address and geocode receipts. A source designation is documented by source, never owner verification. Missing, revoked, or stale ownership evidence removes recommendation eligibility immediately; direct named safety/context lookup remains separate.";

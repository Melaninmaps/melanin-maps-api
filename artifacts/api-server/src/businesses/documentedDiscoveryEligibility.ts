import { DIASPORA_OWNERSHIP_DESIGNATIONS, ownershipDesignationFilterId } from "@workspace/constants";
import {
  KINFOLK_DIRECTORY_ELIGIBILITY_STATES,
  PUBLIC_DIRECTORY_ELIGIBILITY_STATES,
  type DirectoryEligibilityState,
} from "./directoryEligibilityState";

/**
 * Server-owned eligibility gate for Directory, Map, Explore, and Kinfolk.
 *
 * It is deliberately stricter than a listing lifecycle: public eligibility is
 * an evidence decision, and Kinfolk eligibility additionally requires a ready
 * membership in the explicit Kinfolk Catalog cohort. A direct named lookup is
 * a narrow safety/context read and never a recommendation surface.
 */
export const DOCUMENTED_DISCOVERY_POLICY_VERSION =
  "documented_diaspora_discovery_v2" as const;

/** A fail-closed operational switch. There is intentionally no permissive "off" mode. */
export const DOCUMENTED_DISCOVERY_POLICY_MODE_ENV =
  "MWM_DOCUMENTED_DISCOVERY_POLICY_MODE" as const;

export type DocumentedDiscoverySurface = "discovery" | "map" | "kinfolk";

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
  kinfolkCatalogReady?: boolean | null;
  kinfolk_catalog_ready?: boolean | null;
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

function sqlList(values: readonly string[]): string {
  return values.map((value) => `'${value}'`).join(", ");
}

/**
 * SQL predicate shared by every ordinary browse/recommendation surface. The
 * expression is static policy, not member-provided input. Directory/Map accept
 * either public state; Kinfolk accepts only an explicitly ready catalog member.
 */
export function documentedDiscoveryEligibilitySqlPredicate(
  businessIdExpression: string,
  surface: DocumentedDiscoverySurface = "discovery",
  configuredValue: string | undefined = process.env[DOCUMENTED_DISCOVERY_POLICY_MODE_ENV],
): string {
  if (isDocumentedDiscoveryHoldEnabled(configuredValue)) return "FALSE";
  const businessId = columnFor(businessIdExpression, "id");
  const permittedStates = surface === "kinfolk"
    ? KINFOLK_DIRECTORY_ELIGIBILITY_STATES
    : PUBLIC_DIRECTORY_ELIGIBILITY_STATES;
  const mapClause = surface === "map"
    ? "\n       AND documented_eligibility.map_pin_evidence_id IS NOT NULL"
    : "";
  const kinfolkClause = surface === "kinfolk"
    ? `\n       AND EXISTS (
         SELECT 1
           FROM public.business_catalog_cohort_memberships AS kinfolk_catalog
          WHERE kinfolk_catalog.business_id::text = ${businessId}::text
            AND kinfolk_catalog.cohort_key = 'kinfolk_catalog'
            AND kinfolk_catalog.state = 'ready'
       )`
    : "";
  return `EXISTS (
    SELECT 1
      FROM public.business_discovery_eligibility AS documented_eligibility
     WHERE documented_eligibility.business_id::text = ${businessId}::text
       AND documented_eligibility.eligibility_status IN (${sqlList(permittedStates)})
       AND documented_eligibility.policy_version = '${DOCUMENTED_DISCOVERY_POLICY_VERSION}'
       AND documented_eligibility.identity_evidence_id IS NOT NULL
       AND documented_eligibility.ownership_evidence_id IS NOT NULL
       AND (
         documented_eligibility.official_website_evidence_id IS NOT NULL
         OR documented_eligibility.official_social_evidence_id IS NOT NULL
       )
       AND documented_eligibility.ownership_source_expires_at > CURRENT_TIMESTAMP
       AND documented_eligibility.review_after > CURRENT_TIMESTAMP${mapClause}${kinfolkClause}
  )`;
}

/** Pure test/non-SQL counterpart. Expired or incomplete evidence fails closed. */
export function isDocumentedDiscoveryEligible(
  record: DocumentedDiscoveryEligibilityCandidate,
  surface: DocumentedDiscoverySurface = "discovery",
  now: Date = new Date(),
  configuredValue: string | undefined = process.env[DOCUMENTED_DISCOVERY_POLICY_MODE_ENV],
): boolean {
  if (isDocumentedDiscoveryHoldEnabled(configuredValue)) return false;
  const value = (camel: keyof DocumentedDiscoveryEligibilityCandidate, snake: keyof DocumentedDiscoveryEligibilityCandidate) =>
    record[camel] ?? record[snake] ?? null;
  const dateIsFuture = (date: string | null | undefined) => {
    if (!date) return false;
    const timestamp = Date.parse(date);
    return Number.isFinite(timestamp) && timestamp > now.getTime();
  };
  const eligibilityStatus = value("eligibilityStatus", "eligibility_status") as DirectoryEligibilityState | null;
  const permittedStates = surface === "kinfolk"
    ? KINFOLK_DIRECTORY_ELIGIBILITY_STATES
    : PUBLIC_DIRECTORY_ELIGIBILITY_STATES;
  const identityEvidence = value("identityEvidenceId", "identity_evidence_id");
  const ownershipEvidence = value("ownershipEvidenceId", "ownership_evidence_id");
  const officialWebsite = value("officialWebsiteEvidenceId", "official_website_evidence_id");
  const officialSocial = value("officialSocialEvidenceId", "official_social_evidence_id");
  if (
    !permittedStates.includes(eligibilityStatus as never)
    || value("policyVersion", "policy_version") !== DOCUMENTED_DISCOVERY_POLICY_VERSION
    || typeof identityEvidence !== "string" || !identityEvidence.trim()
    || typeof ownershipEvidence !== "string" || !ownershipEvidence.trim()
    || !([officialWebsite, officialSocial].some((item) => typeof item === "string" && item.trim()))
    || !dateIsFuture(value("ownershipSourceExpiresAt", "ownership_source_expires_at") as string | null)
    || !dateIsFuture(value("reviewAfter", "review_after") as string | null)
  ) return false;
  if (surface === "map") {
    const mapEvidence = value("mapPinEvidenceId", "map_pin_evidence_id");
    if (typeof mapEvidence !== "string" || !mapEvidence.trim()) return false;
  }
  if (surface === "kinfolk" && value("kinfolkCatalogReady", "kinfolk_catalog_ready") !== true) return false;
  const documentedIds = new Set(
    (record.ownershipDesignations ?? record.ownership_designations ?? [])
      .map(ownershipDesignationFilterId),
  );
  return DIASPORA_OWNERSHIP_DESIGNATIONS.some(
    (designation) => documentedIds.has(ownershipDesignationFilterId(designation)),
  );
}

export const DOCUMENTED_DISCOVERY_EVIDENCE_RULE =
  "Directory eligibility requires a current identity receipt, a documented ownership designation, and at least one official website or official social receipt. Kinfolk eligibility additionally requires an administrator-reviewed, ready Kinfolk Catalog membership. Map pins also require sourced address and geocode receipts. A source designation is documented by source, never owner verification. Held, unresolved, duplicate, conflict, unsafe-website, closure, and unreviewed states never appear through public search, maps, Explore, or Kinfolk recommendations; direct named safety/context lookup remains separate.";

import type { SafeSource } from "./four-purpose-enforcement";
import type {
  GovernedKinfolkBusiness,
  GovernedKinfolkBusinessRepository,
  GovernedKinfolkMapPlace,
  ValidatedKinfolkCityScope,
} from "./governedBusinessRepository";
import type { VerifiedRadiusOrigin } from "./verified-radius-v1";
import {
  matchesDocumentedDietaryRequirement,
  matchesDocumentedServiceRequirement,
  type NormalizedBusinessSubject,
} from "./business-subject";
import {
  audienceAllowsBusinessText,
  rankGovernedBusinessesForMember,
  type KinfolkBusinessPersonalization,
} from "./business-personalization";
import { rankLocalBusinessResults } from "./web-ranker";
import {
  searchLocalBusinessQueriesWithState,
  type WebResult,
  type WebSearchOutcome,
  type WebSearchState,
} from "./web-search";
import type { SearchQuery } from "./lens-planner";
import { canonicalizeContextualUrl } from "./contextual-url";
import {
  buildConversationalBusinessResultView,
  uniqueActionableBusinessResults,
  type ConversationalBusinessResultView,
} from "./business-result-view";
import { logRadiusDiscoveryTrace } from "./radius-discovery-trace";
import { isMwmDiasporaPromotionEnabled } from "../businesses/mwmCoreDiscoveryPolicy";
import { mayUseSourceBackedTagEvidence } from "./directory-taxonomy-v2";

export type BusinessDiscoverySignalRepository = Readonly<{
  recordCoverageGap(input: {
    city: string;
    stateCode: string | null;
    recordType: "business";
    category: string;
    specialty: string;
    observedAt: string;
  }): Promise<void>;
  recordFlywheelSignal(input: {
    surface: "kinfolk";
    action: "search" | "zero_result";
    city: string;
    stateCode: string;
    recordType: "business";
    category: string;
    specialty: string;
  }): Promise<void>;
}>;

export type BusinessDiscoveryPlatformBusiness = Readonly<{
  id: string;
  recordType: "business";
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  city: string;
  stateCode: string | null;
  detailUrl: string;
  website: string | null;
  phone: string | null;
  verified: boolean;
  claimed: boolean;
  isOnlineOnly?: boolean;
  /** Present only when the member supplied a verified public starting point. */
  distanceMiles?: number | null;
  matchReasons: string[];
  ownershipEvidence?: {
    sourceUrl: string;
    sourceLabel: string | null;
    capturedAt: string | null;
  } | null;
  /** Never inferred: this labels the explicit discovery cohort only. */
  ownershipStatus?: "documented" | "not_documented" | "not_matched" | "not_requested";
  provenance: "mwm_public_business";
}>;

export type BusinessDiscoveryMapPlace = Readonly<{
  id: string;
  recordType: "mwm_cultural_place";
  entityKind: string;
  title: string;
  summary: string;
  city: string;
  stateCode: string | null;
  detailUrl: string;
  websiteUrl: string | null;
  sourceUrl: string | null;
  provenance: "mwm_published_place";
  isBusiness: false;
}>;

export type BusinessDiscoveryWebFinding = Readonly<{
  title: string;
  url: string;
  snippet: string;
  sourceHost: string;
  provenance: "external_web_finding";
  isMwmVerified: false;
}>;

export type DeterministicBusinessDiscoveryResponse = Readonly<{
  reply: string;
  recommendations: {
    destination: string;
    summary: string;
    businesses: Array<{
      name: string;
      id: string;
      category: string;
      description: string;
      neighborhood: string;
      mustTry: string;
      website: string | null;
      detailUrl: string;
      verified: boolean;
      claimed: boolean;
      isOnlineOnly: boolean;
      matchReasons: string[];
      ownershipEvidence: BusinessDiscoveryPlatformBusiness["ownershipEvidence"];
    }>;
    neighborhoods: [];
    events: [];
    safetyTips: [];
    localInsights: [];
  } | null;
  discovery: {
    subject: { key: string; label: string };
    location: { city: string; state: string };
    platformStatus: "completed" | "degraded";
    platformBusinesses: BusinessDiscoveryPlatformBusiness[];
    mapPlaces: BusinessDiscoveryMapPlace[];
    webSearch: {
      state: WebSearchState;
      attempted: boolean;
      provider: WebSearchOutcome["provider"];
      fallbackUsed: boolean;
      partial: boolean;
      findingCount: number;
      message: string;
    };
    webFindings: BusinessDiscoveryWebFinding[];
  };
  sources: SafeSource[];
  sourceNote: string;
  educationalStatus: "grounded" | "limited";
  /** Compact cards for Kinfolk's conversational result renderer. */
  resultView: ConversationalBusinessResultView;
}>;

type DiscoveryRepository = Pick<
  GovernedKinfolkBusinessRepository,
  "findBySubject" | "findByPreferenceTerms" | "findPublishedMapEntities"
>;

type WebSearch = (
  queries: SearchQuery[],
  imageRequested: boolean,
  location?: { city: string; stateCode: string; countryCode?: string },
) => Promise<WebSearchOutcome>;

function safeWebUrl(value: string): string | null {
  return canonicalizeContextualUrl(value);
}

function hostOf(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "external source";
  }
}

function displayText(value: string): string {
  return value
    .replace(/[\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function concise(value: string, maxLength = 180): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function straightLineMiles(
  from: Pick<VerifiedRadiusOrigin, "latitude" | "longitude">,
  to: Pick<GovernedKinfolkBusiness, "latitude" | "longitude">,
): number | null {
  if (to.latitude === null || to.longitude === null) return null;
  const radians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = radians(to.latitude - from.latitude);
  const deltaLongitude = radians(to.longitude - from.longitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return 3_958.7613 * 2 * Math.asin(Math.sqrt(haversine));
}

/**
 * Exact-radius results require both a transient geocoded public origin and
 * stored coordinates on the business. Online-only records and map entities
 * never substitute for a physical listing inside the requested distance.
 */
function withinVerifiedRadius(
  businesses: readonly GovernedKinfolkBusiness[],
  radius: VerifiedRadiusOrigin | undefined,
): GovernedKinfolkBusiness[] {
  if (!radius) return [...businesses];
  return businesses.flatMap((business) => {
    if (business.isOnlineOnly) return [];
    const distanceMiles = straightLineMiles(radius, business);
    if (distanceMiles === null || distanceMiles > radius.radiusMiles) return [];
    return [{
      ...business,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
    }];
  });
}

function requestedSubjectLabel(subject: NormalizedBusinessSubject): string {
  const qualifiers = [
    subject.dietaryRequirement?.label,
    subject.documentedServiceRequirement?.label,
  ].filter((value): value is string => Boolean(value));
  return [...qualifiers, subject.label].join(" ");
}

/**
 * "Dinner tonight" means an individual or small group needs an actionable
 * place to eat, not that an event caterer is a sensible substitute. The
 * directory does not yet carry reliable live hours for every listing, so this
 * deliberately narrows only the service type and never claims a business is
 * open; the card continues to direct the member to confirm current hours.
 */
export function eligibleForImmediateDining(
  business: Pick<GovernedKinfolkBusiness, "name" | "category" | "subcategory" | "description" | "tags" | "specialties" | "address" | "phone" | "website">,
  subject: NormalizedBusinessSubject,
): boolean {
  if (subject.foodIntent !== "dining_now") return true;
  if (!business.address && !business.phone && !business.website) return false;
  const text = [
    business.name,
    business.category,
    business.subcategory ?? "",
    business.description,
    ...(business.tags ?? []),
    ...(business.specialties ?? []),
  ].join(" ").toLowerCase();
  const cateringOnly = /\b(?:caterer|catering|private chef)\b/.test(text)
    && !/\b(?:restaurant|dine[ -]?in|counter service|take[ -]?out|food truck|cafe|coffee shop)\b/.test(text);
  return !cateringOnly;
}

function webQueries(
  subject: NormalizedBusinessSubject,
  scope: ValidatedKinfolkCityScope,
): SearchQuery[] {
  const location = `${scope.city}, ${scope.stateCode}`;
  const subjectLabel = requestedSubjectLabel(subject);
  return [
    {
      text: `community and minority-owned ${subjectLabel} ${location}`,
      role: "community_primary",
      reason:
        "MWM mission query for community-serving and minority-owned options; this is a search criterion, never an inference about the member.",
    },
    {
      text: `${subjectLabel} ${location}`,
      role: "general",
      reason:
        "Neutral local query retained for broad coverage and cross-checking.",
    },
  ];
}

function platformBusiness(
  business: GovernedKinfolkBusiness,
  ownershipStatus: BusinessDiscoveryPlatformBusiness["ownershipStatus"],
): BusinessDiscoveryPlatformBusiness {
  return {
    id: business.id,
    recordType: "business",
    name: business.name,
    category: business.category,
    subcategory: business.subcategory,
    description: business.description,
    city: business.city,
    stateCode: business.stateCode,
    detailUrl: `/businesses/${encodeURIComponent(business.id)}`,
    website: business.website ? safeWebUrl(business.website) : null,
    phone: business.phone,
    verified: business.verified,
    claimed: business.claimed,
    isOnlineOnly: business.isOnlineOnly === true,
    distanceMiles: business.distanceMiles,
    matchReasons:
      "matchReasons" in business && Array.isArray(business.matchReasons)
        ? business.matchReasons.filter(
            (reason): reason is string => typeof reason === "string",
          )
        : [],
    ownershipEvidence: business.researchSourceUrl
      ? {
          sourceUrl: business.researchSourceUrl,
          sourceLabel: business.researchSourceLabel ?? null,
          capturedAt: business.sourceCapturedAt ?? null,
        }
      : null,
    ownershipStatus,
    provenance: "mwm_public_business",
  };
}

function mapPlace(place: GovernedKinfolkMapPlace): BusinessDiscoveryMapPlace {
  return {
    id: place.id,
    recordType: "mwm_cultural_place",
    entityKind: place.entityKind,
    title: place.title,
    summary: place.summary,
    city: place.city,
    stateCode: place.stateCode,
    detailUrl: place.detailUrl,
    websiteUrl: place.websiteUrl,
    sourceUrl: place.sourceUrl,
    provenance: "mwm_published_place",
    isBusiness: false,
  };
}

function webFinding(result: WebResult): BusinessDiscoveryWebFinding | null {
  const url = safeWebUrl(result.url);
  if (!url) return null;
  return {
    title: displayText(result.title),
    url,
    snippet: concise(result.content),
    sourceHost: hostOf(url),
    provenance: "external_web_finding",
    isMwmVerified: false,
  };
}

function providerMessage(state: WebSearchState, count: number): string {
  if (state === "unavailable") {
    return "Current external details are unavailable right now. MWM listings and official links shown here are still available.";
  }
  if (state === "degraded") {
    return count > 0
      ? "Some current external details could not be confirmed, so the available links are shown separately."
      : "Current external details could not be confirmed right now. MWM listings and official links shown here are still available.";
  }
  return count > 0
    ? `Live web research completed with ${count} external finding${count === 1 ? "" : "s"}.`
    : "Live web research completed and returned no external findings.";
}

function buildReply(input: {
  scope: ValidatedKinfolkCityScope;
  subject: NormalizedBusinessSubject;
  platformStatus: "completed" | "degraded";
  businesses: BusinessDiscoveryPlatformBusiness[];
  mapPlaces: BusinessDiscoveryMapPlace[];
  web: BusinessDiscoveryWebFinding[];
  webState: WebSearchState;
}): string {
  const {
    scope,
    subject,
    platformStatus,
    businesses,
    mapPlaces,
    web,
    webState,
  } = input;
  const subjectLabel = requestedSubjectLabel(subject);
  const lines = [
    `Here’s what I found for ${subjectLabel} in ${scope.city}, ${scope.stateCode}.`,
  ];

  if (businesses.length > 0) {
    lines.push("", "**MWM public business listings**");
    for (const business of businesses.slice(0, 6)) {
      const name = displayText(business.name);
      const status = business.verified
        ? "MWM-verified public business listing"
        : "MWM public business listing";
      const detail = business.description
        ? ` — ${concise(business.description, 140)}`
        : "";
      lines.push(`• ${name} — ${status}${detail}`);
      if (business.matchReasons.length > 0)
        lines.push(`  Why it surfaced: ${business.matchReasons.join("; ")}`);
    }
  }

  if (mapPlaces.length > 0) {
    lines.push("", "**MWM cultural/place records**");
    for (const place of mapPlaces.slice(0, 6)) {
      const detail = place.summary ? ` — ${concise(place.summary, 140)}` : "";
      lines.push(
        `• ${displayText(place.title)} — MWM cultural/place record, not a business listing${detail}`,
      );
    }
  }

  if (web.length > 0) {
    lines.push(
      "",
      "**Current web findings** (external; not MWM-verified business listings)",
    );
    for (const finding of web.slice(0, 6)) {
      lines.push(`• ${finding.title} — ${finding.sourceHost}`);
    }
  }

  const total = businesses.length + mapPlaces.length + web.length;
  if (
    total === 0 &&
    platformStatus === "completed" &&
    webState === "completed"
  ) {
    lines.push(
      "",
      `I couldn’t find matching MWM records or current web results for ${subjectLabel} in ${scope.city}, ${scope.stateCode}.`,
    );
  } else if (businesses.length + mapPlaces.length === 0) {
    lines.push(
      "",
      platformStatus === "degraded"
        ? "The MWM platform search could not be completed, so I can’t rule out matching platform records."
        : "I did not find a matching MWM business or cultural/place record in this city.",
    );
  }

  if (webState !== "completed") {
    lines.push("", providerMessage(webState, web.length));
  }
  lines.push(
    "",
    "The community/minority-owned search is part of MWM’s discovery mission and does not assume your race, sex, nationality, or identity. Verify current hours and ownership details directly with each external source.",
  );
  return lines.join("\n");
}

async function recordSignals(input: {
  repository?: BusinessDiscoverySignalRepository;
  scope: ValidatedKinfolkCityScope;
  subject: NormalizedBusinessSubject;
  businessCount: number;
  platformRecordCount: number;
  webState: WebSearchState;
  webCount: number;
}): Promise<void> {
  if (!input.repository) return;
  const base = {
    surface: "kinfolk" as const,
    city: input.scope.city.toLowerCase(),
    stateCode: input.scope.stateCode.toUpperCase(),
    recordType: "business" as const,
    category: input.subject.key,
    specialty: input.subject.key,
  };
  const writes: Promise<void>[] = [
    input.repository.recordFlywheelSignal({ ...base, action: "search" }),
  ];
  if (input.businessCount === 0) {
    writes.push(
      input.repository.recordCoverageGap({
        city: base.city,
        stateCode: base.stateCode,
        recordType: "business",
        category: base.category,
        specialty: base.specialty,
        observedAt: new Date().toISOString(),
      }),
    );
  }
  if (
    input.platformRecordCount === 0 &&
    input.webState === "completed" &&
    input.webCount === 0
  ) {
    writes.push(
      input.repository.recordFlywheelSignal({ ...base, action: "zero_result" }),
    );
  }
  await Promise.allSettled(writes);
}

/**
 * Deterministic local discovery path. Platform queries finish before web research
 * begins, and every provider/database failure is represented without losing the
 * findings that did succeed.
 */
export async function discoverLocalBusinesses(input: {
  scope: ValidatedKinfolkCityScope;
  subject: NormalizedBusinessSubject;
  repository: DiscoveryRepository;
  signalRepository?: BusinessDiscoverySignalRepository;
  webSearch?: WebSearch;
  personalization?: KinfolkBusinessPersonalization;
  /** Every value is an explicit owner-provided designation requirement. */
  requiredDesignationIds?: readonly string[];
  /** Strict documented-ownership cards require a stored source receipt. */
  strictEvidenceRequired?: boolean;
  /** Enables only exact source-tag service evidence behind DIRECTORY_TAXONOMY_V2. */
  documentedSourceTaxonomy?: boolean;
  /** Member explicitly consented to leave the Diaspora Promotion Catalog. */
  allowAllPublicPlaces?: boolean;
  /** A separate explicit cohort; never treated as evidence of ownership. */
  ownershipDocumentationScope?: "not_documented";
  /** Transient geocoded public origin for a one-turn exact-radius request. */
  verifiedRadius?: VerifiedRadiusOrigin;
  /** Server-generated correlation id for count-only exact-radius diagnostics. */
  radiusTraceRequestId?: string;
}): Promise<DeterministicBusinessDiscoveryResponse> {
  let platformStatus: "completed" | "degraded" = "completed";
  let businessRows: GovernedKinfolkBusiness[] = [];
  let mapRows: GovernedKinfolkMapPlace[] = [];

  const preferenceTerms = (input.personalization?.preferenceTerms ?? []).filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  const sourceBackedTagEvidence = Boolean(input.documentedSourceTaxonomy)
    && mayUseSourceBackedTagEvidence({
      subject: input.subject,
      strictOwnershipEvidence: input.strictEvidenceRequired === true,
    });
  const candidateLimit = input.verifiedRadius
    ? 50
    : input.personalization
      ? 50
      : 12;
  const subjectBusinessRead = input.allowAllPublicPlaces
    ? input.repository.findBySubject(
        input.scope,
        input.subject,
        candidateLimit,
        input.requiredDesignationIds,
        true,
        ...(sourceBackedTagEvidence ? [true] : []),
      )
    : input.repository.findBySubject(
        input.scope,
        input.subject,
        candidateLimit,
        input.requiredDesignationIds,
        ...(sourceBackedTagEvidence ? [false, true] : []),
      );
  const businessRead =
    input.subject.key === "activity" && preferenceTerms.length > 0
      ? Promise.all([
          subjectBusinessRead,
          input.allowAllPublicPlaces
            ? input.repository.findByPreferenceTerms(
                input.scope,
                preferenceTerms,
                50,
                input.requiredDesignationIds ?? [],
                true,
              )
            : input.repository.findByPreferenceTerms(
                input.scope,
                preferenceTerms,
                50,
                ...(input.requiredDesignationIds?.length
                  ? [input.requiredDesignationIds]
                  : []),
              ),
        ]).then(([subjectMatches, preferenceMatches]) => {
          const unique = new Map<string, GovernedKinfolkBusiness>();
          for (const business of [...subjectMatches, ...preferenceMatches]) {
            if (!unique.has(business.id)) unique.set(business.id, business);
          }
          return [...unique.values()];
        })
      : subjectBusinessRead;

  // Database first: both sources are exact-city/state and subject-focused.
  const platformResults = await Promise.allSettled([
    businessRead,
    input.repository.findPublishedMapEntities(input.scope, input.subject, 8),
  ]);
  if (platformResults[0].status === "fulfilled")
    businessRows = platformResults[0].value;
  else platformStatus = "degraded";
  if (platformResults[1].status === "fulfilled")
    mapRows = platformResults[1].value;
  else platformStatus = "degraded";

  const repositoryMatchedCount = businessRows.length;
  businessRows = withinVerifiedRadius(businessRows, input.verifiedRadius);
  const afterRadiusCount = businessRows.length;
  // A mapped cultural/place entity has no business coordinate contract, so it
  // cannot be offered as an exact-radius result.
  if (input.verifiedRadius) mapRows = [];

  // An explicit ownership request is never fulfilled by a profile that merely
  // carries a matching tag. In strict mode, a card must retain its source
  // receipt; otherwise it becomes a catalog-grounded no-match rather than an
  // unproven ownership recommendation.
  if (input.strictEvidenceRequired) {
    businessRows = businessRows.filter((business) =>
      business.sourceReceipt === true || Boolean(business.researchSourceUrl),
    );
  }
  // This cohort is available only after a member explicitly chooses it from a
  // governed no-result flow. It is deliberately the inverse of documented
  // ownership evidence and therefore cannot be labeled ownership-matched.
  if (input.ownershipDocumentationScope === "not_documented") {
    businessRows = businessRows.filter((business) =>
      business.sourceReceipt !== true &&
      !business.researchSourceUrl &&
      !business.ownershipClaim &&
      (business.ownershipDesignations?.length ?? 0) === 0,
    );
  }
  const afterOwnershipEvidenceCount = businessRows.length;

  // A cuisine or another documented current-turn detail cannot be broadened by
  // a stale repository row, an external result, or a cultural-place record.
  // The database predicate is the primary guard; these checks keep every
  // emitted channel aligned with that same no-false-match contract.
  if (input.subject.documentedServiceRequirement) {
    businessRows = businessRows.filter((business) =>
      matchesDocumentedServiceRequirement(
        business,
        input.subject.documentedServiceRequirement!,
      ),
    );
    mapRows = mapRows.filter((place) =>
      matchesDocumentedServiceRequirement(
        { name: place.title, description: place.summary },
        input.subject.documentedServiceRequirement!,
      ),
    );
  }
  const afterServiceEvidenceCount = businessRows.length;

  businessRows = businessRows.filter((business) =>
    eligibleForImmediateDining(business, input.subject),
  );
  mapRows = mapRows.filter((place) =>
    eligibleForImmediateDining({
      name: place.title,
      category: place.entityKind,
      subcategory: null,
      description: place.summary,
      tags: [],
      specialties: [],
      address: null,
      phone: null,
      website: place.websiteUrl,
    }, input.subject),
  );

  // A strict Support Lens and the default Diaspora Promotion Catalog are
  // documentary-only. Kinfolk may answer general factual questions with
  // sources, but it must never promote an externally found business unless a
  // member first makes an explicit all-places expansion choice.
  let webOutcome: WebSearchOutcome;
  const promotionCatalogIsActive = isMwmDiasporaPromotionEnabled();
  if (
    input.strictEvidenceRequired ||
    input.requiredDesignationIds?.length ||
    (promotionCatalogIsActive && !input.allowAllPublicPlaces)
  ) {
    webOutcome = {
      state: "unavailable",
      attempted: false,
      provider: null,
      fallbackUsed: false,
      partial: false,
      results: [],
    };
  } else try {
    webOutcome = await (input.webSearch ?? searchLocalBusinessQueriesWithState)(
      webQueries(input.subject, input.scope),
      false,
      {
        city: input.scope.city,
        stateCode: input.scope.stateCode,
        countryCode: "US",
      },
    );
  } catch {
    webOutcome = {
      state: "degraded",
      attempted: true,
      provider: null,
      fallbackUsed: false,
      partial: false,
      results: [],
    };
  }

  const rankedWeb = (input.strictEvidenceRequired || input.requiredDesignationIds?.length || (promotionCatalogIsActive && !input.allowAllPublicPlaces)
    ? []
    : rankLocalBusinessResults(webOutcome.results))
    .filter(
      (result) =>
        !input.subject.dietaryRequirement ||
        matchesDocumentedDietaryRequirement(
          { name: result.title, description: result.content },
          input.subject.dietaryRequirement,
        ),
    )
    .filter(
      (result) =>
        !input.subject.documentedServiceRequirement ||
        matchesDocumentedServiceRequirement(
          { name: result.title, description: result.content },
          input.subject.documentedServiceRequirement,
        ),
    )
    .filter((result) =>
      audienceAllowsBusinessText({
        ageBand: input.personalization?.ageBand,
        text: `${result.title} ${result.content}`,
      }),
    )
    .filter((result) =>
      eligibleForImmediateDining({
        name: result.title,
        category: "",
        subcategory: null,
        description: result.content,
        tags: [],
        specialties: [],
        address: null,
        phone: null,
        website: result.url,
      }, input.subject),
    )
    .slice(0, 8)
    .map(webFinding)
    .filter((value): value is BusinessDiscoveryWebFinding => value !== null);
  // Keep a single actionable display cohort for cards, text, and serialized
  // recommendations. This never alters directory records; it only prevents a
  // response from naming a duplicate or actionless place that is not clickable.
  const actionableBusinesses = rankGovernedBusinessesForMember(
    businessRows,
    input.personalization,
  )
    .slice(0, 12)
    .map((business) => platformBusiness(
      business,
      input.ownershipDocumentationScope === "not_documented"
        ? "not_documented"
        : input.strictEvidenceRequired
          ? "documented"
          : input.allowAllPublicPlaces
            ? "not_matched"
          : "not_requested",
    ));
  const businesses = uniqueActionableBusinessResults(
    actionableBusinesses,
  ).slice(0, 5);
  if (input.verifiedRadius && input.radiusTraceRequestId) {
    logRadiusDiscoveryTrace({
      requestId: input.radiusTraceRequestId,
      city: input.scope.city,
      category: input.subject.key,
      ownershipRequested: Boolean(input.requiredDesignationIds?.length),
      radiusMiles: input.verifiedRadius.radiusMiles,
      originKind: "verified_public",
      repositoryMatched: repositoryMatchedCount,
      afterRadius: afterRadiusCount,
      afterOwnershipEvidence: afterOwnershipEvidenceCount,
      afterServiceEvidence: afterServiceEvidenceCount,
      actionable: actionableBusinesses.length,
      deduped: businesses.length,
      returned: businesses.length,
    });
  }
  const subjectLabel = requestedSubjectLabel(input.subject);
  const mapPlaces = (input.requiredDesignationIds?.length ? [] : mapRows)
    .filter((place) =>
      audienceAllowsBusinessText({
        ageBand: input.personalization?.ageBand,
        text: `${place.entityKind} ${place.title} ${place.summary}`,
      }),
    )
    .map(mapPlace);

  await recordSignals({
    repository: input.signalRepository,
    scope: input.scope,
    subject: input.subject,
    businessCount: businesses.length,
    platformRecordCount: businesses.length + mapPlaces.length,
    webState: webOutcome.state,
    webCount: rankedWeb.length,
  });

  const sources: SafeSource[] = [
    ...businesses.flatMap((business) => [
      {
        id: business.detailUrl,
        title: business.name,
        url: business.detailUrl,
        label: "mwM_database" as const,
      },
      ...(business.ownershipEvidence
        ? [{
            id: business.ownershipEvidence.sourceUrl,
            title: business.ownershipEvidence.sourceLabel
              ? `${business.name} — ${business.ownershipEvidence.sourceLabel}`
              : `${business.name} ownership source`,
            url: business.ownershipEvidence.sourceUrl,
            label: "mwM_database" as const,
          }]
        : []),
      ...(business.website
        ? [
            {
              id: business.website,
              title: `${business.name} website`,
              url: business.website,
              label: "mwM_database" as const,
            },
          ]
        : []),
    ]),
    ...mapPlaces.map((place) => ({
      id: place.detailUrl,
      title: place.title,
      url: place.detailUrl,
      label: "mwM_database" as const,
    })),
    ...rankedWeb.map((finding) => ({
      id: finding.url,
      title: finding.title,
      url: finding.url,
      label: "web_search" as const,
    })),
  ];

  return {
    reply: buildReply({
      scope: input.scope,
      subject: input.subject,
      platformStatus,
      businesses,
      mapPlaces,
      web: rankedWeb,
      webState: webOutcome.state,
    }),
    recommendations:
      businesses.length > 0
        ? {
            destination: `${input.scope.city}, ${input.scope.stateCode}`,
            summary: `${businesses.length} matching MWM public business listing${businesses.length === 1 ? "" : "s"} found for ${subjectLabel}.`,
            businesses: businesses.slice(0, 6).map((business) => ({
              id: business.id,
              name: business.name,
              category: business.category || input.subject.label,
              description: business.description,
              neighborhood: `${business.city}, ${business.stateCode ?? input.scope.stateCode}`,
              mustTry: "",
              website: business.website,
              detailUrl: business.detailUrl,
              verified: business.verified,
    claimed: business.claimed,
    isOnlineOnly: business.isOnlineOnly === true,
    distanceMiles: business.distanceMiles,
    matchReasons: business.matchReasons,
              ownershipEvidence: business.ownershipEvidence,
            })),
            neighborhoods: [],
            events: [],
            safetyTips: [],
            localInsights: [],
          }
        : null,
    discovery: {
      subject: { key: input.subject.key, label: input.subject.label },
      location: { city: input.scope.city, state: input.scope.stateCode },
      platformStatus,
      platformBusinesses: businesses,
      mapPlaces,
      webSearch: {
        state: webOutcome.state,
        attempted: webOutcome.attempted,
        provider: webOutcome.provider,
        fallbackUsed: webOutcome.fallbackUsed ?? false,
        partial: webOutcome.partial ?? false,
        findingCount: rankedWeb.length,
        message: providerMessage(webOutcome.state, rankedWeb.length),
      },
      webFindings: rankedWeb,
    },
    sources,
    sourceNote: providerMessage(webOutcome.state, rankedWeb.length),
    educationalStatus: sources.length > 0 ? "grounded" : "limited",
    resultView: buildConversationalBusinessResultView({
      businesses,
      external: rankedWeb,
      subjectLabel,
    }),
  };
}

export const buildBusinessDiscoveryWebQueries = webQueries;

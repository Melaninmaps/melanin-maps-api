import type { SafeSource } from "./four-purpose-enforcement";
import type {
  GovernedKinfolkBusiness,
  GovernedKinfolkBusinessRepository,
  GovernedKinfolkMapPlace,
  ValidatedKinfolkCityScope,
} from "./governedBusinessRepository";
import type { NormalizedBusinessSubject } from "./business-subject";
import { rankLocalBusinessResults } from "./web-ranker";
import {
  searchLocalBusinessQueriesWithState,
  type WebResult,
  type WebSearchOutcome,
  type WebSearchState,
} from "./web-search";
import type { SearchQuery } from "./lens-planner";

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
  website: string | null;
  phone: string | null;
  verified: boolean;
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
      category: string;
      description: string;
      neighborhood: string;
      mustTry: string;
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
      findingCount: number;
      message: string;
    };
    webFindings: BusinessDiscoveryWebFinding[];
  };
  sources: SafeSource[];
  sourceNote: string;
  educationalStatus: "grounded" | "limited";
}>;

type DiscoveryRepository = Pick<
  GovernedKinfolkBusinessRepository,
  "findBySubject" | "findPublishedMapEntities"
>;

type WebSearch = (
  queries: SearchQuery[],
  imageRequested: boolean,
  location?: { city: string; stateCode: string; countryCode?: string },
) => Promise<WebSearchOutcome>;

function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function hostOf(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "external source";
  }
}

function displayText(value: string): string {
  return value.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
}

function concise(value: string, maxLength = 180): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function webQueries(
  subject: NormalizedBusinessSubject,
  scope: ValidatedKinfolkCityScope,
): SearchQuery[] {
  const location = `${scope.city}, ${scope.stateCode}`;
  return [
    {
      text: `community and minority-owned ${subject.label} ${location}`,
      role: "community_primary",
      reason:
        "MWM mission query for community-serving and minority-owned options; this is a search criterion, never an inference about the member.",
    },
    {
      text: `${subject.label} ${location}`,
      role: "general",
      reason: "Neutral local query retained for broad coverage and cross-checking.",
    },
  ];
}

function platformBusiness(business: GovernedKinfolkBusiness): BusinessDiscoveryPlatformBusiness {
  return {
    id: business.id,
    recordType: "business",
    name: business.name,
    category: business.category,
    subcategory: business.subcategory,
    description: business.description,
    city: business.city,
    stateCode: business.stateCode,
    website: business.website,
    phone: business.phone,
    verified: business.verified,
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
    return "Live web research is unavailable because no web-search provider is configured.";
  }
  if (state === "degraded") {
    return count > 0
      ? "Live web research was degraded by a provider error; partial external findings are shown."
      : "Live web research was degraded by a timeout or provider error, so current external coverage could not be confirmed.";
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
  const { scope, subject, platformStatus, businesses, mapPlaces, web, webState } = input;
  const lines = [`Here’s what I found for ${subject.label} in ${scope.city}, ${scope.stateCode}.`];

  if (businesses.length > 0) {
    lines.push("", "**MWM public business listings**");
    for (const business of businesses.slice(0, 6)) {
      const name = displayText(business.name);
      const status = business.verified ? "MWM-verified public business listing" : "MWM public business listing";
      const detail = business.description ? ` — ${concise(business.description, 140)}` : "";
      lines.push(`• ${name} — ${status}${detail}`);
    }
  }

  if (mapPlaces.length > 0) {
    lines.push("", "**MWM cultural/place records**");
    for (const place of mapPlaces.slice(0, 6)) {
      const detail = place.summary ? ` — ${concise(place.summary, 140)}` : "";
      lines.push(`• ${displayText(place.title)} — MWM cultural/place record, not a business listing${detail}`);
    }
  }

  if (web.length > 0) {
    lines.push("", "**Current web findings** (external; not MWM-verified business listings)");
    for (const finding of web.slice(0, 6)) {
      lines.push(`• ${finding.title} — ${finding.sourceHost}`);
    }
  }

  const total = businesses.length + mapPlaces.length + web.length;
  if (total === 0 && platformStatus === "completed" && webState === "completed") {
    lines.push("", `I couldn’t find matching MWM records or current web results for ${subject.label} in ${scope.city}, ${scope.stateCode}.`);
  } else if (businesses.length + mapPlaces.length === 0) {
    lines.push("", platformStatus === "degraded"
      ? "The MWM platform search could not be completed, so I can’t rule out matching platform records."
      : "I did not find a matching MWM business or cultural/place record in this city.");
  }

  if (webState !== "completed") {
    lines.push("", providerMessage(webState, web.length));
  }
  lines.push("", "The community/minority-owned search is part of MWM’s discovery mission and does not assume your race, sex, nationality, or identity. Verify current hours and ownership details directly with each external source.");
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
    writes.push(input.repository.recordCoverageGap({
      city: base.city,
      stateCode: base.stateCode,
      recordType: "business",
      category: base.category,
      specialty: base.specialty,
      observedAt: new Date().toISOString(),
    }));
  }
  if (input.platformRecordCount === 0 && input.webState === "completed" && input.webCount === 0) {
    writes.push(input.repository.recordFlywheelSignal({ ...base, action: "zero_result" }));
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
}): Promise<DeterministicBusinessDiscoveryResponse> {
  let platformStatus: "completed" | "degraded" = "completed";
  let businessRows: GovernedKinfolkBusiness[] = [];
  let mapRows: GovernedKinfolkMapPlace[] = [];

  // Database first: both sources are exact-city/state and subject-focused.
  const platformResults = await Promise.allSettled([
    input.repository.findBySubject(input.scope, input.subject, 12),
    input.repository.findPublishedMapEntities(input.scope, input.subject, 8),
  ]);
  if (platformResults[0].status === "fulfilled") businessRows = platformResults[0].value;
  else platformStatus = "degraded";
  if (platformResults[1].status === "fulfilled") mapRows = platformResults[1].value;
  else platformStatus = "degraded";

  // Web second, always, including when governed platform matches were found.
  let webOutcome: WebSearchOutcome;
  try {
    webOutcome = await (input.webSearch ?? searchLocalBusinessQueriesWithState)(
      webQueries(input.subject, input.scope),
      false,
      { city: input.scope.city, stateCode: input.scope.stateCode, countryCode: "US" },
    );
  } catch {
    webOutcome = { state: "degraded", attempted: true, provider: null, results: [] };
  }

  const rankedWeb = rankLocalBusinessResults(webOutcome.results)
    .slice(0, 8)
    .map(webFinding)
    .filter((value): value is BusinessDiscoveryWebFinding => value !== null);
  const businesses = businessRows.map(platformBusiness);
  const mapPlaces = mapRows.map(mapPlace);

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
    ...businesses.flatMap((business) => business.website ? [{
      id: business.website,
      title: business.name,
      url: business.website,
      label: "mwM_database" as const,
    }] : []),
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
    recommendations: businesses.length > 0 ? {
      destination: `${input.scope.city}, ${input.scope.stateCode}`,
      summary: `${businesses.length} matching MWM public business listing${businesses.length === 1 ? "" : "s"} found for ${input.subject.label}.`,
      businesses: businesses.slice(0, 6).map((business) => ({
        name: business.name,
        category: business.category || input.subject.label,
        description: business.description || "Public business listing in the Mapping With Melanin directory.",
        neighborhood: `${business.city}, ${business.stateCode ?? input.scope.stateCode}`,
        mustTry: "Check the business source for current offerings, hours, and availability.",
      })),
      neighborhoods: [],
      events: [],
      safetyTips: [],
      localInsights: [],
    } : null,
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
        findingCount: rankedWeb.length,
        message: providerMessage(webOutcome.state, rankedWeb.length),
      },
      webFindings: rankedWeb,
    },
    sources,
    sourceNote: providerMessage(webOutcome.state, rankedWeb.length),
    educationalStatus: sources.length > 0 ? "grounded" : "limited",
  };
}

export const buildBusinessDiscoveryWebQueries = webQueries;

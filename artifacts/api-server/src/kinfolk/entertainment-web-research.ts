import type { SearchQuery } from "./lens-planner";
import {
  resolveEntertainmentAvailability,
  type EntertainmentAvailabilityRequest,
  type EntertainmentAvailabilityResult,
  type EntertainmentMemberPreferences,
} from "./entertainment-availability";
import {
  searchCurrentEntertainmentQueriesWithState,
  type SearchLocation,
  type WebResult,
  type WebSearchOutcome,
} from "./web-search";
import {
  verifyEntertainmentWebEvidence,
  type EntertainmentEvidenceVerification,
} from "./entertainment-web-verification";

export type EntertainmentWebSource = Readonly<{
  title: string;
  url: string;
  publisher: string;
  snippet: string;
  titleMatch: true;
}>;

export type EntertainmentWebSourceStatus = Readonly<{
  attempted: boolean;
  state: WebSearchOutcome["state"] | "not_attempted";
  provider: WebSearchOutcome["provider"];
  providerUsed: boolean;
  fallbackUsed: boolean;
  partial: boolean;
  cacheHit: boolean;
  retrievedAt: string | null;
  /** Every returned row is a cited web link, not a provider-confirmed offer. */
  evidenceBoundary: "cited_web_sources_only";
}>;

export type EntertainmentWebResearchResult = EntertainmentAvailabilityResult &
  Readonly<{
    sources: readonly EntertainmentWebSource[];
    sourceStatus: EntertainmentWebSourceStatus;
    webVerification: Pick<EntertainmentEvidenceVerification, "state"> &
      Readonly<{
        claims: readonly Readonly<{
          kind: "streaming" | "showtime";
          providerName: string;
          monetization:
            | "included_with_subscription"
            | "rental"
            | "purchase"
            | "availability_not_priced"
            | null;
          startsAtLabel: string | null;
        }>[];
      }>;
  }>;

export type EntertainmentWebSearch = (
  queries: SearchQuery[],
  location?: SearchLocation,
) => Promise<WebSearchOutcome>;

type CachedSearch = Readonly<{
  expiresAt: number;
  outcome: WebSearchOutcome;
  retrievedAt: string;
}>;

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1_000;
const MAX_CITED_SOURCES = 5;
const searchCache = new Map<string, CachedSearch>();

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function lowerText(value: string): string {
  return compact(value)
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function publisherFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return "Current web source";
  }
}

function requestedTitleMatches(result: WebResult, title: string): boolean {
  const requested = lowerText(title);
  if (!requested) return false;
  const candidate = lowerText(
    `${result.title} ${result.content} ${result.url}`,
  );
  if (requested.length >= 4) return candidate.includes(requested);

  const terms = requested.split(" ").filter((term) => term.length >= 2);
  return terms.length > 0 && terms.every((term) => candidate.includes(term));
}

function uniqueCitedSources(
  results: readonly WebResult[],
  title: string,
): EntertainmentWebSource[] {
  const seen = new Set<string>();
  const sources: EntertainmentWebSource[] = [];
  for (const result of results) {
    if (!requestedTitleMatches(result, title) || seen.has(result.url)) continue;
    seen.add(result.url);
    sources.push({
      title:
        compact(result.title).slice(0, 240) || publisherFromUrl(result.url),
      url: result.url,
      publisher: compact(
        result.publisher ?? publisherFromUrl(result.url),
      ).slice(0, 160),
      snippet: compact(result.content).slice(0, 320),
      titleMatch: true,
    });
    if (sources.length >= MAX_CITED_SOURCES) break;
  }
  return sources;
}

function cacheKey(
  request: EntertainmentAvailabilityRequest,
  preferences: EntertainmentMemberPreferences,
): string {
  return JSON.stringify({
    mode: request.mode,
    title: lowerText(request.title ?? ""),
    countryCode: request.countryCode,
    city: lowerText(request.city ?? ""),
    costPolicy: preferences.entertainmentCostPolicy,
    services: preferences.streamingServices.map(lowerText).sort(),
  });
}

function sourceStatus(
  outcome: WebSearchOutcome | null,
  retrievedAt: string | null,
  cacheHit: boolean,
): EntertainmentWebSourceStatus {
  return {
    attempted: outcome?.attempted ?? false,
    state: outcome?.state ?? "not_attempted",
    provider: outcome?.provider ?? null,
    providerUsed: outcome?.providerUsed ?? false,
    fallbackUsed: outcome?.fallbackUsed ?? false,
    partial: outcome?.partial ?? false,
    cacheHit,
    retrievedAt,
    evidenceBoundary: "cited_web_sources_only",
  };
}

/**
 * Forms one narrow request only after the availability parser has required a
 * title plus country (and city for showtimes). Saved subscriptions shape the
 * no-extra-cost search phrase; they are never evidence of an entitlement.
 */
export function buildEntertainmentWebSearchQuery(
  request: EntertainmentAvailabilityRequest,
  preferences: EntertainmentMemberPreferences,
): SearchQuery {
  const title = request.title?.replace(/["“”]/g, "").trim() ?? "";
  const includedServices =
    preferences.entertainmentCostPolicy === "included_only"
      ? preferences.streamingServices.join(" or ")
      : "";
  const text =
    request.mode === "showtimes"
      ? `${title} movie showtimes ${request.city}, ${request.countryCode}`
      : request.mode === "event"
        ? `${title} current event dates and ticket information ${request.city}, ${request.countryCode}`
        : includedServices
          ? `${title} streaming availability ${request.countryCode} included with ${includedServices} no rental or purchase`
          : `${title} current streaming availability ${request.countryCode}`;
  return {
    text: compact(text).slice(0, 500),
    role: "general",
    reason:
      "One exact, member-requested entertainment availability lookup. Returned citations are review links, not provider-confirmed availability.",
  };
}

function citedSourceMessage(input: {
  request: EntertainmentAvailabilityRequest;
  count: number;
  cacheHit: boolean;
}): string {
  const scope =
    input.request.mode === "showtimes" || input.request.mode === "event"
      ? ` for ${input.request.city}, ${input.request.countryCode}`
      : ` for ${input.request.countryCode}`;
  const cached = input.cacheHit
    ? " Recent matching sources are shown"
    : " Matching current sources are shown";
  return `${cached} for “${input.request.title}”${scope}. Open the cited links to confirm the current service, theater, schedule, price, and availability. Kinfolk does not treat web-search results as a verified offer or ticketing result.`;
}

function unavailableSourceMessage(
  request: EntertainmentAvailabilityRequest,
): string {
  const scope =
    request.mode === "showtimes"
      ? "showtime"
      : request.mode === "event"
        ? "event"
        : "streaming";
  return `Kinfolk could not obtain cited current ${scope} sources for “${request.title}” right now. It will not guess a service, theater, schedule, price, rental, purchase, or ticket link.`;
}

function verificationSummary(verification: EntertainmentEvidenceVerification) {
  return {
    state: verification.state,
    claims: verification.claims.map((claim) => ({
      kind: claim.kind,
      providerName: claim.providerName,
      monetization: claim.monetization,
      startsAtLabel: claim.startsAtLabel,
    })),
  } as const;
}

function verifiedAvailabilityMessage(
  request: EntertainmentAvailabilityRequest,
  verification: EntertainmentEvidenceVerification,
): string {
  const first = verification.claims[0];
  if (!first || !request.title) return unavailableSourceMessage(request);
  if (first.kind === "showtime") {
    return `Kinfolk could verify that “${request.title}” is listed by ${first.providerName} for ${first.startsAtLabel} in ${request.city}, ${request.countryCode}. The official cinema source is linked below. Kinfolk does not infer a ticket link or additional showtimes.`;
  }
  const detail =
    first.monetization === "included_with_subscription"
      ? "The cited official title page identifies it as included with a subscription."
      : first.monetization === "rental"
        ? "The cited official title page identifies a rental option."
        : first.monetization === "purchase"
          ? "The cited official title page identifies a purchase option."
          : "The cited official title page confirms viewing availability, but does not establish whether it is included with a subscription or requires an extra charge.";
  return `Kinfolk could verify that “${request.title}” is currently available on ${first.providerName} in ${request.countryCode}. ${detail} The official source is linked below; availability can change.`;
}

function insufficientEvidenceMessage(input: {
  request: EntertainmentAvailabilityRequest;
  verification: EntertainmentEvidenceVerification;
  hadSources: boolean;
}): string {
  if (input.verification.state === "conflicting") {
    return `Kinfolk found conflicting current claims from an official source for “${input.request.title}” in ${input.request.countryCode}. It will not choose one or state that the title is available. Review the cited source below or try again later.`;
  }
  if (input.hadSources) {
    return `Kinfolk found current source links for “${input.request.title},” but could not verify one complete availability claim for the requested title and location. It will not guess a service, price, theater, schedule, or ticket link.`;
  }
  return unavailableSourceMessage(input.request);
}

/**
 * Uses the already-approved cited web-search adapter as a small, short-lived
 * current-source lookup. This replaces neither the provider adapter nor its
 * future commercial/provider authorization requirements.
 */
export async function resolveEntertainmentAvailabilityWithWebSources(input: {
  request: EntertainmentAvailabilityRequest;
  preferences: EntertainmentMemberPreferences;
  search?: EntertainmentWebSearch;
  now?: () => number;
}): Promise<EntertainmentWebResearchResult> {
  const prerequisite = await resolveEntertainmentAvailability(
    input.request,
    input.preferences,
  );
  if (prerequisite.status !== "provider_not_configured") {
    return {
      ...prerequisite,
      sources: [],
      sourceStatus: sourceStatus(null, null, false),
      webVerification: { state: "insufficient", claims: [] },
    };
  }

  const now = input.now ?? Date.now;
  const key = cacheKey(input.request, input.preferences);
  const cached = searchCache.get(key);
  let outcome: WebSearchOutcome;
  let retrievedAt: string;
  let cacheHit = false;
  if (cached && cached.expiresAt > now()) {
    outcome = cached.outcome;
    retrievedAt = cached.retrievedAt;
    cacheHit = true;
  } else {
    try {
      outcome = await (
        input.search ?? searchCurrentEntertainmentQueriesWithState
      )([buildEntertainmentWebSearchQuery(input.request, input.preferences)], {
        ...(input.request.city ? { city: input.request.city } : {}),
        ...(input.request.countryCode
          ? { countryCode: input.request.countryCode }
          : {}),
      });
    } catch {
      outcome = {
        state: "unavailable",
        attempted: true,
        providerAttempted: true,
        providerUsed: false,
        provider: null,
        fallbackUsed: false,
        partial: false,
        failure: "provider_error",
        attempts: [],
        results: [],
      };
    }
    retrievedAt = new Date(now()).toISOString();
    searchCache.set(key, {
      outcome,
      retrievedAt,
      expiresAt: now() + SEARCH_CACHE_TTL_MS,
    });
  }

  const sources = uniqueCitedSources(
    outcome.results,
    input.request.title ?? "",
  );
  const status = sourceStatus(outcome, retrievedAt, cacheHit);
  const verification = verifyEntertainmentWebEvidence({
    request: input.request,
    results: outcome.results,
    entertainmentCostPolicy: input.preferences.entertainmentCostPolicy,
    now: now(),
  });
  if (verification.state === "verified") {
    const verifiedUrls = new Set(
      verification.claims.map((claim) => claim.source.url),
    );
    return {
      ...prerequisite,
      status: "web_availability_verified",
      sources: sources.filter((source) => verifiedUrls.has(source.url)),
      sourceStatus: status,
      webVerification: verificationSummary(verification),
      message: verifiedAvailabilityMessage(input.request, verification),
    };
  }
  if (sources.length > 0) {
    return {
      ...prerequisite,
      status: "web_results_available",
      sources,
      sourceStatus: status,
      webVerification: verificationSummary(verification),
      message: insufficientEvidenceMessage({
        request: input.request,
        verification,
        hadSources: true,
      }),
    };
  }
  return {
    ...prerequisite,
    status: "web_search_unavailable",
    sources: [],
    sourceStatus: status,
    webVerification: verificationSummary(verification),
    message: insufficientEvidenceMessage({
      request: input.request,
      verification,
      hadSources: false,
    }),
  };
}

/** Test-only cache reset; never exposed through an HTTP route. */
export function clearEntertainmentWebSearchCacheForTests(): void {
  searchCache.clear();
}

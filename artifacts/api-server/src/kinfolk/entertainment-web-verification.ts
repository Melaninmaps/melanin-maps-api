import type { EntertainmentAvailabilityRequest } from "./entertainment-availability";
import type { EntertainmentCostPolicy } from "./entertainment-personalization";
import type { WebResult } from "./web-search";

export type EntertainmentEvidenceKind = "streaming" | "showtime";
export type EntertainmentEvidenceMonetization =
  | "included_with_subscription"
  | "rental"
  | "purchase"
  | "availability_not_priced";

export type VerifiedEntertainmentWebClaim = Readonly<{
  kind: EntertainmentEvidenceKind;
  title: string;
  countryCode: string;
  providerName: string;
  monetization: EntertainmentEvidenceMonetization | null;
  source: WebResult;
  evidenceText: string;
  /** Present only for an exact showtime from an official cinema source. */
  startsAtLabel: string | null;
}>;

export type EntertainmentEvidenceVerification = Readonly<{
  state: "verified" | "insufficient" | "conflicting";
  claims: readonly VerifiedEntertainmentWebClaim[];
}>;

const OFFICIAL_STREAMING_PROVIDERS: readonly Readonly<{
  domain: string;
  name: string;
}>[] = [
  { domain: "netflix.com", name: "Netflix" },
  { domain: "hulu.com", name: "Hulu" },
  { domain: "max.com", name: "Max" },
  { domain: "hbomax.com", name: "Max" },
  { domain: "disneyplus.com", name: "Disney+" },
  { domain: "primevideo.com", name: "Prime Video" },
  { domain: "peacocktv.com", name: "Peacock" },
  { domain: "paramountplus.com", name: "Paramount+" },
  { domain: "tv.apple.com", name: "Apple TV+" },
  { domain: "tubitv.com", name: "Tubi" },
  { domain: "pluto.tv", name: "Pluto TV" },
  { domain: "therokuchannel.roku.com", name: "The Roku Channel" },
];

/**
 * These domains are official cinema operators, never ticket-marketplace or
 * aggregator sites. New operators can be added only with a source/test review.
 */
const OFFICIAL_CINEMA_DOMAINS = [
  "amctheatres.com",
  "regmovies.com",
  "cinemark.com",
  "cineplex.com",
  "drafthouse.com",
  "alamo.com",
  "landmarktheatres.com",
  "showcasecinemas.com",
  "readingcinemasus.com",
] as const;

const MAX_SOURCE_AGE_MS = 45 * 24 * 60 * 60 * 1_000;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalized(value: string): string {
  return compact(value)
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hostname(value: string): string | null {
  try {
    return new URL(value).hostname.toLocaleLowerCase("en-US");
  } catch {
    return null;
  }
}

function hostMatches(host: string | null, domain: string): boolean {
  return host === domain || Boolean(host?.endsWith(`.${domain}`));
}

function officialStreamingProvider(url: string): string | null {
  const host = hostname(url);
  return (
    OFFICIAL_STREAMING_PROVIDERS.find((provider) =>
      hostMatches(host, provider.domain),
    )?.name ?? null
  );
}

function isOfficialCinemaSource(url: string): boolean {
  const host = hostname(url);
  return OFFICIAL_CINEMA_DOMAINS.some((domain) => hostMatches(host, domain));
}

function sourceText(source: WebResult): string {
  return compact(source.citationText ?? "");
}

function titleMatchesEvidence(source: WebResult, title: string): boolean {
  const expected = normalized(title);
  const cited = normalized(sourceText(source));
  const metadata = normalized(`${source.title} ${source.url}`);
  return (
    Boolean(expected) && cited.includes(expected) && metadata.includes(expected)
  );
}

function countryMatchesEvidence(text: string, countryCode: string): boolean {
  const country = countryCode.toUpperCase();
  const normalizedText = normalized(text);
  if (country === "US") {
    return /\b(?:united states|u s|u s a|usa)\b/.test(normalizedText);
  }
  if (country === "GB") {
    return /\b(?:united kingdom|great britain|u k|uk)\b/.test(normalizedText);
  }
  if (country === "CA") return /\b(?:canada|c a|ca)\b/.test(normalizedText);
  if (country === "AU") return /\b(?:australia|a u|au)\b/.test(normalizedText);
  return new RegExp(`\\b${country.toLocaleLowerCase("en-US")}\\b`).test(
    normalizedText,
  );
}

function isFreshCurrentEvidence(
  source: WebResult,
  evidence: string,
  now: number,
): boolean {
  if (source.sourceDate) {
    const sourceTime = Date.parse(source.sourceDate);
    if (Number.isFinite(sourceTime) && now - sourceTime > MAX_SOURCE_AGE_MS) {
      return false;
    }
  }
  return /\b(?:currently|current|now|today|available\s+(?:to\s+)?(?:watch|stream)|stream(?:ing)?\s+(?:now|today|on)|watch\s+(?:now|on))\b/i.test(
    evidence,
  );
}

function classifyMonetization(
  evidence: string,
): EntertainmentEvidenceMonetization | null {
  if (
    /\b(?:included\s+(?:with|in)|with\s+(?:a|your)\s+[^.]{0,36}subscription|at\s+no\s+extra\s+cost)\b/i.test(
      evidence,
    )
  ) {
    return "included_with_subscription";
  }
  if (/\b(?:rent|rental)\b/i.test(evidence)) return "rental";
  if (/\b(?:buy|purchase)\b/i.test(evidence)) return "purchase";
  if (
    /\b(?:available\s+(?:to\s+)?(?:watch|stream)|stream(?:ing)?\s+(?:now|today|on)|watch\s+(?:now|on))\b/i.test(
      evidence,
    )
  ) {
    return "availability_not_priced";
  }
  return null;
}

function isExplicitUnavailable(evidence: string): boolean {
  return /\b(?:not\s+(?:currently\s+)?available|currently\s+unavailable|no\s+longer\s+available)\b/i.test(
    evidence,
  );
}

function requestedDate(
  request: EntertainmentAvailabilityRequest,
  now: number,
): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(request.requestedDate ?? "")) {
    return request.requestedDate!;
  }
  return new Date(now).toISOString().slice(0, 10);
}

function showtimeLabel(evidence: string, date: string): string | null {
  if (!evidence.includes(date)) return null;
  const time = evidence.match(
    /\b(?:[1-9]|1[0-2])(?::[0-5]\d)?\s?(?:a\.?m\.?|p\.?m\.?)\b/i,
  )?.[0];
  return time ? `${date} ${time.replace(/\s+/g, " ")}` : null;
}

function cityMatchesEvidence(evidence: string, city: string): boolean {
  const expected = normalized(city);
  return Boolean(expected) && normalized(evidence).includes(expected);
}

function streamingClaim(
  source: WebResult,
  request: EntertainmentAvailabilityRequest,
  now: number,
): VerifiedEntertainmentWebClaim | null {
  const providerName = officialStreamingProvider(source.url);
  const evidenceText = sourceText(source);
  if (
    !providerName ||
    !request.title ||
    !request.countryCode ||
    !titleMatchesEvidence(source, request.title) ||
    !countryMatchesEvidence(evidenceText, request.countryCode) ||
    !isFreshCurrentEvidence(source, evidenceText, now) ||
    !new RegExp(
      `\\b${normalized(providerName).replace(/ /g, "\\s+")}\\b`,
      "i",
    ).test(normalized(evidenceText))
  ) {
    return null;
  }
  const monetization = classifyMonetization(evidenceText);
  if (!monetization) return null;
  return {
    kind: "streaming",
    title: request.title,
    countryCode: request.countryCode,
    providerName,
    monetization,
    source,
    evidenceText,
    startsAtLabel: null,
  };
}

function showtimeClaim(
  source: WebResult,
  request: EntertainmentAvailabilityRequest,
  now: number,
): VerifiedEntertainmentWebClaim | null {
  const evidenceText = sourceText(source);
  const date = requestedDate(request, now);
  const startsAtLabel = showtimeLabel(evidenceText, date);
  if (
    !request.title ||
    !request.countryCode ||
    !request.city ||
    !isOfficialCinemaSource(source.url) ||
    !titleMatchesEvidence(source, request.title) ||
    !countryMatchesEvidence(evidenceText, request.countryCode) ||
    !cityMatchesEvidence(evidenceText, request.city) ||
    !isFreshCurrentEvidence(source, evidenceText, now) ||
    !startsAtLabel
  ) {
    return null;
  }
  return {
    kind: "showtime",
    title: request.title,
    countryCode: request.countryCode,
    providerName: hostname(source.url) ?? "Official cinema",
    monetization: null,
    source,
    evidenceText,
    startsAtLabel,
  };
}

/**
 * Produces a member-facing fact only when cited text and source metadata meet
 * the fixed title, geography, currency and first-party-source conditions.
 */
export function verifyEntertainmentWebEvidence(input: {
  request: EntertainmentAvailabilityRequest;
  results: readonly WebResult[];
  entertainmentCostPolicy: EntertainmentCostPolicy;
  now?: number;
}): EntertainmentEvidenceVerification {
  const now = input.now ?? Date.now();
  if (input.request.mode === "event") {
    return { state: "insufficient", claims: [] };
  }

  const candidates = input.results.flatMap((source) => {
    const claim =
      input.request.mode === "showtimes"
        ? showtimeClaim(source, input.request, now)
        : streamingClaim(source, input.request, now);
    return claim ? [claim] : [];
  });

  if (input.request.mode === "streaming") {
    const conflictingProvider = new Map<string, boolean>();
    for (const source of input.results) {
      const providerName = officialStreamingProvider(source.url);
      const text = sourceText(source);
      if (
        providerName &&
        input.request.title &&
        input.request.countryCode &&
        titleMatchesEvidence(source, input.request.title) &&
        countryMatchesEvidence(text, input.request.countryCode) &&
        isFreshCurrentEvidence(source, text, now) &&
        isExplicitUnavailable(text)
      ) {
        conflictingProvider.set(providerName, true);
      }
    }
    if (
      candidates.some((claim) => conflictingProvider.has(claim.providerName))
    ) {
      return { state: "conflicting", claims: [] };
    }
  }

  const filtered =
    input.entertainmentCostPolicy === "included_only"
      ? candidates.filter(
          (claim) => claim.monetization === "included_with_subscription",
        )
      : candidates;
  return filtered.length
    ? { state: "verified", claims: filtered }
    : { state: "insufficient", claims: [] };
}

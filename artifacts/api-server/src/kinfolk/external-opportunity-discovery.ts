import { pool } from "@workspace/db";
import {
  getInterestSettings,
  listMemberInterests,
  type InterestRecommendation,
  type SafeInterestCategory,
} from "./interest-intelligence-service";
import {
  searchAllQueriesWithState,
  type WebResult,
  type WebSearchOutcome,
} from "./web-search";
import type { SearchQuery } from "./lens-planner";

export type ExternalDiscoveryState =
  | "disabled"
  | "no_confirmed_interests"
  | "rate_limited"
  | "unavailable"
  | "completed"
  | "degraded";

export type ExternalOpportunityRecommendation = InterestRecommendation & {
  resourceType: "external_opportunity";
  resource: InterestRecommendation["resource"] & {
    sourceUrl: string;
    sourceHost: string;
    sourceProvider: string;
    verificationState: "source_confirmed";
  };
};

type ExternalOpportunityRow = {
  id: string;
  title: string;
  category: string;
  city: string;
  state: string;
  canonical_url: string;
  source_host: string;
  source_provider: string;
  starts_on: string | Date;
  verification_state: "source_confirmed";
  interest_label: string;
  recommendation_id: number;
  recommendation_status: string;
  reason: string;
};

type OpportunityWebSearch = (queries: SearchQuery[], imageRequested: boolean) => Promise<WebSearchOutcome>;

const TRUSTED_OPPORTUNITY_HOSTS = [
  "eventbrite.com",
  "ticketmaster.com",
  "meetup.com",
  "dice.fm",
  "universe.com",
  "posh.vip",
  "feverup.com",
] as const;

function cleanText(value: string, maximum: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maximum);
}

function hostFromUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.hostname.toLocaleLowerCase("en-US").replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Only an organizer/ticketing, civic, or education source can become a card. */
export function isSourceBackedOpportunityHost(value: string): boolean {
  const host = hostFromUrl(value);
  if (!host) return false;
  return TRUSTED_OPPORTUNITY_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`))
    || host.endsWith(".gov")
    || host.endsWith(".edu");
}

function parseFutureDate(value: string, now: Date): Date | null {
  const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const named = value.match(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b/i);
  const raw = iso?.[0] ?? named?.[0];
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= now.getTime()) return null;
  const maximumFuture = now.getTime() + 370 * 24 * 60 * 60 * 1000;
  return parsed.getTime() <= maximumFuture ? parsed : null;
}

/**
 * Converts only citation-backed, future-dated, approved-source results. No model
 * prose, user query, raw chat, or unlabeled page is retained as an opportunity.
 */
export function sourceBackedOpportunityFromCitation(input: {
  result: WebResult;
  interestLabel: string;
  category: SafeInterestCategory;
  city: string;
  state: string;
  now?: Date;
}): {
  title: string;
  sourceUrl: string;
  sourceHost: string;
  startsOn: Date;
  expiresAt: Date;
  sourcePublishedAt: Date | null;
  interestLabel: string;
  category: SafeInterestCategory;
  city: string;
  state: string;
} | null {
  const now = input.now ?? new Date();
  if (!isSourceBackedOpportunityHost(input.result.url)) return null;
  const sourceHost = hostFromUrl(input.result.url);
  const support = cleanText(`${input.result.title} ${input.result.content}`, 2_000);
  if (!/\b(?:event|festival|workshop|class|tour|experience|exhibit|show|concert|market|gathering|meetup)\b/i.test(support)) return null;
  const startsOn = parseFutureDate(support, now);
  if (!startsOn || !sourceHost) return null;
  const sourcePublishedCandidate = typeof input.result.sourceDate === "string" ? new Date(input.result.sourceDate) : null;
  const sourcePublishedAt = sourcePublishedCandidate && !Number.isNaN(sourcePublishedCandidate.getTime())
    ? sourcePublishedCandidate
    : null;
  const eventExpiry = startsOn.getTime() + 48 * 60 * 60 * 1000;
  const freshnessExpiry = now.getTime() + 21 * 24 * 60 * 60 * 1000;
  return {
    title: cleanText(input.result.title, 255),
    sourceUrl: input.result.url,
    sourceHost,
    startsOn,
    expiresAt: new Date(Math.min(eventExpiry, freshnessExpiry)),
    sourcePublishedAt,
    interestLabel: input.interestLabel,
    category: input.category,
    city: input.city,
    state: input.state,
  };
}

function discoveryQueries(input: { label: string; city: string; state: string }): SearchQuery[] {
  return [{
    text: `upcoming ${input.label} events and experiences in ${input.city}, ${input.state} official organizer tickets date`,
    role: "general",
    reason: "Member-requested, source-backed opportunity discovery for a confirmed broad interest.",
  }];
}

function intervalMilliseconds(frequency: "manual" | "daily" | "weekly"): number {
  if (frequency === "daily") return 24 * 60 * 60 * 1000;
  if (frequency === "weekly") return 7 * 24 * 60 * 60 * 1000;
  return 0;
}

async function checkFrequency(input: { userId: string; city: string; state: string; frequency: "manual" | "daily" | "weekly" }): Promise<boolean> {
  const minimum = intervalMilliseconds(input.frequency);
  if (!minimum) return true;
  const previous = await pool.query<{ requested_at: Date }>(
    `SELECT requested_at
       FROM kinfolk_external_opportunity_discovery_runs
      WHERE user_id = $1 AND city = $2 AND state = $3
      ORDER BY requested_at DESC
      LIMIT 1`,
    [input.userId, input.city, input.state],
  );
  const prior = previous.rows[0]?.requested_at;
  return !prior || Date.now() - new Date(prior).getTime() >= minimum;
}

async function writeRun(input: { userId: string; city: string; state: string; stateValue: ExternalDiscoveryState; provider: string | null; resultCount: number }): Promise<void> {
  await pool.query(
    `INSERT INTO kinfolk_external_opportunity_discovery_runs
       (user_id, city, state, requested_at, provider_state, provider, result_count)
     VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
    [input.userId, input.city, input.state, input.stateValue, input.provider, input.resultCount],
  );
}

async function persistOpportunity(input: {
  userId: string;
  opportunity: NonNullable<ReturnType<typeof sourceBackedOpportunityFromCitation>>;
  provider: string;
}): Promise<ExternalOpportunityRecommendation | null> {
  const stored = await pool.query<{ id: string }>(
    `INSERT INTO kinfolk_external_opportunities (
       user_id, interest_label, category, title, city, state, canonical_url, source_host,
       source_provider, source_published_at, starts_on, verification_state, expires_at, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'source_confirmed', $12, NOW(), NOW())
     ON CONFLICT (user_id, canonical_url) DO UPDATE SET
       interest_label = EXCLUDED.interest_label, category = EXCLUDED.category, title = EXCLUDED.title,
       city = EXCLUDED.city, state = EXCLUDED.state, source_host = EXCLUDED.source_host,
       source_provider = EXCLUDED.source_provider, source_published_at = EXCLUDED.source_published_at,
       starts_on = EXCLUDED.starts_on, verification_state = 'source_confirmed', expires_at = EXCLUDED.expires_at,
       updated_at = NOW()
     RETURNING id`,
    [
      input.userId, input.opportunity.interestLabel, input.opportunity.category, input.opportunity.title,
      input.opportunity.city, input.opportunity.state, input.opportunity.sourceUrl, input.opportunity.sourceHost,
      input.provider, input.opportunity.sourcePublishedAt, input.opportunity.startsOn, input.opportunity.expiresAt,
    ],
  );
  const opportunityId = stored.rows[0]?.id;
  if (!opportunityId) return null;
  const reason = `A source-backed upcoming opportunity matches your confirmed ${input.opportunity.interestLabel} interest. It is not an MWM-verified listing; review the original source for current details.`;
  const recommendation = await pool.query<{ id: number; status: string }>(
    `INSERT INTO kinfolk_interest_recommendations (
       user_id, resource_type, resource_id, resource_category, interest_label, source, reason,
       rank, status, expires_at, created_at, updated_at
     ) VALUES ($1, 'external_opportunity', $2, $3, $4, 'interest', $5, 0, 'shown', $6, NOW(), NOW())
     ON CONFLICT (user_id, resource_type, resource_id) DO UPDATE SET
       resource_category = EXCLUDED.resource_category, interest_label = EXCLUDED.interest_label,
       reason = EXCLUDED.reason, expires_at = EXCLUDED.expires_at, updated_at = NOW()
     RETURNING id, status`,
    [input.userId, opportunityId, input.opportunity.category, input.opportunity.interestLabel, reason, input.opportunity.expiresAt],
  );
  if (!recommendation.rows[0] || recommendation.rows[0].status === "dismissed") return null;
  return {
    id: recommendation.rows[0].id,
    resourceType: "external_opportunity",
    resource: {
      id: opportunityId,
      title: input.opportunity.title,
      category: input.opportunity.category,
      city: input.opportunity.city,
      state: input.opportunity.state,
      imageUrl: null,
      detailPath: input.opportunity.sourceUrl,
      startsOn: input.opportunity.startsOn.toISOString(),
      sourceUrl: input.opportunity.sourceUrl,
      sourceHost: input.opportunity.sourceHost,
      sourceProvider: input.provider,
      verificationState: "source_confirmed",
    },
    interestLabel: input.opportunity.interestLabel,
    reason,
    source: "interest",
    actions: ["share", "not_interested", "circle"],
  };
}

export async function discoverExternalOpportunitiesForMember(input: {
  userId: string;
  city: string;
  state: string;
  webSearch?: OpportunityWebSearch;
}): Promise<{ state: ExternalDiscoveryState; retryAfterSeconds?: number; recommendations: ExternalOpportunityRecommendation[] }> {
  const city = cleanText(input.city, 100);
  const state = cleanText(input.state, 2).toUpperCase();
  const settings = await getInterestSettings(input.userId);
  if (!settings.externalOpportunityDiscoveryEnabled) return { state: "disabled", recommendations: [] };
  if (!city || !/^[A-Z]{2}$/.test(state)) return { state: "unavailable", recommendations: [] };
  if (!await checkFrequency({ userId: input.userId, city, state, frequency: settings.externalOpportunityDiscoveryFrequency })) {
    return { state: "rate_limited", retryAfterSeconds: settings.externalOpportunityDiscoveryFrequency === "weekly" ? 604_800 : 86_400, recommendations: [] };
  }
  const interests = (await listMemberInterests(input.userId))
    .filter((interest) => interest.state === "confirmed" && !interest.isTemporary)
    .slice(0, 3);
  if (!interests.length) {
    await writeRun({ userId: input.userId, city, state, stateValue: "no_confirmed_interests", provider: null, resultCount: 0 });
    return { state: "no_confirmed_interests", recommendations: [] };
  }

  const outcome = await (input.webSearch ?? searchAllQueriesWithState)(
    interests.flatMap((interest) => discoveryQueries({ label: interest.label, city, state })),
    false,
  );
  const resultState: ExternalDiscoveryState = outcome.state === "completed"
    ? "completed"
    : outcome.state === "degraded" ? "degraded" : "unavailable";
  const results = outcome.results.slice(0, 15);
  const created: ExternalOpportunityRecommendation[] = [];
  for (const result of results) {
    const interest = interests.find((candidate) => result.sourceQuery.text.includes(candidate.label));
    if (!interest) continue;
    const opportunity = sourceBackedOpportunityFromCitation({
      result,
      interestLabel: interest.label,
      category: interest.category,
      city,
      state,
    });
    if (!opportunity) continue;
    const recommendation = await persistOpportunity({ userId: input.userId, opportunity, provider: outcome.provider ?? "unavailable" });
    if (recommendation && !created.some((item) => item.resource.id === recommendation.resource.id)) created.push(recommendation);
  }
  await writeRun({ userId: input.userId, city, state, stateValue: resultState, provider: outcome.provider, resultCount: created.length });
  return { state: resultState, recommendations: created.slice(0, 6) };
}

export async function listExternalOpportunityRecommendations(userId: string): Promise<ExternalOpportunityRecommendation[]> {
  const result = await pool.query<ExternalOpportunityRow>(
    `SELECT o.id, o.title, o.category, o.city, o.state, o.canonical_url, o.source_host,
            o.source_provider, o.starts_on, o.verification_state, o.interest_label,
            r.id AS recommendation_id, r.status AS recommendation_status, r.reason
       FROM kinfolk_external_opportunities o
       JOIN kinfolk_interest_recommendations r
         ON r.user_id = o.user_id AND r.resource_type = 'external_opportunity' AND r.resource_id = o.id
      WHERE o.user_id = $1 AND o.verification_state = 'source_confirmed'
        AND o.starts_on > NOW() AND o.expires_at > NOW() AND r.status <> 'dismissed'
      ORDER BY o.starts_on ASC
      LIMIT 6`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.recommendation_id,
    resourceType: "external_opportunity" as const,
    resource: {
      id: row.id,
      title: row.title,
      category: row.category,
      city: row.city,
      state: row.state,
      imageUrl: null,
      detailPath: row.canonical_url,
      startsOn: new Date(row.starts_on).toISOString(),
      sourceUrl: row.canonical_url,
      sourceHost: row.source_host,
      sourceProvider: row.source_provider,
      verificationState: row.verification_state,
    },
    interestLabel: row.interest_label,
    reason: row.reason,
    source: "interest" as const,
    actions: ["share", "not_interested", "circle"],
  }));
}

import { pool } from "@workspace/db";
import { documentedDiscoveryEligibilitySqlPredicate } from "../businesses/documentedDiscoveryEligibility";
import { getMemberAgeBand, type AgeBand } from "../lib/audience-policy";
import { isUpcomingOneOffEventDate } from "../lib/public-event-visibility";
import {
  businessMeetsInterestDiscoveryConstraints,
  DEFAULT_INTEREST_DISCOVERY_CONSTRAINTS,
  eventMeetsInterestDiscoveryConstraints,
  getInterestDiscoveryConstraints,
  type InterestDiscoveryConstraints,
} from "./interest-recommendation-constraints";

/**
 * Kinfolk Interest Intelligence is deliberately separate from private memory.
 * It stores only an explicit or safely-derived label, never source text, a chat
 * transcript, exact search text, or sensitive/third-party context.
 */
export const SAFE_INTEREST_CATEGORIES = [
  "food_and_drink",
  "arts_and_culture",
  "books_and_learning",
  "music_and_audio",
  "fitness_and_outdoors",
  "games_and_hobbies",
  "social_and_community",
  "travel_and_places",
  "beauty_and_style",
  "career_and_learning",
] as const;

export type SafeInterestCategory = (typeof SAFE_INTEREST_CATEGORIES)[number];
export type InterestState = "tentative" | "confirmed" | "paused" | "dismissed";
export type InterestSource = "explicit" | "conversation_pattern" | "discovery_pattern";
export type RecommendationFeedback = "interested" | "not_interested" | "hide" | "more_like_this" | "wrong_assumption" | "hide_category" | "stop_recommending_topic";

export type InterestSettings = {
  interestRecognitionEnabled: boolean;
  proactiveDiscoveryEnabled: boolean;
  interestNotificationsEnabled: boolean;
  externalOpportunityDiscoveryEnabled: boolean;
  externalOpportunityDiscoveryFrequency: "manual" | "daily" | "weekly";
};

export type MemberInterest = {
  id: number;
  label: string;
  category: SafeInterestCategory;
  source: InterestSource;
  state: InterestState;
  observationCount: number;
  confidence: number;
  isTemporary: boolean;
  expiresAt: string | null;
  confirmedAt: string | null;
  pausedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InterestRecommendation = {
  id: number;
  resourceType: "business" | "event" | "external_opportunity";
  resource: {
    id: string;
    title: string;
    category: string | null;
    city: string | null;
    state: string | null;
    imageUrl: string | null;
    detailPath: string;
    startsOn?: string;
    sourceUrl?: string;
    sourceHost?: string;
    sourceProvider?: string;
    verificationState?: "source_confirmed";
  };
  interestLabel: string;
  reason: string;
  source: "interest" | "circle";
  actions: Array<"save" | "share" | "not_interested" | "circle" | "more_like_this" | "wrong_assumption" | "hide_category" | "stop_recommending_topic">;
};

const DEFAULT_SETTINGS: InterestSettings = {
  interestRecognitionEnabled: false,
  proactiveDiscoveryEnabled: false,
  interestNotificationsEnabled: false,
  externalOpportunityDiscoveryEnabled: false,
  externalOpportunityDiscoveryFrequency: "manual",
};

const SENSITIVE_OR_THIRD_PARTY_CONTEXT = /\b(?:baby|pregnan(?:t|cy)|parent(?:ing)?|child(?:ren)?|kid(?:s)?|son|daughter|caregiv(?:er|ing)|disab(?:led|ility)|diagnos(?:is|ed)|medical|health|wellness|therap(?:y|ist)|medication|allerg(?:y|ies)|mental\s+health|religion|politic(?:s|al)|race|ethnic|sexual(?:ity)?|gender|trans|immigra|citizen(?:ship)?|credit|debt|income|for\s+(?:my|a|someone|somebody|their|the)\s+(?:friend|family|partner|client|child|baby|parent|coworker|student)|on\s+behalf\s+of)\b/i;

const INTEREST_RULES: Array<{ category: SafeInterestCategory; label: string; pattern: RegExp }> = [
  { category: "arts_and_culture", label: "art and galleries", pattern: /\b(?:art|gallery|galleries|museum|mural|exhibit(?:ion)?)\b/i },
  { category: "books_and_learning", label: "books and reading", pattern: /\b(?:book(?:s)?|reading|bookstore|library|author)\b/i },
  { category: "music_and_audio", label: "live music", pattern: /\b(?:music|jazz|concert|live\s+show|vinyl|dj)\b/i },
  { category: "games_and_hobbies", label: "gaming and hobbies", pattern: /\b(?:gaming|video\s+games?|board\s+games?|anime|manga|comics?|craft(?:ing)?)\b/i },
  { category: "fitness_and_outdoors", label: "outdoors and movement", pattern: /\b(?:hiking|run(?:ning)?|cycling|bike|outdoors?|park|fitness|yoga)\b/i },
  { category: "food_and_drink", label: "food and dining", pattern: /\b(?:restaurant|food|dining|brunch|coffee|cafe|bakery|chef)\b/i },
  { category: "beauty_and_style", label: "beauty and style", pattern: /\b(?:hair|barber|salon|beauty|nails?|spa|fashion|style)\b/i },
  { category: "social_and_community", label: "community gatherings", pattern: /\b(?:community|meetup|gathering|networking|volunteer)\b/i },
  { category: "travel_and_places", label: "travel and places", pattern: /\b(?:travel|trip|visit|explore|weekend\s+away)\b/i },
  { category: "career_and_learning", label: "career and learning", pattern: /\b(?:career|workshop|class|course|professional\s+development|coworking)\b/i },
];

const TEMPORARY_SIGNAL_CONTEXT = /\b(?:tonight|tomorrow|this\s+week(?:end)?|next\s+week(?:end)?|this\s+month|for\s+an\s+event)\b/i;

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function safeText(value: unknown, maximum = 100): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9&+\-\s]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maximum);
  return normalized.length >= 2 ? normalized : null;
}

function rowToInterest(row: Record<string, unknown>): MemberInterest {
  return {
    id: Number(row.id),
    label: String(row.label),
    category: row.category as SafeInterestCategory,
    source: row.source as InterestSource,
    state: row.state as InterestState,
    observationCount: Number(row.observation_count ?? 1),
    confidence: Number(row.confidence ?? 0),
    isTemporary: asBoolean(row.is_temporary),
    expiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
    confirmedAt: row.confirmed_at ? new Date(String(row.confirmed_at)).toISOString() : null,
    pausedAt: row.paused_at ? new Date(String(row.paused_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function normalizeInterestLabel(value: unknown): string | null {
  const label = safeText(value);
  if (!label || SENSITIVE_OR_THIRD_PARTY_CONTEXT.test(label)) return null;
  return label;
}

export function isSafeInterestCategory(value: unknown): value is SafeInterestCategory {
  return typeof value === "string" && (SAFE_INTEREST_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Deterministic allow-list only. This helper must never return a label from a
 * family, health, protected-class, financial, or third-party request.
 */
export function deriveNonSensitiveInterestSignals(message: unknown): Array<{
  label: string;
  category: SafeInterestCategory;
  temporary: boolean;
}> {
  if (typeof message !== "string" || message.length > 2_000 || SENSITIVE_OR_THIRD_PARTY_CONTEXT.test(message)) return [];
  const temporary = TEMPORARY_SIGNAL_CONTEXT.test(message);
  return INTEREST_RULES
    .filter((rule) => rule.pattern.test(message))
    .slice(0, 2)
    .map(({ label, category }) => ({ label, category, temporary }));
}

export async function getInterestSettings(userId: string): Promise<InterestSettings> {
  const result = await pool.query<{
    interest_recognition_enabled: boolean | null;
    proactive_discovery_enabled: boolean | null;
    interest_notifications_enabled: boolean | null;
    external_opportunity_discovery_enabled: boolean | null;
    external_opportunity_discovery_frequency: string | null;
  }>(
    `SELECT interest_recognition_enabled, proactive_discovery_enabled, interest_notifications_enabled,
            external_opportunity_discovery_enabled, external_opportunity_discovery_frequency
       FROM user_preferences
      WHERE user_id = $1
      LIMIT 1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    interestRecognitionEnabled: row.interest_recognition_enabled === true,
    proactiveDiscoveryEnabled: row.proactive_discovery_enabled === true,
    interestNotificationsEnabled: row.interest_notifications_enabled === true,
    externalOpportunityDiscoveryEnabled: row.external_opportunity_discovery_enabled === true,
    externalOpportunityDiscoveryFrequency: row.external_opportunity_discovery_frequency === "daily" || row.external_opportunity_discovery_frequency === "weekly"
      ? row.external_opportunity_discovery_frequency
      : "manual",
  };
}

export async function updateInterestSettings(
  userId: string,
  patch: Partial<InterestSettings>,
): Promise<InterestSettings> {
  const current = await getInterestSettings(userId);
  const next: InterestSettings = {
    interestRecognitionEnabled:
      typeof patch.interestRecognitionEnabled === "boolean"
        ? patch.interestRecognitionEnabled
        : current.interestRecognitionEnabled,
    proactiveDiscoveryEnabled:
      typeof patch.proactiveDiscoveryEnabled === "boolean"
        ? patch.proactiveDiscoveryEnabled
        : current.proactiveDiscoveryEnabled,
    interestNotificationsEnabled:
      typeof patch.interestNotificationsEnabled === "boolean"
        ? patch.interestNotificationsEnabled
        : current.interestNotificationsEnabled,
    externalOpportunityDiscoveryEnabled:
      typeof patch.externalOpportunityDiscoveryEnabled === "boolean"
        ? patch.externalOpportunityDiscoveryEnabled
        : current.externalOpportunityDiscoveryEnabled,
    externalOpportunityDiscoveryFrequency:
      patch.externalOpportunityDiscoveryFrequency === "daily" || patch.externalOpportunityDiscoveryFrequency === "weekly" || patch.externalOpportunityDiscoveryFrequency === "manual"
        ? patch.externalOpportunityDiscoveryFrequency
        : current.externalOpportunityDiscoveryFrequency,
  };
  await pool.query(
    `INSERT INTO user_preferences (
       user_id, interest_recognition_enabled, proactive_discovery_enabled,
       interest_notifications_enabled, external_opportunity_discovery_enabled,
       external_opportunity_discovery_frequency, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       interest_recognition_enabled = EXCLUDED.interest_recognition_enabled,
       proactive_discovery_enabled = EXCLUDED.proactive_discovery_enabled,
       interest_notifications_enabled = EXCLUDED.interest_notifications_enabled,
       external_opportunity_discovery_enabled = EXCLUDED.external_opportunity_discovery_enabled,
       external_opportunity_discovery_frequency = EXCLUDED.external_opportunity_discovery_frequency,
       updated_at = NOW()`,
    [
      userId,
      next.interestRecognitionEnabled,
      next.proactiveDiscoveryEnabled,
      next.interestNotificationsEnabled,
      next.externalOpportunityDiscoveryEnabled,
      next.externalOpportunityDiscoveryFrequency,
    ],
  );
  return next;
}

export async function listMemberInterests(userId: string): Promise<MemberInterest[]> {
  const result = await pool.query<Record<string, unknown>>(
    `SELECT id, label, category, source, state, observation_count, confidence,
            is_temporary, expires_at, confirmed_at, paused_at, created_at, updated_at
       FROM kinfolk_member_interests
      WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY CASE state WHEN 'confirmed' THEN 0 WHEN 'tentative' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END,
               updated_at DESC`,
    [userId],
  );
  return result.rows.map(rowToInterest);
}

export async function createExplicitInterest(input: {
  userId: string;
  label: unknown;
  category: unknown;
}): Promise<MemberInterest> {
  const label = normalizeInterestLabel(input.label);
  if (!label || !isSafeInterestCategory(input.category)) {
    throw new Error("INVALID_NON_SENSITIVE_INTEREST");
  }
  const result = await pool.query<Record<string, unknown>>(
    `INSERT INTO kinfolk_member_interests (
       user_id, label, category, source, state, observation_count, confidence,
       is_temporary, expires_at, confirmed_at, paused_at, created_at, updated_at
     ) VALUES ($1, $2, $3, 'explicit', 'confirmed', 1, 100, false, NULL, NOW(), NULL, NOW(), NOW())
     ON CONFLICT (user_id, label) DO UPDATE SET
       category = EXCLUDED.category,
       source = 'explicit',
       state = 'confirmed',
       observation_count = GREATEST(kinfolk_member_interests.observation_count, 1),
       confidence = 100,
       is_temporary = false,
       expires_at = NULL,
       confirmed_at = NOW(),
       paused_at = NULL,
       updated_at = NOW()
     RETURNING id, label, category, source, state, observation_count, confidence,
       is_temporary, expires_at, confirmed_at, paused_at, created_at, updated_at`,
    [input.userId, label, input.category],
  );
  return rowToInterest(result.rows[0]);
}

export async function updateInterestState(input: {
  userId: string;
  interestId: number;
  state: InterestState;
}): Promise<MemberInterest | null> {
  const result = await pool.query<Record<string, unknown>>(
    `UPDATE kinfolk_member_interests
        SET state = $3,
            confirmed_at = CASE WHEN $3 = 'confirmed' THEN NOW() ELSE confirmed_at END,
            paused_at = CASE WHEN $3 = 'paused' THEN NOW() ELSE NULL END,
            is_temporary = CASE WHEN $3 = 'confirmed' THEN false ELSE is_temporary END,
            expires_at = CASE WHEN $3 = 'confirmed' THEN NULL ELSE expires_at END,
            updated_at = NOW()
      WHERE user_id = $1 AND id = $2
      RETURNING id, label, category, source, state, observation_count, confidence,
        is_temporary, expires_at, confirmed_at, paused_at, created_at, updated_at`,
    [input.userId, input.interestId, input.state],
  );
  return result.rows[0] ? rowToInterest(result.rows[0]) : null;
}

export async function deleteInterest(userId: string, interestId: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM kinfolk_member_interests WHERE user_id = $1 AND id = $2`,
    [userId, interestId],
  );
  return result.rowCount === 1;
}

/**
 * Captures repeatable, broad behaviour after a member opts in. It accepts a
 * category/label selected by the server-side allow-list and stores no message.
 */
export async function recordNonSensitiveInterestSignals(input: {
  userId: string;
  message: unknown;
}): Promise<void> {
  const [settings, ageBand] = await Promise.all([
    getInterestSettings(input.userId),
    getMemberAgeBand(input.userId),
  ]);
  if (!settings.interestRecognitionEnabled || ageBand === "under_13") return;
  const signals = deriveNonSensitiveInterestSignals(input.message);
  for (const signal of signals) {
    const expiresAt = signal.temporary
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : null;
    await pool.query(
      `INSERT INTO kinfolk_member_interests (
         user_id, label, category, source, state, observation_count, confidence,
         is_temporary, expires_at, created_at, updated_at
       ) VALUES ($1, $2, $3, 'conversation_pattern', 'tentative', 1, 35, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id, label) DO UPDATE SET
         source = CASE WHEN kinfolk_member_interests.source = 'explicit' THEN 'explicit' ELSE 'conversation_pattern' END,
         state = CASE
           WHEN kinfolk_member_interests.state IN ('confirmed', 'paused', 'dismissed') THEN kinfolk_member_interests.state
           WHEN kinfolk_member_interests.observation_count + 1 >= 2 THEN 'tentative'
           ELSE kinfolk_member_interests.state
         END,
         observation_count = kinfolk_member_interests.observation_count + 1,
         confidence = LEAST(85, kinfolk_member_interests.confidence + 20),
         is_temporary = CASE WHEN kinfolk_member_interests.state = 'confirmed' THEN false ELSE $4 END,
         expires_at = CASE
           WHEN kinfolk_member_interests.state = 'confirmed' THEN NULL
           WHEN $4 THEN GREATEST(COALESCE(kinfolk_member_interests.expires_at, $5), $5)
           ELSE NULL
         END,
         updated_at = NOW()`,
      [input.userId, signal.label, signal.category, signal.temporary, expiresAt],
    );
  }
}

/**
 * Records a repeated discovery pattern only after an explicit save. The known
 * public listing category is reduced to an allow-listed broad label; health,
 * caregiving, financial, and any other sensitive discovery category is ignored.
 */
export async function recordNonSensitiveDiscoveryInterest(input: {
  userId: string;
  businessCategory: unknown;
}): Promise<void> {
  const categoryText = safeText(input.businessCategory);
  if (!categoryText || SENSITIVE_OR_THIRD_PARTY_CONTEXT.test(categoryText)) return;
  const matched = INTEREST_RULES.find((rule) => rule.pattern.test(categoryText));
  if (!matched) return;
  const [settings, ageBand] = await Promise.all([
    getInterestSettings(input.userId),
    getMemberAgeBand(input.userId),
  ]);
  if (!settings.interestRecognitionEnabled || ageBand === "under_13") return;
  await pool.query(
    `INSERT INTO kinfolk_member_interests (
       user_id, label, category, source, state, observation_count, confidence,
       is_temporary, expires_at, created_at, updated_at
     ) VALUES ($1, $2, $3, 'discovery_pattern', 'tentative', 1, 35, false, NULL, NOW(), NOW())
     ON CONFLICT (user_id, label) DO UPDATE SET
       source = CASE WHEN kinfolk_member_interests.source = 'explicit' THEN 'explicit' ELSE 'discovery_pattern' END,
       state = CASE WHEN kinfolk_member_interests.state IN ('confirmed', 'paused', 'dismissed') THEN kinfolk_member_interests.state ELSE 'tentative' END,
       observation_count = kinfolk_member_interests.observation_count + 1,
       confidence = LEAST(85, kinfolk_member_interests.confidence + 20),
       updated_at = NOW()`,
    [input.userId, matched.label, matched.category],
  );
}

function preferenceInterestLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeInterestLabel(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 8);
}

function recommendationTerms(label: string, category: SafeInterestCategory): string[] {
  const base = [label];
  const categoryTerms: Record<SafeInterestCategory, string[]> = {
    food_and_drink: ["food", "restaurant", "cafe", "bakery", "coffee"],
    arts_and_culture: ["art", "culture", "gallery", "museum", "creative"],
    books_and_learning: ["book", "library", "learning", "education"],
    music_and_audio: ["music", "jazz", "entertainment", "venue"],
    fitness_and_outdoors: ["fitness", "outdoor", "park", "wellness", "sports"],
    games_and_hobbies: ["games", "hobby", "entertainment", "comics"],
    social_and_community: ["community", "event", "social", "network"],
    travel_and_places: ["travel", "hotel", "tour", "experience"],
    beauty_and_style: ["beauty", "hair", "barber", "salon", "spa", "fashion"],
    career_and_learning: ["career", "education", "coworking", "professional"],
  };
  return [...new Set([...base, ...categoryTerms[category]])];
}

function matchesTerms(haystack: string, terms: readonly string[]): boolean {
  const normalized = haystack.toLocaleLowerCase("en-US");
  return terms.some((term) => normalized.includes(term));
}

function normalizedFeedbackScope(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ").slice(0, 100)
    : "";
}

type InterestFeedbackPolicy = {
  boostedCategories: Set<string>;
  hiddenCategories: Set<string>;
  stoppedTopics: Set<string>;
};

async function getInterestFeedbackPolicy(userId: string): Promise<InterestFeedbackPolicy> {
  const result = await pool.query<{ scope_type: string; scope_value: string }>(
    `SELECT scope_type, scope_value
       FROM kinfolk_interest_feedback_scopes
      WHERE user_id = $1`,
    [userId],
  );
  const policy: InterestFeedbackPolicy = {
    boostedCategories: new Set(),
    hiddenCategories: new Set(),
    stoppedTopics: new Set(),
  };
  for (const row of result.rows) {
    const value = normalizedFeedbackScope(row.scope_value);
    if (!value) continue;
    if (row.scope_type === "boost_category") policy.boostedCategories.add(value);
    if (row.scope_type === "hide_category") policy.hiddenCategories.add(value);
    if (row.scope_type === "stop_topic") policy.stoppedTopics.add(value);
  }
  return policy;
}

function ageAllowsEvent(row: { audience_rating: string | null }, ageBand: AgeBand): boolean {
  const rating = String(row.audience_rating ?? "everyone").toLocaleLowerCase("en-US");
  if (ageBand !== "18_plus" && /(18|21|adult)/.test(rating)) return false;
  return ageBand !== "under_13";
}

type PublicBusinessRow = {
  id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  description: string | null;
  tags: unknown;
  price_range: string | null;
  audience_type: string | null;
  environment_tags: unknown;
  amenity_tags: unknown;
  accessibility_features: unknown;
};

type PublicEventRow = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  state: string | null;
  image_url?: string | null;
  description: string | null;
  date: string;
  audience_rating: string | null;
  price: string | null;
};

async function persistRecommendation(input: {
  userId: string;
  resourceType: "business" | "event" | "external_opportunity";
  resourceId: string;
  resourceCategory: string | null;
  interestLabel: string;
  source: "interest" | "circle";
  reason: string;
  rank: number;
}): Promise<{ id: number; status: string }> {
  const result = await pool.query<{ id: number; status: string }>(
    `INSERT INTO kinfolk_interest_recommendations (
       user_id, resource_type, resource_id, resource_category, interest_label, source, reason,
       rank, status, expires_at, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'shown', NOW() + INTERVAL '21 days', NOW(), NOW())
     ON CONFLICT (user_id, resource_type, resource_id) DO UPDATE SET
       resource_category = EXCLUDED.resource_category,
       interest_label = EXCLUDED.interest_label,
       source = EXCLUDED.source,
       reason = EXCLUDED.reason,
       rank = EXCLUDED.rank,
       expires_at = EXCLUDED.expires_at,
       updated_at = NOW()
     RETURNING id, status`,
    [
      input.userId,
      input.resourceType,
      input.resourceId,
      input.resourceCategory,
      input.interestLabel,
      input.source,
      input.reason,
      input.rank,
    ],
  );
  return result.rows[0];
}

async function buildRecommendationsForLabels(input: {
  userId: string;
  labels: Array<{ label: string; category: SafeInterestCategory }>;
  source: "interest" | "circle";
  ageBand: AgeBand;
  constraints?: InterestDiscoveryConstraints;
}): Promise<InterestRecommendation[]> {
  if (!input.labels.length || input.ageBand === "under_13") return [];
  const constraints = input.constraints ?? DEFAULT_INTEREST_DISCOVERY_CONSTRAINTS;
  const [savedResult, businessResult, eventResult, feedbackPolicy] = await Promise.all([
    pool.query<{ business_id: string }>(
      `SELECT business_id FROM saved_places WHERE user_id = $1`,
      [input.userId],
    ),
    pool.query<PublicBusinessRow>(
      `SELECT b.id, b.name, b.category, b.subcategory, b.city, b.state, b.image_url, b.description, b.tags,
              b.price_range, bi.audience_type, bi.environment_tags, bi.amenity_tags, bi.accessibility_features
         FROM businesses b
         LEFT JOIN business_identity bi ON bi.business_id = b.id
        WHERE ${documentedDiscoveryEligibilitySqlPredicate("b.id", "discovery")}
        ORDER BY b.featured DESC, b.confidence_score DESC, b.rating DESC
        LIMIT 60`,
    ),
    pool.query<PublicEventRow>(
      `SELECT id, title, category, city, state, description, date, audience_rating, price
         FROM events
        WHERE status = 'active'
        ORDER BY featured DESC, date ASC
        LIMIT 40`,
    ),
    getInterestFeedbackPolicy(input.userId),
  ]);
  const savedIds = new Set(savedResult.rows.map((row) => row.business_id));
  const candidates: Array<{
    resourceType: "business" | "event";
    resource: InterestRecommendation["resource"];
    interestLabel: string;
  }> = [];

  for (const interest of input.labels) {
    if (feedbackPolicy.stoppedTopics.has(normalizedFeedbackScope(interest.label))) continue;
    const terms = recommendationTerms(interest.label, interest.category);
    for (const business of businessResult.rows) {
      if (savedIds.has(business.id) || candidates.some((candidate) => candidate.resourceType === "business" && candidate.resource.id === business.id)) continue;
      if (feedbackPolicy.hiddenCategories.has(normalizedFeedbackScope(business.category))) continue;
      if (!businessMeetsInterestDiscoveryConstraints(business, constraints)) continue;
      const text = [business.name, business.category, business.subcategory, business.description, JSON.stringify(business.tags ?? [])].filter(Boolean).join(" ");
      if (!matchesTerms(text, terms)) continue;
      candidates.push({
        resourceType: "business",
        resource: {
          id: business.id,
          title: business.name,
          category: business.category,
          city: business.city,
          state: business.state,
          imageUrl: business.image_url,
          detailPath: `/businesses/${encodeURIComponent(business.id)}`,
        },
        interestLabel: interest.label,
      });
      if (candidates.filter((candidate) => candidate.resourceType === "business").length >= 4) break;
    }
    for (const event of eventResult.rows) {
      if (!isUpcomingOneOffEventDate(event.date) || !ageAllowsEvent(event, input.ageBand)) continue;
      if (feedbackPolicy.hiddenCategories.has(normalizedFeedbackScope(event.category))) continue;
      if (!eventMeetsInterestDiscoveryConstraints(event, constraints)) continue;
      if (candidates.some((candidate) => candidate.resourceType === "event" && candidate.resource.id === event.id)) continue;
      const text = [event.title, event.category, event.description].filter(Boolean).join(" ");
      if (!matchesTerms(text, terms)) continue;
      candidates.push({
        resourceType: "event",
        resource: {
          id: event.id,
          title: event.title,
          category: event.category,
          city: event.city,
          state: event.state,
          imageUrl: null,
          detailPath: `/events/${encodeURIComponent(event.id)}`,
          startsOn: event.date,
        },
        interestLabel: interest.label,
      });
      if (candidates.filter((candidate) => candidate.resourceType === "event").length >= 2) break;
    }
  }

  candidates.sort((left, right) => {
    const leftBoost = feedbackPolicy.boostedCategories.has(normalizedFeedbackScope(left.resource.category)) ? 1 : 0;
    const rightBoost = feedbackPolicy.boostedCategories.has(normalizedFeedbackScope(right.resource.category)) ? 1 : 0;
    return rightBoost - leftBoost;
  });
  const shown: InterestRecommendation[] = [];
  for (const [index, candidate] of candidates.slice(0, 5).entries()) {
    const reason = input.source === "circle"
      ? "A deliberately shared Circle interest matches this governed Mapping With Melanin listing."
      : `Matches your ${candidate.interestLabel} interest; this listing is eligible for governed discovery.`;
    const record = await persistRecommendation({
      userId: input.userId,
      resourceType: candidate.resourceType,
      resourceId: candidate.resource.id,
      resourceCategory: candidate.resource.category,
      interestLabel: candidate.interestLabel,
      source: input.source,
      reason,
      rank: index + 1,
    });
    if (record.status === "dismissed") continue;
    shown.push({
      id: record.id,
      resourceType: candidate.resourceType,
      resource: candidate.resource,
      interestLabel: candidate.interestLabel,
      reason,
      source: input.source,
      actions: candidate.resourceType === "business"
        ? ["save", "share", "not_interested", "circle", "more_like_this", "wrong_assumption", "hide_category", "stop_recommending_topic"]
        : ["share", "not_interested", "circle", "more_like_this", "wrong_assumption", "hide_category", "stop_recommending_topic"],
    });
  }
  return shown;
}

export async function getInterestIntelligenceForMember(userId: string): Promise<{
  settings: InterestSettings;
  constraints: InterestDiscoveryConstraints;
  interests: MemberInterest[];
  recommendations: InterestRecommendation[];
  ageBand: AgeBand;
  disclosure: string;
}> {
  const [settings, constraints, interests, ageBand, preferenceResult] = await Promise.all([
    getInterestSettings(userId),
    getInterestDiscoveryConstraints(userId),
    listMemberInterests(userId),
    getMemberAgeBand(userId),
    pool.query<{ favorite_categories: unknown }>(
      `SELECT favorite_categories FROM user_preferences WHERE user_id = $1 LIMIT 1`,
      [userId],
    ),
  ]);
  if (!settings.proactiveDiscoveryEnabled) {
    return {
      settings,
      constraints,
      interests,
      recommendations: [],
      ageBand,
      disclosure: "Proactive recommendations are off. You can still review, edit, pause, or delete your interest evidence.",
    };
  }
  const active = interests
    .filter((interest) => interest.state === "confirmed" && !interest.isTemporary)
    .map((interest) => ({ label: interest.label, category: interest.category }));
  const explicitProfileLabels = preferenceInterestLabels(preferenceResult.rows[0]?.favorite_categories);
  for (const label of explicitProfileLabels) {
    const inferredCategory = INTEREST_RULES.find((rule) => rule.pattern.test(label))?.category;
    if (inferredCategory && !active.some((interest) => interest.label === label)) {
      active.push({ label, category: inferredCategory });
    }
  }
  const recommendations = await buildRecommendationsForLabels({
    userId,
    labels: active.slice(0, 8),
    source: "interest",
    ageBand,
    constraints,
  });
  return {
    settings,
    constraints,
    interests,
    recommendations,
    ageBand,
    disclosure: "Recommendations use only interests you confirmed or explicitly saved in your profile, plus governed public MWM listings and active upcoming MWM events. No raw chat or search text is kept here.",
  };
}

export async function recordRecommendationFeedback(input: {
  userId: string;
  recommendationId: number;
  feedback: RecommendationFeedback;
}): Promise<{ found: boolean; effect: "saved" | "dismissed" | "boosted_category" | "hidden_category" | "stopped_topic" }> {
  const recommendation = await pool.query<{ id: number; resource_category: string | null; interest_label: string }>(
    `SELECT id, resource_category, interest_label
       FROM kinfolk_interest_recommendations WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [input.recommendationId, input.userId],
  );
  const row = recommendation.rows[0];
  if (!row) return { found: false, effect: "dismissed" };
  await pool.query(
    `INSERT INTO kinfolk_interest_recommendation_feedback (user_id, recommendation_id, feedback, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, recommendation_id) DO UPDATE SET feedback = EXCLUDED.feedback, created_at = NOW()`,
    [input.userId, input.recommendationId, input.feedback],
  );
  const category = normalizedFeedbackScope(row.resource_category);
  const topic = normalizedFeedbackScope(row.interest_label);
  if (input.feedback === "more_like_this" && category) {
    await pool.query(
      `INSERT INTO kinfolk_interest_feedback_scopes (user_id, scope_type, scope_value, created_at)
       VALUES ($1, 'boost_category', $2, NOW()) ON CONFLICT DO NOTHING`,
      [input.userId, category],
    );
  }
  if (input.feedback === "hide_category" && category) {
    await pool.query(
      `INSERT INTO kinfolk_interest_feedback_scopes (user_id, scope_type, scope_value, created_at)
       VALUES ($1, 'hide_category', $2, NOW()) ON CONFLICT DO NOTHING`,
      [input.userId, category],
    );
  }
  if (input.feedback === "stop_recommending_topic" && topic) {
    await pool.query(
      `INSERT INTO kinfolk_interest_feedback_scopes (user_id, scope_type, scope_value, created_at)
       VALUES ($1, 'stop_topic', $2, NOW()) ON CONFLICT DO NOTHING`,
      [input.userId, topic],
    );
  }
  const status = input.feedback === "interested" ? "saved" : input.feedback === "more_like_this" ? "shown" : "dismissed";
  await pool.query(
    `UPDATE kinfolk_interest_recommendations
        SET status = $3, updated_at = NOW()
      WHERE id = $1 AND user_id = $2`,
    [
      input.recommendationId,
      input.userId,
      status,
    ],
  );
  if (input.feedback === "more_like_this") return { found: true, effect: "boosted_category" };
  if (input.feedback === "hide_category") return { found: true, effect: "hidden_category" };
  if (input.feedback === "stop_recommending_topic") return { found: true, effect: "stopped_topic" };
  return { found: true, effect: input.feedback === "interested" ? "saved" : "dismissed" };
}

async function assertCircleMembership(circleId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM circle_members WHERE circle_id = $1 AND user_id = $2 LIMIT 1`,
    [circleId, userId],
  );
  return Boolean(result.rows[0]);
}

export async function shareConfirmedInterestWithCircle(input: {
  userId: string;
  circleId: number;
  interestId: number;
}): Promise<"shared" | "not_member" | "not_shareable" | "missing"> {
  if (!(await assertCircleMembership(input.circleId, input.userId))) return "not_member";
  const interest = await pool.query<{ id: number; state: string; is_temporary: boolean }>(
    `SELECT id, state, is_temporary FROM kinfolk_member_interests WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [input.interestId, input.userId],
  );
  if (!interest.rows[0]) return "missing";
  if (interest.rows[0].state !== "confirmed" || interest.rows[0].is_temporary) return "not_shareable";
  await pool.query(
    `INSERT INTO kinfolk_circle_interest_shares (circle_id, user_id, interest_id, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (circle_id, user_id, interest_id) DO NOTHING`,
    [input.circleId, input.userId, input.interestId],
  );
  return "shared";
}

/**
 * A member-approved card is written into the existing Circle suggestion table,
 * so Circle voting and planning use their normal routes. Nothing is shared
 * automatically and no unshared interest or behavioural context is exposed.
 */
export async function shareRecommendedOpportunityWithCircle(input: {
  userId: string;
  circleId: number;
  recommendationId: number;
}): Promise<"shared" | "already_shared" | "not_member" | "missing"> {
  if (!(await assertCircleMembership(input.circleId, input.userId))) return "not_member";
  const existing = await pool.query<{ id: number }>(
    `SELECT id FROM kinfolk_circle_opportunity_shares
      WHERE circle_id = $1 AND user_id = $2 AND recommendation_id = $3 LIMIT 1`,
    [input.circleId, input.userId, input.recommendationId],
  );
  if (existing.rows[0]) return "already_shared";
  const recommendation = await pool.query<{ resource_type: string; resource_id: string }>(
    `SELECT resource_type, resource_id FROM kinfolk_interest_recommendations
      WHERE id = $1 AND user_id = $2 AND status IN ('shown', 'saved') AND expires_at > NOW() LIMIT 1`,
    [input.recommendationId, input.userId],
  );
  const row = recommendation.rows[0];
  if (!row) return "missing";

  let placeName: string | null = null;
  let placeType = "activity";
  let businessId: string | null = null;
  if (row.resource_type === "business") {
    const business = await pool.query<{ name: string }>(`SELECT name FROM businesses WHERE id = $1 LIMIT 1`, [row.resource_id]);
    placeName = business.rows[0]?.name ?? null;
    placeType = "business";
    businessId = row.resource_id;
  } else if (row.resource_type === "event") {
    const event = await pool.query<{ title: string }>(`SELECT title FROM events WHERE id = $1 AND status = 'active' LIMIT 1`, [row.resource_id]);
    placeName = event.rows[0]?.title ?? null;
    placeType = "event";
  } else if (row.resource_type === "external_opportunity") {
    const opportunity = await pool.query<{ title: string }>(
      `SELECT title FROM kinfolk_external_opportunities
        WHERE id = $1 AND user_id = $2 AND verification_state = 'source_confirmed' AND starts_on > NOW() AND expires_at > NOW() LIMIT 1`,
      [row.resource_id, input.userId],
    );
    placeName = opportunity.rows[0]?.title ?? null;
    placeType = "external_opportunity";
  }
  if (!placeName) return "missing";
  const suggestion = await pool.query<{ id: number }>(
    `INSERT INTO circle_suggestions (circle_id, user_id, business_id, place_name, place_type, note, upvotes, created_at)
     VALUES ($1, $2, $3, $4, $5, 'Shared from a member-approved Kinfolk discovery.', 0, NOW())
     RETURNING id`,
    [input.circleId, input.userId, businessId, placeName, placeType],
  );
  await pool.query(
    `INSERT INTO kinfolk_circle_opportunity_shares (circle_id, user_id, recommendation_id, suggestion_id, created_at)
     VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT DO NOTHING`,
    [input.circleId, input.userId, input.recommendationId, suggestion.rows[0].id],
  );
  return "shared";
}

export async function getCircleInterestRecommendations(input: {
  userId: string;
  circleId: number;
}): Promise<{ authorized: boolean; recommendations: InterestRecommendation[] }> {
  if (!(await assertCircleMembership(input.circleId, input.userId))) return { authorized: false, recommendations: [] };
  const [interests, ageBand] = await Promise.all([
    pool.query<{ label: string; category: SafeInterestCategory }>(
      `SELECT DISTINCT i.label, i.category
         FROM kinfolk_circle_interest_shares s
         JOIN kinfolk_member_interests i ON i.id = s.interest_id
        WHERE s.circle_id = $1
          AND i.state = 'confirmed'
          AND i.is_temporary = false
          AND (i.expires_at IS NULL OR i.expires_at > NOW())
        LIMIT 12`,
      [input.circleId],
    ),
    getMemberAgeBand(input.userId),
  ]);
  return {
    authorized: true,
    recommendations: await buildRecommendationsForLabels({
      userId: input.userId,
      labels: interests.rows,
      source: "circle",
      ageBand,
    }),
  };
}

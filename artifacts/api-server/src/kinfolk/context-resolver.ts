/**
 * Kinfolk Context Resolver — v2
 *
 * Implements the spec §5.2 resolveKinfolkContext() contract.
 * Returns a ResolvedQueryContext that drives:
 *   1. LLM short-circuit for needs_clarification / unconfirmed (no LLM call)
 *   2. Temperature selection for entity factual vs. cultural-opinion answers
 *   3. Server-authoritative entity context injected into the system prompt
 *   4. Business recommendation suppression for biography-mode queries
 *   5. Response resolution metadata included in the JSON response
 *
 * Priority order (spec §0):
 *   1. Member's exact current words
 *   2. Verified public cultural/factual context (kinfolk_entities)
 *   3. Explicit and revocable member preferences only
 *   4. Permitted location (explicit request → member-granted → saved home city)
 *   5. Domain-appropriate authoritative data
 *
 * High-consequence intents (medical/legal/financial/safety) bypass entity resolution
 * and ignore affinity preferences entirely.
 */

import {
  resolveEntity,
  buildEntityContextBlock,
  type EntityResolutionResult,
  type ExplicitMemberPreferences,
} from "./entity-resolver";
import { getQueryClass, type QueryClass } from "./intent-router";
import type { KinfolkIntent } from "./intent-router";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResolutionResponseMode =
  | "resolved"           // One source-backed entity clearly wins — proceed to LLM
  | "needs_clarification" // Two+ candidates tie or short-name ambiguity — short-circuit
  | "unconfirmed"        // No active candidate + named-entity query — short-circuit
  | "no_entity";          // No entity resolution needed — normal LLM flow

export type ResolvedQueryContext = {
  responseMode: ResolutionResponseMode;
  queryClass: QueryClass;

  // entity resolution details (set when responseMode = 'resolved')
  entityResolution: EntityResolutionResult | null;
  /** Pre-built system prompt block — inject verbatim; model must not contradict it */
  entityContextBlock: string;
  /** When true: skip local-discovery enrichment; LLM must set recommendations: null */
  suppressBusinessRecommendations: boolean;

  // short-circuit data (set when responseMode = needs_clarification | unconfirmed)
  shortCircuitReply: string | null;
  clarificationQuestion: string | null;

  // preferences used (for transparency in the response)
  preferencesUsed: string[];

  // sources (for the response sources[] field)
  sources: Array<{ title: string; url: string; tier: "A" | "B" | "C" }>;

  // culture opinion flag (drives temperature to 0.5 max instead of 0.2)
  isCultureOpinion: boolean;

  // permitted location resolved by this function
  permittedLocation: { city?: string; latitude?: number; longitude?: number } | null;
};

const HIGH_CONSEQUENCE_INTENTS: KinfolkIntent[] = [
  "medical_health",
  "legal_regulated",
  "financial_regulated",
  "safety_emergency",
];

// ── Resolver ──────────────────────────────────────────────────────────────────

export async function resolveKinfolkContext(input: {
  message: string;
  userId: string | null;
  permittedLocation: { city?: string; latitude?: number; longitude?: number } | null;
  preferences: ExplicitMemberPreferences | null;
  intent: KinfolkIntent;
}): Promise<ResolvedQueryContext> {
  const { message, permittedLocation, intent } = input;

  const queryClass = getQueryClass(message);
  const isCultureOpinion = queryClass === "culture_opinion";

  // ── High-consequence bypass ────────────────────────────────────────────────
  // Medical/legal/financial/safety: no entity resolution, no affinity preferences.
  if (HIGH_CONSEQUENCE_INTENTS.includes(intent)) {
    return {
      responseMode: "no_entity",
      queryClass,
      entityResolution: null,
      entityContextBlock: "",
      suppressBusinessRecommendations: false,
      shortCircuitReply: null,
      clarificationQuestion: null,
      preferencesUsed: [],
      sources: [],
      isCultureOpinion: false,
      permittedLocation,
    };
  }

  // ── Culture opinion short-path ─────────────────────────────────────────────
  // "What do you think about Kendrick and Drake?" → opinion mode, no entity resolution
  if (isCultureOpinion) {
    return {
      responseMode: "no_entity",
      queryClass,
      entityResolution: null,
      entityContextBlock: buildCultureOpinionConstraint(message),
      suppressBusinessRecommendations: true,
      shortCircuitReply: null,
      clarificationQuestion: null,
      preferencesUsed: [],
      sources: [],
      isCultureOpinion: true,
      permittedLocation,
    };
  }

  // ── Named-entity / general flows ──────────────────────────────────────────
  const namedEntityClasses: QueryClass[] = ["named_entity", "general"];
  const shouldResolveEntity = namedEntityClasses.includes(queryClass);

  if (!shouldResolveEntity) {
    // education_nearby, local_business — no entity resolution, normal LLM flow
    return {
      responseMode: "no_entity",
      queryClass,
      entityResolution: null,
      entityContextBlock: "",
      suppressBusinessRecommendations: false,
      shortCircuitReply: null,
      clarificationQuestion: null,
      preferencesUsed: [],
      sources: [],
      isCultureOpinion: false,
      permittedLocation,
    };
  }

  // ── Attempt entity resolution ──────────────────────────────────────────────
  // Preferences passed only when allowCulturalAffinityRanking is explicitly true.
  const effectivePrefs =
    input.preferences?.allowCulturalAffinityRanking ? input.preferences : null;

  let entityResult: EntityResolutionResult;
  try {
    entityResult = await resolveEntity(message, effectivePrefs);
  } catch {
    // DB unavailable — degrade to no_entity (normal LLM flow)
    return {
      responseMode: "no_entity",
      queryClass,
      entityResolution: null,
      entityContextBlock: "",
      suppressBusinessRecommendations: false,
      shortCircuitReply: null,
      clarificationQuestion: null,
      preferencesUsed: [],
      sources: [],
      isCultureOpinion: false,
      permittedLocation,
    };
  }

  // ── Map entity result to response mode ────────────────────────────────────

  if (entityResult.state === "resolved") {
    const isBiographyMode = ["person", "group", "work"].includes(
      entityResult.entity.entityType,
    );
    return {
      responseMode: "resolved",
      queryClass,
      entityResolution: entityResult,
      entityContextBlock: buildEntityContextBlock(entityResult),
      suppressBusinessRecommendations: isBiographyMode,
      shortCircuitReply: null,
      clarificationQuestion: null,
      preferencesUsed: entityResult.preferencesUsed,
      sources: entityResult.sources,
      isCultureOpinion: false,
      permittedLocation,
    };
  }

  if (entityResult.state === "needs_clarification") {
    const question = entityResult.clarificationQuestion;
    return {
      responseMode: "needs_clarification",
      queryClass,
      entityResolution: null,
      entityContextBlock: "",
      suppressBusinessRecommendations: true,
      shortCircuitReply: question,
      clarificationQuestion: question,
      preferencesUsed: [],
      sources: [],
      isCultureOpinion: false,
      permittedLocation,
    };
  }

  // entityResult.state === 'unconfirmed' — but only if the query looks like a named-entity query
  // For general queries that just happen to find no entity, fall through to normal flow
  const unconfirmedReply =
    entityResult.state === "unconfirmed" &&
    entityResult.unconfirmedReason !== "No active source-backed candidate found for this query."
      ? `I can't confirm that right now from a verified source. ${entityResult.qualifier}`
      : null;

  if (unconfirmedReply) {
    return {
      responseMode: "unconfirmed",
      queryClass,
      entityResolution: null,
      entityContextBlock: "",
      suppressBusinessRecommendations: true,
      shortCircuitReply: unconfirmedReply,
      clarificationQuestion: null,
      preferencesUsed: [],
      sources: [],
      isCultureOpinion: false,
      permittedLocation,
    };
  }

  // No entity found for this query — normal LLM flow
  return {
    responseMode: "no_entity",
    queryClass,
    entityResolution: null,
    entityContextBlock: "",
    suppressBusinessRecommendations: false,
    shortCircuitReply: null,
    clarificationQuestion: null,
    preferencesUsed: [],
    sources: [],
    isCultureOpinion: false,
    permittedLocation,
  };
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildCultureOpinionConstraint(message: string): string {
  return [
    "⚡ CULTURAL OPINION MODE",
    "",
    "The member is asking for a cultural reading or opinion, not a factual claim.",
    "You MUST structure your response as a cultural opinion — NOT as an objective winner/loser declaration.",
    "Required structure:",
    "  • Label facts clearly: 'Factually, X released Y in [year]...'",
    "  • Label analysis: 'From a cultural standpoint...' or 'Many critics argue...'",
    "  • Include multiple perspectives: at least two informed viewpoints",
    "  • Include this disclosure naturally in your reply: 'This is a cultural reading, not an objective ranking.'",
    "",
    "DO NOT fabricate lyrics, sales figures, dates, private allegations, or claim an objective winner.",
    "DO NOT attach restaurant or local business recommendations to this cultural opinion query.",
    `Set "recommendations": null for this response.`,
  ].join("\n");
}

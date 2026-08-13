/**
 * Kinfolk Context Resolver
 *
 * Runs after intent classification and before system prompt assembly.
 * Returns a ResolvedContext that the route handler uses to:
 *   1. Inject verified entity facts (server-authoritative) into the system prompt
 *   2. Suppress city/business recommendations for biography-mode queries
 *   3. Gate server-side local discovery enrichment to real discovery requests
 *
 * Design rules (Manus cultural context spec §3):
 * - Privacy + high-consequence policy are applied by the route handler BEFORE this runs
 * - This resolver NEVER sees user ID, saved places, or any inferred identity attributes
 * - It resolves only what the current message explicitly states
 */

import {
  resolveEntities,
  isBiographyQuery,
  buildEntityContextBlock,
  type ResolvedEntity,
} from "./entity-resolver";
import type { KinfolkIntent } from "./intent-router";

export type ResolvedContext = {
  /** Entities resolved from the message with confidence ≥ threshold */
  entities: ResolvedEntity[];
  /** True when the query is about a named person/work, not a place discovery request */
  isBiographyMode: boolean;
  /** Pre-built system prompt block — inject verbatim; model must not contradict it */
  entityContextBlock: string;
  /**
   * When true: skip server-side local-discovery enrichment and instruct the LLM
   * not to attach city or business recommendations this turn.
   */
  suppressBusinessRecommendations: boolean;
};

/**
 * Resolve cultural context for a Kinfolk chat turn.
 *
 * Call AFTER intentClass is determined and BEFORE buildSystemPrompt() is called.
 *
 * @param message      Raw user message (current turn only — not history)
 * @param destination  Resolved destination city (session + message-extracted), or null
 * @param intentClass  Classified intent from the router
 */
export function resolveKinfolkContext(
  message: string,
  destination: string | null,
  intentClass: KinfolkIntent,
): ResolvedContext {
  const entities = resolveEntities(message);
  const biographyMode = isBiographyQuery(message, entities);
  const entityContextBlock = buildEntityContextBlock(entities);

  // Suppress business recommendations when the query is in biography mode.
  // We do NOT suppress for culture_entertainment queries that are genuinely
  // asking for places (e.g. "Show me nightlife in Philadelphia") — those are
  // covered by the biography pattern check, which requires a named entity.
  const suppressBusinessRecommendations = biographyMode;

  return {
    entities,
    isBiographyMode: biographyMode,
    entityContextBlock,
    suppressBusinessRecommendations,
  };
}

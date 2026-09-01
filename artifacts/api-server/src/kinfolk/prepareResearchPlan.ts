import {
  buildDiasporaFirstResearchQuery,
  type SearchContext,
} from "./diasporaFirstResearchPolicy";
import { clarificationPlan, identifyTopicDomain } from "./intentClarification";
import { permittedIdentityContext } from "./permitted-identity-context";

/**
 * Single planning entry point for a Kinfolk research request.
 *
 * Immediate policy: use the current question as the search basis. Do not prepend a
 * universal population and do not append remembered, temporary, location-derived,
 * or preference-derived identity attributes until a purpose-consent ledger exists.
 */
export function prepareKinfolkResearchPlan(question: string, context: SearchContext) {
  const topic = identifyTopicDomain(question);
  const identity = permittedIdentityContext(question);
  return {
    topic,
    researchQuery: buildDiasporaFirstResearchQuery(question, topic, context),
    /** General information is always available. Clarification only improves relevance. */
    answerMode: "general-first" as const,
    clarification: clarificationPlan(question, context.subject),
    permanentLensVersion: "3.0.0",
    identityInferenceProhibited: true,
    demographicQualifier: identity.demographicQualifier,
    communityLabel: identity.communityLabel,
    persistIdentityContext: false as const,
  };
}

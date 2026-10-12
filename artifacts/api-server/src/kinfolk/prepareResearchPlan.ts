import {
  buildDiasporaFirstResearchQuery,
  type SearchContext,
} from "./diasporaFirstResearchPolicy";
import { clarificationPlan, identifyTopicDomain } from "./intentClarification";
import { permittedIdentityContext } from "./permitted-identity-context";

/**
 * Single planning entry point for a Kinfolk research request.
 *
 * The core query remains the member's actual question. The lens planner adds
 * relevance-gated diaspora-first representation tracks separately, and only a
 * separately consented identity memory may personalize a relevant retrieval.
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
    permanentLensVersion: "4.0.0",
    identityInferenceProhibited: true,
    demographicQualifier: identity.demographicQualifier,
    communityLabel: identity.communityLabel,
    persistIdentityContext: false as const,
  };
}

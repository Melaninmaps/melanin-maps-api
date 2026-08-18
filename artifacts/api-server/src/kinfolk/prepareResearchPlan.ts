import {
  buildDiasporaFirstResearchQuery,
  type SearchContext,
} from "./diasporaFirstResearchPolicy";
import { clarificationPlan, identifyTopicDomain } from "./intentClarification";

/**
 * Single planning entry point for every Kinfolk research request.
 *
 * Usage:
 *   const plan = prepareKinfolkResearchPlan(memberQuestion, {
 *     subject: "unknown",
 *     memberContext: loadOnlyExplicitRememberedMemberContext(memberId),
 *   });
 *   // plan.researchQuery is "Black women heart disease" for "heart disease"
 *   const sourceResults = await approvedResearchProvider.search(plan.researchQuery);
 *
 * plan.clarification contains optional steps to offer (never gate) the member.
 * Kinfolk must deliver a general-first answer immediately, then optionally show
 * KinfolkContextClarifier if clarification steps exist.
 */
export function prepareKinfolkResearchPlan(question: string, context: SearchContext) {
  const topic = identifyTopicDomain(question);
  return {
    topic,
    researchQuery: buildDiasporaFirstResearchQuery(question, topic, context),
    /** General information is always available. Clarification only improves relevance. */
    answerMode: "general-first" as const,
    clarification: clarificationPlan(question, context.subject),
    permanentLensVersion: "1.0.0",
    identityInferenceProhibited: true,
  };
}

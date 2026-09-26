/*
 * Browser-safe, member-facing Kinfolk chat response metadata.
 *
 * The server owns the decision. Clients display this additive envelope but never
 * infer a plan, authorize a retrieval, or manufacture a directory card from it.
 */
export type KinfolkPlanKind =
  | "platform_policy"
  | "life_decision"
  | "direct_discovery"
  | "current_or_high_consequence"
  | "general_assistant";

export type KinfolkRetrievalKind =
  | "none"
  | "governed_business_catalog"
  | "existing_authoritative_route"
  | "existing_current_research";

export type KinfolkAnswerMode =
  | "conversation"
  | "draft_or_revision"
  | "policy_plus_action_plan"
  | "life_plan"
  | "cited_answer"
  | "governed_discovery";

/**
 * A deliberately minimal summary of the server decision. It must not contain
 * raw prompts, queries, member history, private memory, or hidden catalog data.
 */
export type KinfolkResponseMeta = Readonly<{
  schemaVersion: 1;
  planKind: KinfolkPlanKind;
  answerMode: KinfolkAnswerMode;
  retrieval: KinfolkRetrievalKind;
  allowBusinessCards: boolean;
  evidenceRequired: boolean;
  requiresClarification: boolean;
}>;

/** Client defense-in-depth: only an explicit governed-discovery decision permits cards. */
export function canRenderKinfolkBusinessCards(
  responseMeta: KinfolkResponseMeta | null | undefined,
): boolean {
  return responseMeta?.planKind === "direct_discovery" &&
    responseMeta.answerMode === "governed_discovery" &&
    responseMeta.retrieval === "governed_business_catalog" &&
    responseMeta.allowBusinessCards === true;
}

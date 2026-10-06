export const CANONICAL_MWM_BUSINESS_ID = "c678e359-0000-4000-8000-000000000001";
export const COMMUNITY_NEED_THRESHOLD = 5;
export const KINFOLK_FEEDBACK_RATE_LIMIT = 8;
export const KINFOLK_FEEDBACK_RATE_LIMIT_WINDOW_MINUTES = 15;

export const KINFOLK_RESPONSE_REACTIONS = [
  "helpful",
  "not_helpful",
  "needs_more_help",
] as const;

export type KinfolkResponseReaction = (typeof KINFOLK_RESPONSE_REACTIONS)[number];
export type CommunityNeedTopicKey =
  | "general_clarity"
  | "sources_and_freshness"
  | "life_insurance_terms"
  | "healthcare_navigation"
  | "benefits_navigation"
  | "money_basics";

/**
 * Topics are member-selected labels, not inferred from a private chat transcript.
 * They are deliberately broad so an aggregate need can never identify a member or
 * reveal a diagnosis, policy, income, or other sensitive personal detail.
 */
export const COMMUNITY_NEED_TOPICS: Readonly<Record<CommunityNeedTopicKey, string>> = {
  general_clarity: "clearer everyday explanations",
  sources_and_freshness: "current sources and freshness",
  life_insurance_terms: "life-insurance terms",
  healthcare_navigation: "navigating care",
  benefits_navigation: "navigating benefits",
  money_basics: "money basics",
};

export function isKinfolkResponseReaction(value: unknown): value is KinfolkResponseReaction {
  return typeof value === "string" && (KINFOLK_RESPONSE_REACTIONS as readonly string[]).includes(value);
}

export function normalizeCommunityNeedTopic(value: unknown): CommunityNeedTopicKey | null {
  if (typeof value !== "string") return null;
  const key = value.trim() as CommunityNeedTopicKey;
  return Object.prototype.hasOwnProperty.call(COMMUNITY_NEED_TOPICS, key) ? key : null;
}

export function communityNeedTopicLabel(topic: string): string | null {
  return Object.prototype.hasOwnProperty.call(COMMUNITY_NEED_TOPICS, topic)
    ? COMMUNITY_NEED_TOPICS[topic as CommunityNeedTopicKey]
    : null;
}

export function isAggregateCommunityNeed(
  reaction: KinfolkResponseReaction,
  topic: CommunityNeedTopicKey | null,
): topic is CommunityNeedTopicKey {
  return reaction === "needs_more_help" && topic !== null;
}

export function buildCommunityNeedOwnerMessage(topic: string, memberCount: number): string | null {
  const label = communityNeedTopicLabel(topic);
  if (!label || memberCount < COMMUNITY_NEED_THRESHOLD) return null;
  return `${memberCount} community members asked for more help with ${label}.`;
}
